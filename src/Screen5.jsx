import { useEffect, useRef, useState } from "react";
import "./Screen5.css";

const CHANNEL_NAME = "mystery-temple-twin-sanctums-v1";
const SYNC_KEY = "mystery-temple-twin-sanctums-progress-v1";

function readSavedProgress() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_KEY) || "{}");
  } catch {
    return {};
  }
}

const PUZZLES = {
  sun: {
    title: "Sun Sanctum",
    icon: "☀",
    color: "sun",
    symbols: ["☀", "Ⅱ", "Ⅲ"],
  },
  moon: {
    title: "Moon Sanctum",
    icon: "☾",
    color: "moon",
    symbols: ["☾", "Ⅰ", "Ⅳ"],
  },
};

const ORDERS = {
  sun: ["sun-1", "sun-2", "sun-3"],
  moon: ["moon-1", "moon-2", "moon-3"],
};

function readSideFromUrl() {
  return new URLSearchParams(window.location.search).get("sanctum") === "moon"
    ? "moon"
    : "sun";
}

export default function Screen5({ onComplete }) {
  const [side] = useState(readSideFromUrl);
  const [portraitSolved, setPortraitSolved] = useState(false);
  const [pieces, setPieces] = useState([null, null, null, null]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [lensRevealed, setLensRevealed] = useState(false);
  const [lens, setLens] = useState({ x: 50, y: 50 });
  const [connected, setConnected] = useState([]);
  const [partnerConnected, setPartnerConnected] = useState([]);
  const [partnerPortraitSolved, setPartnerPortraitSolved] = useState(() => {
    // Recover a previously completed Moon puzzle as soon as the Sun tab loads.
    return Boolean(readSavedProgress().moonPortraitSolved);
  });
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [message, setMessage] = useState(
    side === "sun"
      ? "Restore Raveena's portrait to awaken the Sun Sanctum."
      : "The Moon Sanctum is waiting. Reveal its route and connect the nodes."
  );
  const [finished, setFinished] = useState(false);
  const channelRef = useRef(null);
  const connectedRef = useRef([]);

  const otherSide = side === "sun" ? "moon" : "sun";
  const puzzle = PUZZLES[side];
  const portraitImage = "/images/raveena.jpeg";

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    if (!("BroadcastChannel" in window)) {
      setMessage("This browser does not support BroadcastChannel. Please use a current version of Chrome or Edge.");
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    const sendProgress = () => {
      channel.postMessage({
        type: "PROGRESS",
        side,
        nodes: connectedRef.current,
        complete: connectedRef.current.length === 3,
        portraitSolved,
      });
    };

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || data.side === side) return;

      if (data.type === "HELLO" || data.type === "HEARTBEAT") {
        setPartnerOnline(true);
        sendProgress();
      }

      if (data.type === "PROGRESS") {
        setPartnerOnline(true);
        setPartnerConnected(Array.isArray(data.nodes) ? data.nodes : []);
        if (data.side === "moon" && side === "sun") {
          // A live BroadcastChannel message unlocks the Sun tab immediately.
          if (data.portraitSolved) {
            setPartnerPortraitSolved(true);
            setMessage("✧ Raveena's portrait is restored. The Sun circuit is now unlocked.");
            try {
              const saved = readSavedProgress();
              localStorage.setItem(
                SYNC_KEY,
                JSON.stringify({ ...saved, moonPortraitSolved: true })
              );
            } catch {
              // BroadcastChannel remains the live sync path.
            }
          }
        }
        if (data.complete) setMessage("The other sanctum has completed its challenge.");
      }
    };

    channel.postMessage({ type: "HELLO", side });
    const heartbeat = window.setInterval(() => {
      channel.postMessage({ type: "HEARTBEAT", side });
    }, 1500);

    // localStorage is a backup sync path for when a BroadcastChannel signal
    // was missed or the Sun tab was opened after the Moon puzzle was solved.
    const syncSavedProgress = () => {
      const saved = readSavedProgress();
      if (side === "sun" && saved.moonPortraitSolved) {
        setPartnerPortraitSolved(true);
        setPartnerOnline(true);
        setMessage("✧ Raveena's portrait is restored. The Sun circuit is now unlocked.");
      }
    };

    const handleStorage = (event) => {
      if (event.key === SYNC_KEY) syncSavedProgress();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncSavedProgress);
    document.addEventListener("visibilitychange", syncSavedProgress);

    syncSavedProgress();

    // Polling is a final client-side fallback: it also recovers if a storage
    // event was missed while the tab was backgrounded.
    const syncPoll = window.setInterval(syncSavedProgress, 700);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncSavedProgress);
      document.removeEventListener("visibilitychange", syncSavedProgress);
      window.clearInterval(syncPoll);
      channel.close();
      channelRef.current = null;
    };
  }, [side]);

  useEffect(() => {
    if (side === "moon" && portraitSolved) {
      try {
        const saved = readSavedProgress();
        localStorage.setItem(
          SYNC_KEY,
          JSON.stringify({ ...saved, moonPortraitSolved: true })
        );
      } catch {
        // BroadcastChannel still handles live sync if storage is unavailable.
      }
    }

    channelRef.current?.postMessage({
      type: "PROGRESS",
      side,
      nodes: connected,
      complete: connected.length === 3,
      portraitSolved,
    });
  }, [connected, portraitSolved, side]);

  const bothComplete =
    side === "sun" &&
    connected.length === 3 &&
    partnerConnected.length === 3 &&
    partnerPortraitSolved;

  useEffect(() => {
    if (bothComplete && !finished) {
      setFinished(true);
      setMessage("Both sanctums resonate. The shared temple seal is open!");
    }
  }, [bothComplete, finished]);

  function openTwinSanctum() {
    const url = new URL(window.location.href);
    url.searchParams.set("sanctum", otherSide);
    // The new tab starts directly on Screen 5 because App.jsx reads this URL parameter.
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  function moveLens(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setLens({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
    setLensRevealed(true);
  }

  function placePieceInSlot(slot) {
    if (portraitSolved) return;

    // Clicking an occupied slot with no tray selection returns that piece to the tray.
    if (selectedPiece === null) {
      if (pieces[slot] !== null) {
        const next = [...pieces];
        const removed = next[slot];
        next[slot] = null;
        setPieces(next);
        setSelectedPiece(removed);
        setMessage(`Fragment ${removed + 1} picked up. Choose another position.`);
      }
      return;
    }

    const next = [...pieces];
    const previousSlot = next.indexOf(selectedPiece);
    if (previousSlot !== -1) next[previousSlot] = null;
    next[slot] = selectedPiece;
    setPieces(next);
    setSelectedPiece(null);

    if (next.every((value, index) => value === index)) {
      setPortraitSolved(true);
      setMessage("Raveena's portrait is restored. Return to the Sun Sanctum to awaken its circuit!");
    } else {
      setMessage("That fragment is placed. Keep matching the original portrait.");
    }
  }

  function resetPortrait() {
    setPieces([null, null, null, null]);
    setSelectedPiece(null);
    setPortraitSolved(false);
    setMessage("The portrait has been reset. Select a fragment and try again.");
  }

  function activateNode(nodeId) {
    if (side === "sun" && !partnerPortraitSolved) {
      setMessage("Restore Raveena's portrait in the Moon Sanctum before attempting the Sun circuit.");
      return;
    }
    if (side === "moon" && !portraitSolved) {
      setMessage("Restore Raveena's portrait before attempting the Moon circuit.");
      return;
    }
    if (!lensRevealed) {
      setMessage("Move the X-ray lens across the stone to reveal the hidden route first.");
      return;
    }

    const expected = ORDERS[side][connected.length];
    if (nodeId !== expected) {
      setMessage("The wire flickers. That is not the next node in the sequence.");
      return;
    }

    const next = [...connected, nodeId];
    setConnected(next);
    setMessage(
      next.length === 3
        ? "Your circuit is complete. Waiting for the other sanctum..."
        : "The ancient wire glows. Find the next node."
    );
  }

  function resetCircuit() {
    setConnected([]);
    setLensRevealed(false);
    setFinished(false);
    setMessage("Circuit reset. Reveal the route and try again.");
  }

  const nodes = [
    { id: `${side}-1`, symbol: puzzle.symbols[0], x: 96 },
    { id: `${side}-2`, symbol: puzzle.symbols[1], x: 300 },
    { id: `${side}-3`, symbol: puzzle.symbols[2], x: 504 },
  ];

  return (
    <main className={`screen5 ${side}`}>
      <header className="s5-header">
        <p className="s5-eyebrow">THE LOST SANCTUM · CHAMBER V</p>
        <h1>{puzzle.icon} {puzzle.title}</h1>
        <p className="s5-subtitle">
          {side === "sun"
            ? "Open the Moon Sanctum to restore the portrait, then connect the Sun circuit while the Moon circuit is completed in the other tab."
            : "Restore Raveena's portrait, then reveal the Moon route and connect its nodes while the Sun Sanctum is active in the other tab."}
        </p>
      </header>

      <section className="s5-status-row">
        <div className="s5-status">
          <span className={`s5-status-dot ${partnerOnline ? "online" : ""}`} />
          {partnerOnline ? "Twin sanctum connected" : "Waiting for twin sanctum"}
        </div>
        {side === "sun" ? (
          <button className="s5-secondary" onClick={openTwinSanctum}>
            ☾ Open Moon Sanctum ↗
          </button>
        ) : (
          <span className="s5-return-note">
            ☀ Keep the Sun Sanctum tab open — return there after restoring the portrait.
          </span>
        )}
      </section>
      <p className="s5-hint">
        The other tab opens directly into its own sanctum. Keep both tabs open on the same website address.
      </p>

      {side === "moon" && (
        <section className={`s5-card s5-portrait-card ${portraitSolved ? "portrait-solved" : ""}`}>
          <div className="s5-card-heading">
            <div>
              <span className="s5-eyebrow">☾ TRIAL ONE · THE LOST IMAGE</span>
              <h2>Restore Raveena's Portrait</h2>
            </div>
            <span className="s5-counter">{portraitSolved ? "RESTORED" : "4 FRAGMENTS"}</span>
          </div>
          <p className="s5-description">
            The Moon Sanctum has shattered Raveena's portrait. Select each fragment, then place it in the matching position.
          </p>

          <div className="s5-portrait-board" aria-label="Raveena portrait puzzle">
            {[0, 1, 2, 3].map((slot) => {
              const piece = pieces[slot];
              return (
                <button
                  key={slot}
                  type="button"
                  className={`s5-portrait-slot ${piece !== null ? "filled" : "empty"}`}
                  onClick={() => placePieceInSlot(slot)}
                  aria-label={`Portrait position ${slot + 1}${piece !== null ? `, fragment ${piece + 1}` : ", empty"}`}
                  style={piece === null ? {} : {
                    backgroundImage: `url("${portraitImage}")`,
                    backgroundSize: "200% 200%",
                    backgroundPosition: `${piece % 2 === 0 ? 0 : 100}% ${piece < 2 ? 0 : 100}%`,
                  }}
                  disabled={portraitSolved}
                >
                  {piece === null
                    ? <span className="s5-empty-mark">＋</span>
                    : <span className="s5-piece-number">{piece + 1}</span>}
                </button>
              );
            })}
          </div>

          <p className="s5-piece-instructions">
            {selectedPiece === null
              ? "Choose a fragment below, then choose where it belongs."
              : `Fragment ${selectedPiece + 1} selected — now choose a position on the portrait.`}
          </p>

          <div className="s5-piece-tray" aria-label="Portrait fragments">
            {[2, 0, 3, 1].filter((piece) => !pieces.includes(piece)).map((piece) => (
              <button
                key={piece}
                type="button"
                className={`s5-piece ${selectedPiece === piece ? "selected" : ""}`}
                style={{
                  backgroundImage: `url("${portraitImage}")`,
                  backgroundSize: "200% 200%",
                  backgroundPosition: `${piece % 2 === 0 ? 0 : 100}% ${piece < 2 ? 0 : 100}%`,
                }}
                onClick={() => {
                  setSelectedPiece(piece);
                  setMessage(`Fragment ${piece + 1} selected. Place it in the correct position.`);
                }}
                disabled={portraitSolved}
                aria-label={`Select portrait fragment ${piece + 1}`}
              >
                <span className="s5-piece-label">Fragment {piece + 1}</span>
              </button>
            ))}
          </div>

          <div className="s5-actions s5-portrait-actions">
            <button className="s5-secondary" type="button" onClick={resetPortrait} disabled={portraitSolved}>
              ↻ Redo Portrait Puzzle
            </button>
            <p className="s5-return-note">
              ☀ Once the portrait is restored, return to the original Sun Sanctum tab. Its circuit unlocks automatically.
            </p>
          </div>

          {portraitSolved && (
            <div className="s5-unlocked-note" role="status">
              ☾ Raveena's portrait is restored! Switch back to the Sun Sanctum tab — its node-wire circuit is now unlocked.
            </div>
          )}
        </section>
      )}

      {((side === "sun" && partnerPortraitSolved) || (side === "moon" && portraitSolved)) && (
        <section className="s5-card">
          <div className="s5-card-heading">
            <div>
              <span className="s5-eyebrow">TRIAL TWO · THE HIDDEN ROUTE</span>
              <h2>{puzzle.icon} {puzzle.title} Circuit</h2>
            </div>
            <span className="s5-counter">{connected.length}/3 nodes</span>
          </div>
          <p className="s5-description">
            Move the X-ray lens over the inscription to reveal the concealed wire and glyphs, then connect this sanctum's symbols in sequence. Both circuits must be complete to open the shared seal.
          </p>

          <div className="s5-stone">
            <div className="s5-stone-heading">
              <span>ANCIENT STONE INSCRIPTION</span>
              <span>{lensRevealed ? "X-RAY LENS ACTIVE" : "HIDDEN GLYPHS DETECTED"}</span>
            </div>

            <div className="s5-circuit-wrap" onPointerMove={moveLens}>
              <svg
                className="s5-circuit"
                viewBox="0 0 600 180"
                role="img"
                aria-label={`${puzzle.title} three-node wire circuit with an interactive X-ray lens`}
              >
                <defs>
                  <clipPath id={`xray-clip-${side}`}>
                    <circle cx={lens.x * 6} cy={lens.y * 1.8} r="62" />
                  </clipPath>
                  <linearGradient id={`wire-glow-${side}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f0c66e" />
                    <stop offset="50%" stopColor="#fff2bd" />
                    <stop offset="100%" stopColor="#d9a94f" />
                  </linearGradient>
                </defs>

                {/* The ordinary stone only shows the faint, broken route. */}
                <path className="s5-wire-hidden" d="M 96 90 L 300 90 L 504 90" />
                <path className="s5-wire-hidden s5-wire-branch" d="M 198 90 L 198 48 M 402 90 L 402 132" />

                {/* X-ray layer: the real wire and cipher glyphs are visible only inside the moving lens. */}
                <g clipPath={`url(#xray-clip-${side})`} className="s5-xray-layer">
                  <path
                    className="s5-wire-visible"
                    d="M 96 90 L 300 90 L 504 90 M 198 90 L 198 48 M 402 90 L 402 132"
                    style={{ stroke: `url(#wire-glow-${side})` }}
                  />
                  <g className="s5-hidden-glyph">
                    <circle cx="198" cy="48" r="13" />
                    <text x="198" y="52" textAnchor="middle">☼</text>
                    <circle cx="402" cy="132" r="13" />
                    <text x="402" y="136" textAnchor="middle">☾</text>
                    <text x="300" y="66" textAnchor="middle" className="s5-glyph-caption">FOLLOW THE GLYPHS</text>
                    <text x="300" y="119" textAnchor="middle" className="s5-glyph-order">Ⅰ → Ⅱ → Ⅲ</text>
                  </g>
                </g>

                {/* Nodes stay interactive; the X-ray reveals the hidden route around them. */}
                {nodes.map((node, index) => (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, 90)`}
                    className={`s5-node ${connected.includes(node.id) ? "active" : ""}`}
                    onClick={() => activateNode(node.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Activate node ${index + 1}`}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        activateNode(node.id);
                      }
                    }}
                  >
                    <circle r="29" className="s5-node-ring" />
                    <circle r="23" className="s5-node-core" />
                    <text textAnchor="middle" dominantBaseline="central">{node.symbol}</text>
                    <text y="48" textAnchor="middle" className="s5-node-label">NODE {index + 1}</text>
                  </g>
                ))}

                {/* Lens outline is drawn in SVG so it stays aligned on desktop and mobile. */}
                <circle
                  className={`s5-xray-ring ${lensRevealed ? "active" : ""}`}
                  cx={lens.x * 6}
                  cy={lens.y * 1.8}
                  r="62"
                  pointerEvents="none"
                />
                {!lensRevealed && (
                  <text x="300" y="164" textAnchor="middle" className="s5-xray-prompt">
                    MOVE THE LENS TO REVEAL HIDDEN GLYPHS
                  </text>
                )}
              </svg>
            </div>

            <p className="s5-stone-caption">
              {lensRevealed
                ? "X-ray active: inspect the glowing glyphs, then connect the nodes in sequence."
                : "Move your pointer or finger across the stone to reveal concealed wires and glyphs."}
            </p>
          </div>

          <div className="s5-actions">
            <button className="s5-secondary" onClick={resetCircuit}>Reset Circuit</button>
          </div>
          <div className="s5-clues">
            {["FIRST GLYPH", "SECOND GLYPH", "FINAL GLYPH"].map((clue, index) => (
              <div className="s5-clue" key={clue}>
                <span>{index + 1}</span>
                <p>{clue}</p>
                <strong>{connected.includes(ORDERS[side][index]) ? "✓" : "?"}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="s5-twin-card">
        <div>
          <span className="s5-eyebrow">THE OTHER SANCTUM</span>
          <h2>{PUZZLES[otherSide].icon} {PUZZLES[otherSide].title}</h2>
          <p>{side === "sun"
            ? (partnerOnline
              ? (partnerPortraitSolved
                ? "Raveena's portrait is restored. The Sun circuit is unlocked in this tab."
                : "The Moon Sanctum is connected; its portrait puzzle is still in progress.")
              : "Open the Moon Sanctum in a second tab. This Sun tab will unlock when the portrait is solved.")
            : (portraitSolved
              ? "Portrait restored. Return to the original Sun Sanctum tab — no new Sun tab is needed."
              : "Restore the portrait here. The original Sun tab will receive the unlock signal automatically.")}</p>
        </div>
        <div className="s5-twin-progress">
          <div className="s5-progress-track">
            <div className="s5-progress-fill" style={{ width: `${partnerPortraitSolved ? 100 : 0}%` }} />
          </div>
          <strong>{partnerPortraitSolved ? "Portrait restored ✓" : "Portrait incomplete"}</strong>
        </div>
      </section>

      {side === "sun" && <section className={`s5-final-lock ${bothComplete ? "unlocked" : ""}`}>
        <div className="s5-lock-icon">{bothComplete ? "✧" : side === "moon" ? "☾" : "☀"}</div>
        <div>
          <span className="s5-eyebrow">THE SHARED TEMPLE SEAL</span>
          <h2>{bothComplete ? "The Seal Has Awakened" : "The Final Lock"}</h2>
          <p>{partnerPortraitSolved && connected.length < 3
            ? "The Moon portrait is restored. Complete both the Sun and Moon circuits to continue."
            : message}</p>
        </div>
      </section>}

      {side === "moon" && (
        <section className={`s5-final-lock ${portraitSolved ? "unlocked" : ""}`}>
          <div className="s5-lock-icon">{portraitSolved ? "✓" : "☾"}</div>
          <div>
            <span className="s5-eyebrow">MOON SANCTUM</span>
            <h2>{portraitSolved ? "Portrait Restored" : "The Moonlit Puzzle"}</h2>
            <p>{portraitSolved ? "Return to the Sun Sanctum tab to continue the node-wire trial." : "Arrange all four portrait fragments correctly to unlock the next step."}</p>
          </div>
        </section>
      )}

      {bothComplete && (
        <button className="s5-primary s5-next" onClick={() => onComplete?.()}>
          Enter the Inner Sanctum →
        </button>
      )}
    </main>
  );
}
