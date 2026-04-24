'use strict';

// ── VoiceController ───────────────────────────────────────────────────────────
// Wraps the Web Speech API (SpeechRecognition + SpeechSynthesis).
// Exposed as a plain global – no ES-module export needed.

class VoiceController {
  constructor() {
    this._commands     = [];
    this._active       = false;
    this._recognition  = null;
    this._synthesis    = window.speechSynthesis || null;
    this._toastTimer   = null;
    this._supported    = ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    if (this._supported) {
      this._initRecognition();
    }
  }

  // ── Internal: set up SpeechRecognition ──────────────────────────────────────
  _initRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();

    rec.lang            = 'sl-SI';
    rec.continuous      = true;
    rec.interimResults  = false;
    rec.maxAlternatives = 3;

    rec.onresult = (e) => {
      const result = e.results[e.results.length - 1];
      if (!result.isFinal) return;

      const transcripts = [];
      for (let i = 0; i < result.length; i++) {
        transcripts.push(result[i].transcript.trim().toLowerCase());
      }

      this._handleTranscripts(transcripts);
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        this._showToast('Mikrofon ni dostopen. Prosim dovoli dostop v nastavitvah brskalnika.');
        this._setListening(false);
        this._active = false;
      } else if (e.error === 'no-speech') {
        // silently ignore – recognition will restart via onend
      } else if (e.error !== 'aborted') {
        console.warn('[VoiceController] recognition error:', e.error);
        this._showToast(`Napaka glasovnega vmesnika: ${e.error}`);
      }
    };

    rec.onend = () => {
      // auto-restart when still in "listening" mode
      if (this._active) {
        try { rec.start(); } catch (_) { /* already started race */ }
      }
    };

    this._recognition = rec;
  }

  // ── Internal: match transcripts against registered commands ─────────────────
  _handleTranscripts(transcripts) {
    if (!transcripts.length) return;

    this._showToast(`🎙 "${transcripts[0]}"`);

    document.dispatchEvent(new CustomEvent('voice:transcript', {
      detail: { transcripts }
    }));

    for (const transcript of transcripts) {
      for (const cmd of this._commands) {
        for (const pattern of cmd.patterns) {
          const match = this._matchPattern(pattern, transcript);
          if (match) {
            // run handler
            try { cmd.handler(match); } catch (err) {
              console.warn('[VoiceController] handler error:', err);
            }

            // speak response
            const responseText = typeof cmd.response === 'function'
              ? cmd.response(match)
              : cmd.response;
            if (responseText) this.speak(responseText);

            document.dispatchEvent(new CustomEvent('voice:command', {
              detail: { transcript: transcripts[0], match }
            }));

            return; // first match wins
          }
        }
      }
    }
  }

  // ── Internal: test a single pattern against a transcript ────────────────────
  _matchPattern(pattern, transcript) {
    if (pattern instanceof RegExp) {
      return transcript.match(pattern);
    }
    // string pattern: exact or substring match (case-insensitive, trimmed)
    const t = transcript.trim().toLowerCase();
    const p = String(pattern).trim().toLowerCase();
    if (t === p || t.includes(p)) return [transcript];
    return null;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Register a voice command.
   * @param {{ patterns: Array<string|RegExp>, handler: Function, response: string|Function }} cmd
   */
  addCommand(cmd) {
    this._commands.push(cmd);
  }

  /** Speak text via SpeechSynthesis. */
  speak(text) {
    if (!this._synthesis) return;
    this._synthesis.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    utt.lang   = 'sl-SI';
    utt.rate   = 1.0;
    utt.pitch  = 1.0;
    this._synthesis.speak(utt);
  }

  /** Start listening. */
  start() {
    if (!this._supported) {
      console.warn('[VoiceController] SpeechRecognition not supported in this browser');
      return;
    }
    if (this._active) return;
    this._active = true;
    this._setListening(true);
    try { this._recognition.start(); } catch (err) {
      console.warn('[VoiceController] start error:', err);
    }
  }

  /** Stop listening. */
  stop() {
    this._active = false;
    this._setListening(false);
    try { this._recognition.stop(); } catch (_) {}
  }

  /** Toggle listening on/off. */
  toggle() {
    if (this._active) this.stop();
    else this.start();
  }

  /** Whether Web Speech API is available in this browser. */
  get isSupported() { return this._supported; }

  // ── Internal: update UI state ────────────────────────────────────────────────
  _setListening(on) {
    const btn  = document.getElementById('voice-toggle-btn');
    const ind  = document.getElementById('voice-indicator');
    if (btn) btn.classList.toggle('listening', on);
    if (ind) ind.classList.toggle('hidden', !on);
  }

  _showToast(text) {
    const el = document.getElementById('voice-toast');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden', 'voice-toast--fade');

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      el.classList.add('voice-toast--fade');
      setTimeout(() => el.classList.add('hidden'), 350);
    }, 3200);
  }
}
