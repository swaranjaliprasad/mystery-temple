
import { useEffect, useState } from "react";
import Screen5 from "./Screen5.jsx";

const characters = [
  {
    id: "raman",
    name: "RAMAN",
    title: "The Keeper of Wisdom",
    description:
      "A determined seeker of forgotten inscriptions and ancient knowledge.",
    image: "/images/raman.jpeg",
    symbol: "☼",
  },
  {
    id: "raveena",
    name: "RAVEENA",
    title: "The Seeker of Light",
    description:
      "A fearless explorer guided by intuition and ancient mysteries.",
    image: "/images/raveena.jpeg",
    symbol: "✧",
  },
];

const gates = [
  {
    name: "Agni's Trial",
    title: "THE TRIAL OF WISDOM",
    virtue: "Wisdom",
    image: "/images/trial1.jpg",
    riddle:
      "I dance without feet, consume without teeth, and give warmth until my fuel is gone. What am I?",
    answers: ["fire", "a fire"],
    hint: "Think of something that needs fuel to burn and gives off heat.",
    success:
      "The sacred flame awakens. Golden symbols illuminate the stone, and the first gate opens.",
  },
  {
    name: "Chhaya's Trial",
    title: "THE TRIAL OF OBSERVATION",
    virtue: "Observation",
    image: "/images/trial2.jpg",
    riddle:
      "I follow your every step when light is near, but vanish when darkness draws near. What am I?",
    answers: ["shadow", "a shadow"],
    hint: "Look at what your body casts when light shines on it.",
    success:
      "Golden lines spread across the ancient carvings. The second gate opens, revealing the final trial.",
  },
  {
    name: "Nada's Trial",
    title: "THE TRIAL OF INTUITION",
    virtue: "Intuition",
    image: "/images/trial3.jpg",
    riddle:
      "I have no voice of my own, yet I answer when you call. I return your words from stone halls. What am I?",
    answers: ["echo", "an echo"],
    hint: "Shout inside a cave or an empty hall. What sound returns to you?",
    success:
      "All three sacred gates illuminate. The final doorway opens, revealing a secret hidden within the temple.",
  },
];

const inscriptionDialogue = [
  { speaker: "raman", name: "RAMAN", text: "I've configured the seal." },
  { speaker: "raveena", name: "RAVEENA", text: "You set it to disabled." },
  { speaker: "raman", name: "RAMAN", text: "Yes. So nobody can interfere with it." },
  { speaker: "raveena", name: "RAVEENA", text: "Including us." },
  { speaker: "raman", name: "RAMAN", text: "Oh no... I messed up." },
  { speaker: "raveena", name: "RAVEENA", text: "Please tell me you remember how to reverse that." },
];

// C3: historical snapshots reveal the ritual's original activation order.
const RITUAL_SYMBOLS = [
  { id: "sun", symbol: "☀", name: "Sun" },
  { id: "moon", symbol: "☾", name: "Moon" },
  { id: "flame", symbol: "♨", name: "Flame" },
  { id: "trident", symbol: "🔱", name: "Trident" },
];

const RITUAL_HISTORY = [
  { time: "T−60s", title: "First resonance", clue: "The Sun glyph was the first to awaken.", symbol: "☀" },
  { time: "T−45s", title: "Second resonance", clue: "The Moon glyph answered the Sun.", symbol: "☾" },
  { time: "T−30s", title: "Third resonance", clue: "The Flame glyph followed the Moon.", symbol: "♨" },
  { time: "T−15s", title: "Final resonance", clue: "The Trident sealed the original sequence.", symbol: "🔱" },
];

export default function App() {
  const [screen, setScreen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("sanctum") === "moon" || params.get("sanctum") === "sun"
      ? "twin-sanctums"
      : "home";
  });
  const [selected, setSelected] = useState(null);
  const [gateIndex, setGateIndex] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [inscriptionSolved, setInscriptionSolved] = useState(false);
  const [inscriptionFeedback, setInscriptionFeedback] = useState("");
  const [ritualRemaining, setRitualRemaining] = useState(90);
  const [ritualSequence, setRitualSequence] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [ritualFeedback, setRitualFeedback] = useState("Scrub the temporal record, then activate the symbols in their original order.");

  // C3 / Screen 6: one shared 90-second challenge timer. Visual chaos is
  // driven by the remaining time, while the timeline exposes recorded states.
  useEffect(() => {
    if (screen !== "final-ritual") return undefined;

    const startedAt = Date.now();
    setRitualRemaining(90);
    setRitualSequence([]);
    setHistoryIndex(0);
    setRitualFeedback("Scrub the temporal record, then activate the symbols in their original order.");

    const timer = window.setInterval(() => {
      const remaining = Math.max(0, 90 - Math.floor((Date.now() - startedAt) / 1000));
      setRitualRemaining(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        setScreen((current) => current === "final-ritual" ? "ritual-failed" : current);
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, [screen]);

  // Screen 4: keep observing the seal throughout the inscription scene.
  // The element is present from the moment Screen 4 renders, even while hidden
  // behind the dialogue. Changing data-state in DevTools is detected live.
  useEffect(() => {
    if (screen !== "inscription" || inscriptionSolved) return;

    const seal = document.getElementById("hidden-inscription-seal");
    if (!seal) return;

    const checkSeal = () => {
      if (seal.getAttribute("data-state") === "enabled") {
        setInscriptionSolved(true);
        setInscriptionFeedback(
          "Seal restored. Raman and Raveena can finally enter."
        );
      }
    };

    const observer = new MutationObserver(checkSeal);
    observer.observe(seal, {
      attributes: true,
      attributeFilter: ["data-state"],
    });
    checkSeal();

    return () => observer.disconnect();
  }, [screen, inscriptionSolved]);

  const character = characters.find((item) => item.id === selected);
  const gate = gates[gateIndex];
  const gateCompleted = completed.includes(gateIndex);

  function resetGateInput() {
    setAnswer("");
    setFeedback("");
    setShowHint(false);
    setWrongAnswer(false);
  }

  function startGates() {
    setGateIndex(0);
    setCompleted([]);
    resetGateInput();
    setScreen("gates");
  }

  function submitAnswer(event) {
    event.preventDefault();

    const normalized = answer.trim().toLowerCase();

    if (!normalized) {
      setFeedback("Enter your answer before submitting.");
      setWrongAnswer(true);
      return;
    }

    if (gate.answers.includes(normalized)) {
      setCompleted((previous) =>
        previous.includes(gateIndex)
          ? previous
          : [...previous, gateIndex]
      );
      setFeedback(gate.success);
      setWrongAnswer(false);
    } else {
      setFeedback(
        "The gate remains sealed. Reflect on the inscription and try again."
      );
      setWrongAnswer(true);
    }
  }

  function continueAfterGate() {
    if (!gateCompleted) return;

    if (gateIndex < gates.length - 1) {
      setGateIndex((previous) => previous + 1);
      resetGateInput();
    } else {
      setDialogueIndex(0);
      setInscriptionSolved(false);
      setInscriptionFeedback("");
      setScreen("inscription");
    }
  }

  function restartGame() {
    setSelected(null);
    setGateIndex(0);
    setCompleted([]);
    resetGateInput();
    setDialogueIndex(0);
    setInscriptionSolved(false);
    setInscriptionFeedback("");
    setRitualRemaining(90);
    setRitualSequence([]);
    setHistoryIndex(0);
    setRitualFeedback("Scrub the temporal record, then activate the symbols in their original order.");
    setScreen("home");
  }

  function activateRitualSymbol(symbolId) {
    if (screen !== "final-ritual") return;
    const expected = RITUAL_SYMBOLS[ritualSequence.length];
    if (!expected) return;

    if (symbolId !== expected.id) {
      setRitualSequence([]);
      setRitualFeedback("The sequence collapsed. Review the temporal record and begin again.");
      return;
    }

    const next = [...ritualSequence, symbolId];
    setRitualSequence(next);
    if (next.length === RITUAL_SYMBOLS.length) {
      setRitualFeedback("The four symbols resonate. The Lost Sanctum is opening...");
      setScreen("lost-sanctum");
    } else {
      setRitualFeedback(`${expected.name} activated. Continue with the next glyph.`);
    }
  }

  function restartRitual() {
    setRitualRemaining(90);
    setRitualSequence([]);
    setHistoryIndex(0);
    setRitualFeedback("Scrub the temporal record, then activate the symbols in their original order.");
    setScreen("final-ritual");
  }

  function renderImage(src, alt, imageKey, className) {
    if (failedImages[imageKey]) {
      return (
        <div className="character-placeholder">
          ✧
        </div>
      );
    }

    return (
      <img
        className={className}
        src={src}
        alt={alt}
        onError={() =>
          setFailedImages((previous) => ({
            ...previous,
            [imageKey]: true,
          }))
        }
      />
    );
  }

  return (
    <main className="game">
      <style>{`
              .ritual-screen{width:min(980px,100%);margin:24px auto 44px;padding:clamp(20px,4vw,42px);border:1px solid rgba(233,189,112,.32);border-radius:20px;background:linear-gradient(145deg,rgba(17,15,28,.97),rgba(10,12,20,.96));color:#f7eedb;box-shadow:0 20px 70px rgba(0,0,0,.35);position:relative;overflow:hidden}
              .ritual-screen:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.14;background:repeating-linear-gradient(0deg,transparent 0 5px,rgba(206,119,255,.22) 6px 7px);mix-blend-mode:screen}
              .ritual-screen.chaos-rising{animation:ritual-flicker 4s infinite}
              .ritual-screen.chaos-high{animation:ritual-flicker 1.8s infinite;box-shadow:0 0 34px rgba(196,80,255,.2)}
              .ritual-screen.chaos-critical{animation:ritual-flicker .55s infinite;box-shadow:0 0 42px rgba(255,65,130,.3);border-color:#f46eae}
              @keyframes ritual-flicker{0%,92%,100%{filter:none;transform:translateX(0)}93%{filter:hue-rotate(30deg) brightness(1.15);transform:translateX(1px)}96%{filter:contrast(1.2);transform:translateX(-2px)}}
              .ritual-topline{display:flex;justify-content:space-between;gap:16px;align-items:center;position:relative}
              .ritual-kicker{font:700 .72rem Arial,sans-serif;letter-spacing:.2em;color:#e8c779}
              .ritual-clock{font:700 clamp(1.6rem,5vw,2.6rem) Arial,sans-serif;color:#ff8ed6;text-shadow:0 0 20px rgba(255,83,204,.45);font-variant-numeric:tabular-nums}
              .ritual-bar{height:7px;background:#33273f;border-radius:99px;overflow:hidden;margin:10px 0 24px;position:relative}
              .ritual-bar-fill{height:100%;background:linear-gradient(90deg,#e9bd70,#d74ee8,#ff648f);transition:width .2s linear}
              .ritual-screen h2{font-size:clamp(2rem,6vw,3.4rem);margin:12px 0;color:#fff1d0}
              .ritual-copy{color:#c9bfd5;line-height:1.7;max-width:720px}
              .ritual-history{margin:24px 0;padding:18px;border:1px solid rgba(190,144,255,.3);border-radius:13px;background:rgba(31,23,44,.72);position:relative}
              .ritual-history label{display:block;font:700 .72rem Arial,sans-serif;letter-spacing:.14em;color:#d8b9ff;margin-bottom:12px}
              .ritual-history input{width:100%;accent-color:#d86bff;cursor:pointer}
              .ritual-snapshot{display:flex;align-items:center;gap:14px;margin-top:15px;padding:14px;border-radius:10px;background:rgba(8,10,18,.65);border:1px solid rgba(255,255,255,.08)}
              .ritual-snapshot-symbol{font-size:2rem;color:#f2d58e;min-width:42px;text-align:center}
              .ritual-snapshot small{display:block;color:#b6a5c9;font:700 .65rem Arial,sans-serif;letter-spacing:.1em}
              .ritual-snapshot strong{display:block;margin:4px 0;color:#f9e8c4}
              .ritual-symbols{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0;position:relative}
              .ritual-symbol{min-height:110px;border:1px solid rgba(233,189,112,.42);border-radius:13px;background:linear-gradient(145deg,#292039,#141722);color:#f5d995;cursor:pointer;font-size:2rem;transition:transform .18s,border-color .18s,box-shadow .18s}
              .ritual-symbol:hover{transform:translateY(-4px);border-color:#f5d995;box-shadow:0 0 22px rgba(233,189,112,.22)}
              .ritual-symbol:disabled{cursor:default;opacity:.52}
              .ritual-symbol span{display:block;font:700 .65rem Arial,sans-serif;letter-spacing:.1em;margin-top:8px;color:#d4c7e0}
              .ritual-progress{font:700 .75rem Arial,sans-serif;letter-spacing:.08em;color:#b9a4d4}
              .ritual-feedback{padding:13px 15px;border-left:3px solid #d86bff;background:rgba(216,107,255,.08);color:#eadcf5;line-height:1.6;position:relative}
              .ritual-restart{margin-top:18px;padding:12px 18px;border-radius:8px;border:1px solid #e9bd70;background:#e9bd70;color:#1b1420;font-weight:700;cursor:pointer}
              .relic-art{display:block;width:min(260px,75%);margin:22px auto;filter:drop-shadow(0 0 28px rgba(255,207,105,.45));animation:relic-float 3s ease-in-out infinite}
              @keyframes relic-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
              .victory-screen{text-align:center;width:min(900px,100%);margin:30px auto;padding:clamp(24px,5vw,54px);border:1px solid rgba(233,189,112,.4);border-radius:22px;background:radial-gradient(ellipse at 50% 0%,rgba(196,139,54,.22),transparent 55%),rgba(11,14,22,.92);color:#f7eedb}
              .victory-screen h2{font-size:clamp(2.2rem,7vw,4rem);margin:14px 0;color:#ffe6a6;text-shadow:0 0 24px rgba(233,189,112,.35)}
              .victory-screen p{color:#cfc4b3;line-height:1.8}
              @media(max-width:600px){.ritual-topline{align-items:flex-start;flex-direction:column}.ritual-symbols{grid-template-columns:repeat(2,minmax(0,1fr))}.ritual-symbol{min-height:88px}.ritual-screen{margin-top:10px}}
            `}</style>
      <div className="temple-background" aria-hidden="true" />
      <div className="background-shade" aria-hidden="true" />
      <div className="ambient-glow glow-left" aria-hidden="true" />
      <div className="ambient-glow glow-right" aria-hidden="true" />

      <header className="topbar">
        <button className="brand" onClick={restartGame}>
          <span className="brand-icon">✧</span>
          <span>THE LOST SANCTUM</span>
        </button>
        <span className="topbar-caption">
          AN ANCIENT MYSTERY AWAITS
        </span>
      </header>

      <div className="main-content">
        {screen === "home" && (
          <section className="hero" key="home">
            <div className="eyebrow">
              <span className="ornament-line" />
              AN ANCIENT TEMPLE ADVENTURE
              <span className="ornament-line" />
            </div>

            <h1>
              MYSTERY OF
              <br />
              <span className="title-highlight">
                THE LOST SANCTUM
              </span>
            </h1>

            <div className="title-divider">
              <span />
              ✧
              <span />
            </div>

            <p className="hero-description">
              Three sacred gates. Forgotten inscriptions.
              <br />
              One mystery buried through the ages.
            </p>

            <button
              className="gold-button"
              onClick={() => setScreen("characters")}
            >
              BEGIN YOUR JOURNEY
              <span className="button-arrow">→</span>
            </button>

            <p className="hero-note">
              YOUR DESTINY LIES BEYOND THE THREE GATES
            </p>
          </section>
        )}

        {screen === "characters" && (
          <section className="character-screen" key="characters">
            <div className="eyebrow">CHOOSE YOUR DESTINY</div>

            <h2>
              Who will enter <span>the sanctum?</span>
            </h2>

            <p className="section-description">
              Two seekers. Two destinies. One ancient mystery.
            </p>

            <div className="character-grid">
              {characters.map((item, index) => (
                <button
                  key={item.id}
                  className={`character-card ${item.id} ${
                    selected === item.id ? "selected" : ""
                  }`}
                  onClick={() => setSelected(item.id)}
                  aria-pressed={selected === item.id}
                >
                  <div className="character-art">
                    {renderImage(
                      item.image,
                      `Portrait of ${item.name}`,
                      item.id,
                      ""
                    )}

                    <span className="character-number">
                      SEEKER · 0{index + 1}
                    </span>

                    {selected === item.id && (
                      <span className="selected-stamp">
                        ✓ CHOSEN
                      </span>
                    )}
                  </div>

                  <div className="character-info">
                    <h3>{item.name}</h3>
                    <p className="character-title">{item.title}</p>
                    <p className="character-description">
                      {item.description}
                    </p>
                    <span className="select-label">
                      {selected === item.id
                        ? "✓ SELECTED"
                        : "SELECT SEEKER →"}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              className="gold-button continue-button"
              disabled={!character}
              onClick={startGates}
            >
              ENTER THE TEMPLE
              <span className="button-arrow">→</span>
            </button>
          </section>
        )}

        {screen === "gates" && character && (
          <section className="gates-screen" key={`gate-${gateIndex}`}>
            <div className="gate-topline">
              <div className="eyebrow">
                <span className="ornament-line" />
                THE THREE SACRED GATES
                <span className="ornament-line" />
              </div>
              <span className="player-label">
                SEEKER: {character.name}
              </span>
            </div>

            <h2 className="gates-heading">
              Prove your <span>worthiness.</span>
            </h2>

            <p className="section-description">
              Each gate guards an ancient truth. Solve its riddle
              to continue your journey.
            </p>

            <div className="gate-progress">
              {gates.map((item, index) => (
                <div
                  key={item.name}
                  className={`progress-item ${
                    index === gateIndex ? "current" : ""
                  } ${
                    completed.includes(index) ? "completed" : ""
                  } ${
                    index > gateIndex ? "locked" : ""
                  }`}
                >
                  <div className="progress-symbol">
                    {completed.includes(index) ? "✓" : `0${index + 1}`}
                  </div>
                  <span>GATE {index + 1}</span>
                  <small>{item.virtue}</small>
                </div>
              ))}
            </div>

            <article className="gate-panel">
              <div className="gate-image-wrap">
                {renderImage(
                  gate.image,
                  `Temple artwork for ${gate.name}`,
                  `trial${gateIndex + 1}`,
                  "gate-image"
                )}

                <div className="gate-image-overlay" />
                <span className="gate-image-number">
                  SACRED GATE · 0{gateIndex + 1}
                </span>
              </div>

              <div className="gate-content">
                <div className="eyebrow gate-eyebrow">
                  {gate.virtue.toUpperCase()}
                </div>

                <h3>{gate.name}</h3>
                <p className="gate-subtitle">{gate.title}</p>

                <div className="gate-divider">
                  <span />
                  ✧
                  <span />
                </div>

                <p className="riddle-label">
                  THE ANCIENT INSCRIPTION
                </p>
                <p className="riddle-text">{gate.riddle}</p>

                <form className="answer-form" onSubmit={submitAnswer}>
                  <label htmlFor="gate-answer">YOUR ANSWER</label>
                  <input
                    id="gate-answer"
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      setFeedback("");
                      setWrongAnswer(false);
                    }}
                    placeholder="Enter your answer..."
                    autoComplete="off"
                    disabled={gateCompleted}
                  />

                  {!gateCompleted && (
                    <button
                      className="gold-button submit-answer"
                      type="submit"
                    >
                      SUBMIT ANSWER
                      <span className="button-arrow">→</span>
                    </button>
                  )}
                </form>

                {!gateCompleted && (
                  <button
                    className="hint-button"
                    onClick={() => setShowHint((previous) => !previous)}
                  >
                    {showHint ? "HIDE HINT −" : "NEED A HINT? +"}
                  </button>
                )}

                {showHint && !gateCompleted && (
                  <div className="hint-box">
                    <span>HINT</span>
                    <p>{gate.hint}</p>
                  </div>
                )}

                {feedback && (
                  <div
                    className={`gate-feedback ${
                      wrongAnswer ? "incorrect" : "correct"
                    }`}
                    role="status"
                  >
                    <span className="feedback-symbol">
                      {wrongAnswer ? "◇" : "✧"}
                    </span>
                    <p>{feedback}</p>
                  </div>
                )}

                {gateCompleted && (
                  <button
                    className="gold-button next-gate-button"
                    onClick={continueAfterGate}
                  >
                    {gateIndex < gates.length - 1
                      ? "OPEN NEXT GATE"
                      : "ENTER THE HIDDEN CHAMBER"}
                    <span className="button-arrow">→</span>
                  </button>
                )}
              </div>
            </article>

            <p className="gate-footer-note">
              {completed.length} OF 3 SACRED GATES CONQUERED
            </p>
          </section>
        )}

        {screen === "inscription" && character && (
          <section className="inscription-screen" key="inscription">
            <div className="eyebrow">
              <span className="ornament-line" />
              CHALLENGE 1 — PLOT TWIST
              <span className="ornament-line" />
            </div>

            <h2 className="inscription-heading">
              The Hidden <span>Inscription</span>
            </h2>

            <p className="section-description">
              Raman has made a small mistake. Raveena has noticed.
            </p>

            {/* Intentionally inspectable puzzle element: it exists throughout Screen 4. */}
            <div
              id="hidden-inscription-seal"
              className={`dom-seal ${inscriptionSolved ? "seal-solved" : ""}`}
              data-state="disabled"
              data-inscription="sealed"
              aria-hidden={dialogueIndex < inscriptionDialogue.length ? "true" : "false"}
              style={{
                display: dialogueIndex < inscriptionDialogue.length ? "none" : "block",
              }}
            >
              <span className="seal-symbol">
                {inscriptionSolved ? "✧" : "𓂀"}
              </span>
              <p className="seal-label">
                {inscriptionSolved ? "SEAL RESTORED" : "THE SEALED INSCRIPTION"}
              </p>
              <h3>
                {inscriptionSolved ? "Access restored" : "Access restricted"}
              </h3>
              <p>
                {inscriptionSolved
                  ? inscriptionFeedback
                  : "The seal refuses to respond. Its state must be corrected."}
              </p>
            </div>

            {dialogueIndex < inscriptionDialogue.length ? (
              <div className="dialogue-scene">
                <div
                  className={`scene-character scene-raman ${
                    inscriptionDialogue[dialogueIndex].speaker === "raman"
                      ? "is-speaking"
                      : ""
                  }`}
                >
                  {renderImage(
                    "/images/raman.jpeg",
                    "Raman",
                    "raman-scene",
                    "scene-portrait"
                  )}
                  <span className="scene-name">RAMAN</span>
                </div>

                <div
                  className={`scene-character scene-raveena ${
                    inscriptionDialogue[dialogueIndex].speaker === "raveena"
                      ? "is-speaking"
                      : ""
                  }`}
                >
                  {renderImage(
                    "/images/raveena.jpeg",
                    "Raveena",
                    "raveena-scene",
                    "scene-portrait"
                  )}
                  <span className="scene-name">RAVEENA</span>
                </div>

                <div
                  className="scene-speech-bubble"
                  key={dialogueIndex}
                  aria-live="polite"
                >
                  <span className="bubble-speaker">
                    {inscriptionDialogue[dialogueIndex].name}
                  </span>
                  <p>
                    {dialogueIndex === 1 ? (
                      <>You set it to <code>disabled</code>.</>
                    ) : (
                      inscriptionDialogue[dialogueIndex].text
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {!inscriptionSolved ? (
                  <div className="devtools-instruction">
                    <span className="instruction-kicker">AN UNFINISHED INSCRIPTION</span>
                    <p>
                      The seal bears no keyhole, no handle, and no visible mechanism.
                      Yet its markings seem to describe a state that can change.
                    </p>
                    <p className="instruction-note">
                      RAMAN: “It was sealed by a rule, not by a lock.”
                    </p>
                  </div>
                ) : (
                  <div className="inscription-success" role="status">
                    <p>✓ The hidden seal has been restored.</p>
                    <p className="character-reaction">
                      RAMAN: I was about to do that.
                    </p>
                    <button
                      className="gold-button"
                      onClick={() => setScreen("twin-sanctums")}
                    >
                      ENTER THE TWIN SANCTUMS
                      <span className="button-arrow">→</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {dialogueIndex < inscriptionDialogue.length && (
              <div className="dialogue-controls">
                <span className="dialogue-progress">
                  DIALOGUE {dialogueIndex + 1} / {inscriptionDialogue.length}
                </span>
                <button
                  className="gold-button dialogue-next"
                  onClick={() => setDialogueIndex((previous) => previous + 1)}
                >
                  {dialogueIndex === inscriptionDialogue.length - 1
                    ? "INSPECT THE SEAL"
                    : "CONTINUE"}
                  <span className="button-arrow">→</span>
                </button>
              </div>
            )}
          </section>
        )}

        {screen === "twin-sanctums" && (
          <Screen5
            onComplete={() => setScreen("final-ritual")}
          />
        )}

        {screen === "final-ritual" && (
          <section className={`ritual-screen chaos-${ritualRemaining <= 15 ? "critical" : ritualRemaining <= 40 ? "high" : ritualRemaining <= 65 ? "rising" : "calm"}`}>

            <div className="ritual-topline">
              <span className="ritual-kicker">CHALLENGE 3 · CHAOS CARD</span>
              <span className="ritual-clock" aria-live="polite">00:{String(ritualRemaining).padStart(2, "0")}</span>
            </div>
            <div className="ritual-bar" aria-label={`${ritualRemaining} seconds remaining`}>
              <div className="ritual-bar-fill" style={{ width: `${(ritualRemaining / 90) * 100}%` }} />
            </div>
            <p className="ritual-kicker">SCREEN 6 — THE FINAL RITUAL</p>
            <h2>Recover the Temple's Memory</h2>
            <p className="ritual-copy">
              The sanctum is corrupting its own history. Scrub the temporal record to inspect the four recorded resonances, then activate the symbols in chronological order before the 90-second entropy timer expires.
            </p>

            <div className="ritual-history">
              <label htmlFor="temporal-scrubber">TEMPORAL STATE SCRUBBER · INSPECT THE PAST</label>
              <input
                id="temporal-scrubber"
                type="range"
                min="0"
                max={RITUAL_HISTORY.length - 1}
                step="1"
                value={historyIndex}
                onChange={(event) => setHistoryIndex(Number(event.target.value))}
                aria-valuetext={RITUAL_HISTORY[historyIndex].time}
              />
              <div className="ritual-snapshot" aria-live="polite">
                <div className="ritual-snapshot-symbol">{RITUAL_HISTORY[historyIndex].symbol}</div>
                <div>
                  <small>{RITUAL_HISTORY[historyIndex].time} · RECOVERED SNAPSHOT</small>
                  <strong>{RITUAL_HISTORY[historyIndex].title}</strong>
                  <div>{RITUAL_HISTORY[historyIndex].clue}</div>
                </div>
              </div>
            </div>

            <p className="ritual-kicker">ACTIVATE THE SYMBOLS IN CHRONOLOGICAL ORDER</p>
            <div className="ritual-symbols">
              {RITUAL_SYMBOLS.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className="ritual-symbol"
                  onClick={() => activateRitualSymbol(item.id)}
                  disabled={ritualSequence.includes(item.id)}
                  aria-label={`Activate ${item.name}`}
                >
                  {item.symbol}
                  <span>{ritualSequence.includes(item.id) ? "RESONATING ✓" : item.name.toUpperCase()}</span>
                </button>
              ))}
            </div>
            <p className="ritual-progress">{ritualSequence.length} / {RITUAL_SYMBOLS.length} SYMBOLS ACTIVATED</p>
            <div className="ritual-feedback" role="status">{ritualFeedback}</div>
          </section>
        )}

        {screen === "ritual-failed" && (
          <section className="victory-screen">
            <p className="ritual-kicker">SCREEN 6 — RITUAL INTERRUPTED</p>
            <h2>The Sanctum Has Fallen Silent</h2>
            <p>The 90-second entropy window has closed. The temporal record remains, but the ritual must be attempted again.</p>
            <button className="ritual-restart" onClick={restartRitual}>↻ RESTART THE RITUAL</button>
          </section>
        )}

        {screen === "lost-sanctum" && (
          <section className="victory-screen">
            <style>{`
              .victory-screen .ritual-kicker{font:700 .72rem Arial,sans-serif;letter-spacing:.2em;color:#e8c779}
            `}</style>
            <p className="ritual-kicker">SCREEN 7 — THE LOST SANCTUM</p>
            <svg className="relic-art" viewBox="0 0 240 260" role="img" aria-label="A golden sacred relic glowing above an open temple altar">
              <defs>
                <linearGradient id="relic-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff2b8" />
                  <stop offset="48%" stopColor="#e7b95e" />
                  <stop offset="100%" stopColor="#8f5b20" />
                </linearGradient>
              </defs>
              <path d="M35 220 L35 100 L60 100 L60 70 L85 70 L85 45 L155 45 L155 70 L180 70 L180 100 L205 100 L205 220 Z" fill="#34251b" stroke="#d5a64f" strokeWidth="2" />
              <path d="M70 220 L70 130 Q120 72 170 130 L170 220 Z" fill="#11121b" stroke="#e8c779" strokeWidth="2" />
              <path d="M120 74 L139 112 L120 104 L101 112 Z M120 104 L145 145 L120 132 L95 145 Z M120 132 L133 168 L120 160 L107 168 Z" fill="url(#relic-gold)" stroke="#fff0b2" strokeWidth="1.5" />
              <circle cx="120" cy="181" r="15" fill="url(#relic-gold)" />
              <path d="M120 195 L120 215 M99 215 L141 215" stroke="#e8c779" strokeWidth="3" strokeLinecap="round" />
              <circle cx="120" cy="137" r="52" fill="none" stroke="#e8c779" strokeOpacity=".45" strokeDasharray="3 8" />
            </svg>
            <h2>The Lost Sanctum Is Yours</h2>
            <p>The doors open. The relic is revealed. The twin sanctums resonate as one, and the temple remembers its rightful keepers.</p>
            <button className="ritual-restart" onClick={restartGame}>↻ PLAY AGAIN</button>
          </section>
        )}
      </div>

      <footer className="footer">
        <span>✧</span>
        <span>AN ANCIENT MYSTERY · A JOURNEY OF DISCOVERY</span>
        <span>✧</span>
      </footer>
    </main>
  );
}
