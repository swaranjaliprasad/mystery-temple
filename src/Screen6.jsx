import { useEffect, useMemo, useState } from "react";
import "./Screen6.css";

const DURATION_SECONDS = 90;
const SYMBOLS = [
  { id: "sun", glyph: "☀️", name: "SUN", color: "sun" },
  { id: "moon", glyph: "🌙", name: "MOON", color: "moon" },
  { id: "flame", glyph: "🔥", name: "FLAME", color: "flame" },
  { id: "trident", glyph: "🔱", name: "TRIDENT", color: "trident" },
];

// These are real recorded puzzle snapshots, not decorative labels.
// Each timestamp preserves the evidence the player can inspect.
const HISTORY = [
  {
    id: "minus30",
    label: "−30s",
    title: "First trace recovered",
    state: "ARCHIVE SNAPSHOT · T−30",
    evidence: "The Sun mark is the first stable symbol in the original ritual.",
    revealed: ["sun"],
  },
  {
    id: "minus20",
    label: "−20s",
    title: "Second trace recovered",
    state: "ARCHIVE SNAPSHOT · T−20",
    evidence: "The Moon mark was recorded immediately after the Sun mark.",
    revealed: ["sun", "moon"],
  },
  {
    id: "minus10",
    label: "−10s",
    title: "Third trace recovered",
    state: "ARCHIVE SNAPSHOT · T−10",
    evidence: "The Flame mark followed the Moon mark in the intact sequence.",
    revealed: ["sun", "moon", "flame"],
  },
  {
    id: "now",
    label: "NOW",
    title: "Current corrupted state",
    state: "LIVE STATE · CORRUPTED",
    evidence: "The Trident is the final mark. Reconstruct the original order from the recorded snapshots.",
    revealed: ["sun", "moon", "flame", "trident"],
  },
];

const CORRECT_SEQUENCE = ["sun", "moon", "flame", "trident"];

export default function Screen6({ onComplete }) {
  const [timeLeft, setTimeLeft] = useState(DURATION_SECONDS);
  const [selectedHistory, setSelectedHistory] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [status, setStatus] = useState("Inspect the historical snapshots, then activate the four symbols in the original order.");
  const [finished, setFinished] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (finished || timedOut) return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          setTimedOut(true);
          setStatus("The temporal seal collapsed. Restart the ritual and reconstruct the sequence again.");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finished, timedOut]);

  const elapsedRatio = 1 - timeLeft / DURATION_SECONDS;
  const glitchLevel = Math.min(1, elapsedRatio);
  const currentSnapshot = HISTORY[selectedHistory];
  const timeDisplay = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;

  const scrambledSymbols = useMemo(() => {
    // The visual order is intentionally not the answer order.
    return [SYMBOLS[2], SYMBOLS[0], SYMBOLS[3], SYMBOLS[1]];
  }, []);

  function activateSymbol(id) {
    if (finished || timedOut) return;
    const expected = CORRECT_SEQUENCE[sequence.length];

    if (id !== expected) {
      setSequence([]);
      setTimeLeft((previous) => Math.max(0, previous - 8));
      setStatus("Temporal mismatch! The sequence has been cleared and 8 seconds deducted. Use the archive evidence.");
      return;
    }

    const next = [...sequence, id];
    setSequence(next);

    if (next.length === CORRECT_SEQUENCE.length) {
      setFinished(true);
      setStatus("Sequence restored. The temporal seal is stable — the Lost Sanctum is open!");
    } else {
      setStatus(`${next.length}/4 symbols restored. The next symbol must match the historical record.`);
    }
  }

  function restartChallenge() {
    setTimeLeft(DURATION_SECONDS);
    setSelectedHistory(0);
    setSequence([]);
    setStatus("Inspect the historical snapshots, then activate the four symbols in the original order.");
    setFinished(false);
    setTimedOut(false);
  }

  return (
    <main className={`screen6 ${glitchLevel > 0.35 ? "s6-glitching" : ""} ${finished ? "s6-complete" : ""}`}
      style={{ "--glitch-level": glitchLevel }}>
      <header className="s6-header">
        <p className="s6-eyebrow">THE LOST SANCTUM · CHAMBER VI</p>
        <h1>⚡ Chaos Card <span>C3</span></h1>
        <p>Time is corrupting the temple's memory. Inspect the actual archived states, reconstruct the original symbol sequence, and complete the ritual before the seal collapses.</p>
      </header>

      <section className="s6-console">
        <div className="s6-console-top">
          <span className="s6-kicker">C3 // TEMPORAL SANCTUM</span>
          <strong className={`s6-clock ${timeLeft <= 20 ? "urgent" : ""}`} aria-live="polite">{timeDisplay}</strong>
        </div>
        <div className="s6-timer-track" aria-label={`${timeLeft} seconds remaining`}>
          <div className="s6-timer-fill" style={{ width: `${(timeLeft / DURATION_SECONDS) * 100}%` }} />
        </div>

        <h2>Recover the First Sequence</h2>
        <p className="s6-intro">The temple's memory has been corrupted. Select a timestamp to inspect its recorded state and use the evidence to reconstruct the ritual.</p>

        <section className="s6-history" aria-labelledby="s6-history-title">
          <div className="s6-section-title">
            <span id="s6-history-title">TEMPORAL HISTORY</span>
            <span className="s6-live-indicator"><i /> SNAPSHOTS STORED</span>
          </div>
          <div className="s6-timeline">
            {HISTORY.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`s6-timepoint ${selectedHistory === index ? "selected" : ""}`}
                onClick={() => setSelectedHistory(index)}
                aria-pressed={selectedHistory === index}
                disabled={finished || timedOut}
              >
                <span className="s6-time-glyph">{["☀️", "🌙", "🔥", "🔱"][index]}</span>
                <span className="s6-time-label">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="s6-snapshot" aria-live="polite">
            <div className="s6-snapshot-head">
              <span>{currentSnapshot.state}</span>
              <span>STATE {String(selectedHistory + 1).padStart(2, "0")} / 04</span>
            </div>
            <h3>{currentSnapshot.title}</h3>
            <p>{currentSnapshot.evidence}</p>
            <div className="s6-evidence-strip">
              {currentSnapshot.revealed.map((id, index) => {
                const symbol = SYMBOLS.find((item) => item.id === id);
                return <span key={id} className="s6-evidence-symbol" title={symbol.name}>{index + 1}. {symbol.glyph}</span>;
              })}
              {Array.from({ length: 4 - currentSnapshot.revealed.length }).map((_, index) => (
                <span className="s6-evidence-unknown" key={`unknown-${index}`}>?</span>
              ))}
            </div>
          </div>
        </section>

        <section className="s6-ritual" aria-labelledby="s6-ritual-title">
          <div className="s6-section-title">
            <span id="s6-ritual-title">RECONSTRUCT THE RITUAL</span>
            <span>{sequence.length}/4 ACTIVATED</span>
          </div>
          <p className="s6-ritual-hint">The symbols below are deliberately shuffled. Click them in the order proven by the historical snapshots.</p>
          <div className="s6-symbol-grid">
            {scrambledSymbols.map((symbol) => {
              const position = sequence.indexOf(symbol.id);
              return (
                <button
                  key={symbol.id}
                  type="button"
                  className={`s6-symbol ${position !== -1 ? "activated" : ""} s6-${symbol.color}`}
                  onClick={() => activateSymbol(symbol.id)}
                  disabled={finished || timedOut || position !== -1}
                  aria-label={`Activate ${symbol.name}`}
                >
                  <span className="s6-symbol-glyph">{symbol.glyph}</span>
                  <span className="s6-symbol-name">{symbol.name}</span>
                  {position !== -1 && <span className="s6-symbol-order">STEP {position + 1} ✓</span>}
                </button>
              );
            })}
          </div>
          <div className="s6-sequence">
            <span className="s6-sequence-label">YOUR RESTORED SEQUENCE</span>
            <div className="s6-sequence-slots">
              {Array.from({ length: 4 }).map((_, index) => {
                const symbol = SYMBOLS.find((item) => item.id === sequence[index]);
                return <span key={index} className={symbol ? "filled" : ""}>{symbol ? symbol.glyph : "◇"}</span>;
              })}
            </div>
          </div>
        </section>

        <div className={`s6-status ${finished ? "success" : timedOut ? "failure" : ""}`} role="status">
          <span>{finished ? "✧" : timedOut ? "⌛" : "◈"}</span>
          <p>{status}</p>
        </div>

        {finished ? (
          <button className="s6-primary" onClick={() => onComplete?.()}>ENTER THE LOST SANCTUM →</button>
        ) : timedOut ? (
          <button className="s6-primary" onClick={restartChallenge}>↻ RESTART THE RITUAL</button>
        ) : (
          <button className="s6-reset" onClick={() => { setSequence([]); setStatus("Sequence cleared. The timer continues — inspect the snapshots and try again."); }}>
            RESET SYMBOL SEQUENCE
          </button>
        )}
      </section>
      <p className="s6-footer">C3 // TEMPORAL STATE SCRUBBER · 90-SECOND ENTROPY TIMER · GLITCH INTENSITY {Math.round(glitchLevel * 100)}%</p>
    </main>
  );
}
