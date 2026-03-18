import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { app } from "./src/app";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

type ContentType = "text/html; charset=utf-8" | "text/plain; charset=utf-8" | "text/css; charset=utf-8" | "image/png";

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
	if (filePath.endsWith(".html")) {
		return "text/html; charset=utf-8";
	}
	if (filePath.endsWith(".txt")) {
		return "text/plain; charset=utf-8";
	}
	if (filePath.endsWith(".css")) {
		return "text/css; charset=utf-8";
	}
	if (filePath.endsWith(".png")) {
		return "image/png";
	}
	return null;
}

const server = http.createServer((req, res) => {
	const host = req.headers.host ?? `${HOST}:${PORT}`;
	const urlPath = new URL(req.url ?? "/", `http://${host}`).pathname;

	if (urlPath.startsWith("/api") || urlPath.startsWith("/api-docs")) {
		app(req, res);
		return;
	}

	if (urlPath === "/" || urlPath === "") {
		sendText(
			res,
			[
				"StudySprint - član 1",
				"Poti:",
				"- /funkcionalnosti-odjemalca/",
				"- /posebnosti/",
				"- /api/*",
				"- /api-docs/",
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
	console.log(`StudySprint server (node:http) teče na http://${HOST}:${PORT}`);
});
