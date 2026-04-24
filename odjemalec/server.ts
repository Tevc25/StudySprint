import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { app } from "./src/app";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

type ContentType =
	| "text/html; charset=utf-8"
	| "text/plain; charset=utf-8"
	| "text/css; charset=utf-8"
	| "application/javascript; charset=utf-8"
	| "application/json; charset=utf-8"
	| "image/png"
	| "image/svg+xml"
	| "image/x-icon";

function sendText(res: http.ServerResponse, text: string, statusCode = 200): void {
	res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
	res.end(text);
}

function sendFile(res: http.ServerResponse, filePath: string, contentType: ContentType): void {
	fs.readFile(filePath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
		if (err) {
			sendText(res, "Napaka pri branju datoteke.", 500);
			return;
		}
		res.writeHead(200, { "Content-Type": contentType });
		res.end(data);
	});
}

function contentTypeFor(filePath: string): ContentType | null {
	if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
	if (filePath.endsWith(".txt")) return "text/plain; charset=utf-8";
	if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
	if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
	if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
	if (filePath.endsWith(".png")) return "image/png";
	if (filePath.endsWith(".svg")) return "image/svg+xml";
	if (filePath.endsWith(".ico")) return "image/x-icon";
	return null;
}

// ── PNG icon generator (no external deps) ─────────────────────────────────────
function crc32(buf: Buffer): number {
	const table: number[] = [];
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c;
	}
	let crc = 0xffffffff;
	for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
	const typeBytes = Buffer.from(type, "ascii");
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const crcBytes = Buffer.alloc(4);
	crcBytes.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
	return Buffer.concat([len, typeBytes, data, crcBytes]);
}

function generateIconPng(size: number, bgR: number, bgG: number, bgB: number): Buffer {
	const raw = Buffer.alloc(size * (1 + size * 3));
	const margin = Math.round(size * 0.18);
	const inner = size - margin * 2;
	const cr = Math.round(inner * 0.2);

	for (let y = 0; y < size; y++) {
		const row = y * (1 + size * 3);
		raw[row] = 0; // filter: None
		for (let x = 0; x < size; x++) {
			// Check if pixel is inside the inner rounded rectangle (white element)
			const lx = x - margin, ly = y - margin;
			let inRect = lx >= 0 && lx < inner && ly >= 0 && ly < inner;
			if (inRect) {
				const cx = lx < cr ? cr : lx >= inner - cr ? inner - cr - 1 : lx;
				const cy = ly < cr ? cr : ly >= inner - cr ? inner - cr - 1 : ly;
				if ((lx < cr || lx >= inner - cr) && (ly < cr || ly >= inner - cr)) {
					const dx = lx - cx, dy = ly - cy;
					inRect = Math.sqrt(dx * dx + dy * dy) <= cr;
				}
			}
			const r = inRect ? 255 : bgR;
			const g = inRect ? 255 : bgG;
			const b = inRect ? 255 : bgB;
			raw[row + 1 + x * 3] = r;
			raw[row + 1 + x * 3 + 1] = g;
			raw[row + 1 + x * 3 + 2] = b;
		}
	}

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8; ihdr[9] = 2;

	const compressed = zlib.deflateSync(raw, { level: 6 });

	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		pngChunk("IHDR", ihdr),
		pngChunk("IDAT", compressed),
		pngChunk("IEND", Buffer.alloc(0)),
	]);
}

function generateIcons(): void {
	const iconsDir = path.join(PUBLIC_DIR, "pwa", "icons");
	fs.mkdirSync(iconsDir, { recursive: true });

	// Brand colour: #4361ee → rgb(67, 97, 238)
	const [r, g, b] = [67, 97, 238];

	const icons: [string, number][] = [
		["icon-192.png", 192],
		["icon-512.png", 512],
		["icon-maskable.png", 512],
	];

	for (const [name, size] of icons) {
		const dest = path.join(iconsDir, name);
		if (!fs.existsSync(dest)) {
			fs.writeFileSync(dest, generateIconPng(size, r, g, b));
		}
	}
}

generateIcons();

// ─────────────────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
	const host = req.headers.host ?? `${HOST}:${PORT}`;
	const urlPath = new URL(req.url ?? "/", `http://${host}`).pathname;

	// Express handles all API, docs and OAuth routes
	if (
		urlPath.startsWith("/api") ||
		urlPath.startsWith("/api-docs") ||
		urlPath.startsWith("/oauth")
	) {
		app(req, res);
		return;
	}

	if (urlPath === "/" || urlPath === "") {
		sendText(
			res,
			[
				"StudySprint - član 1",
				"",
				"Poti:",
				"- /pwa/                  (PWA aplikacija)",
				"- /funkcionalnosti-odjemalca/",
				"- /posebnosti/",
				"- /api/*                 (REST API)",
				"- /api-docs/             (Swagger UI)",
			].join("\n"),
		);
		return;
	}

	if (urlPath === "/funkcionalnosti-odjemalca" || urlPath === "/funkcionalnosti-odjemalca/") {
		sendFile(res, path.join(PUBLIC_DIR, "funkcionalnosti-odjemalca.html"), "text/html; charset=utf-8");
		return;
	}

	if (urlPath === "/posebnosti" || urlPath === "/posebnosti/") {
		sendFile(res, path.join(PUBLIC_DIR, "posebnosti.txt"), "text/plain; charset=utf-8");
		return;
	}

	// PWA static files
	if (urlPath === "/pwa" || urlPath === "/pwa/") {
		sendFile(res, path.join(PUBLIC_DIR, "pwa", "index.html"), "text/html; charset=utf-8");
		return;
	}

	if (urlPath.startsWith("/pwa/")) {
		const relPath = urlPath.slice("/pwa/".length);
		const filePath = path.resolve(PUBLIC_DIR, "pwa", relPath);
		const safePwaRoot = path.resolve(PUBLIC_DIR, "pwa");

		if (!filePath.startsWith(safePwaRoot)) {
			sendText(res, "Neveljavna pot.", 400);
			return;
		}

		const type = contentTypeFor(filePath);
		if (!type) {
			sendText(res, "Nepodprt tip datoteke.", 415);
			return;
		}

		sendFile(res, filePath, type);
		return;
	}

	if (urlPath.startsWith("/assets/")) {
		const relativeAssetPath = urlPath.slice("/assets/".length);
		const assetPath = path.resolve(PUBLIC_DIR, "assets", relativeAssetPath);
		const safeAssetsRoot = path.resolve(PUBLIC_DIR, "assets");

		if (!assetPath.startsWith(safeAssetsRoot)) {
			sendText(res, "Neveljavna pot.", 400);
			return;
		}

		const type = contentTypeFor(assetPath);
		if (!type) {
			sendText(res, "Nepodprt tip datoteke.", 415);
			return;
		}

		sendFile(res, assetPath, type);
		return;
	}

	sendText(res, "404 - Pot ne obstaja.", 404);
});

server.on("error", (err: NodeJS.ErrnoException) => {
	if (err.code === "EADDRINUSE") {
		console.error(`Vrata ${PORT} so že v uporabi. Ustavi obstoječi proces ali nastavi PORT.`);
		process.exit(1);
	}
	console.error("Napaka strežnika:", err.message);
	process.exit(1);
});

server.listen(PORT, HOST, () => {
	console.log(`StudySprint server teče na http://${HOST}:${PORT}`);
	console.log(`  PWA:            http://${HOST}:${PORT}/pwa/`);
	console.log(`  Dokumentacija:  http://${HOST}:${PORT}/api-docs`);
});
