import React, { useEffect, useRef, useState, useCallback } from "react";
import { VIEW_H, VIEW_W } from "@/game/constants";
import { createGame, updateGame, type GameState } from "@/game/game";
import { attachInput, createInputState } from "@/game/input";
import { renderGame } from "@/game/render";

type Screen = "title" | "playing" | "victory" | "leaderboard";

interface LeaderboardEntry {
  id: number;
  name: string;
  totalFrames: number;
  deaths: number;
  hollowFrames: number | null;
  sovereignFrames: number | null;
  playerHpAtHollow: number | null;
  playerHpAtSovereign: number | null;
  playerHpAtHunter: number | null;
  createdAt: string;
}

function formatFrames(frames: number | null | undefined): string {
  if (frames == null) return "—";
  const ms = frames * (1000 / 60);
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${mins}:${secs.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [screen, setScreen] = useState<Screen>("title");
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const prevPausedRef = useRef(false);
  const inputRef = useRef(createInputState());
  const gameRef = useRef<GameState>(createGame());
  const victoryTriggered = useRef(false);

  const startGame = useCallback(() => {
    gameRef.current = createGame();
    victoryTriggered.current = false;
    inputRef.current = createInputState();
    setShowQuitConfirm(false);
    setIsPaused(false);
    prevPausedRef.current = false;
    setScreen("playing");
  }, []);

  const handleResume = useCallback(() => {
    gameRef.current.paused = false;
    prevPausedRef.current = false;
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (screen !== "playing") return;
    const cleanup = attachInput(inputRef.current);
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(now - last, 100);
      last = now;
      acc += dt;
      let safety = 6;
      while (acc >= STEP && safety-- > 0) {
        updateGame(gameRef.current, inputRef.current);
        acc -= STEP;
      }
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) renderGame(ctx, gameRef.current);
      const g = gameRef.current;
      if (g.paused !== prevPausedRef.current) {
        prevPausedRef.current = g.paused;
        setIsPaused(g.paused);
      }
      if (g.victory && g.victoryTimer > 90 && !victoryTriggered.current) {
        victoryTriggered.current = true;
        setScreen("victory");
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, [screen]);

  return (
    <div className="game-shell">
      <div className="game-frame">
        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="game-canvas" />
        {screen === "title" && (
          <TitleScreen onStart={startGame} onLeaderboard={() => setScreen("leaderboard")} />
        )}
        {screen === "victory" && (
          <VictoryScreen
            game={gameRef.current}
            onLeaderboard={() => setScreen("leaderboard")}
            onPlayAgain={startGame}
          />
        )}
        {screen === "leaderboard" && (
          <LeaderboardScreen
            onBack={() => setScreen("title")}
            onPlayAgain={startGame}
          />
        )}
        {screen === "playing" && isPaused && !showQuitConfirm && (
          <PauseOverlay
            onResume={handleResume}
            onQuit={() => setShowQuitConfirm(true)}
          />
        )}
        {showQuitConfirm && (
          <QuitConfirmModal
            onConfirm={() => { setShowQuitConfirm(false); setScreen("title"); }}
            onCancel={() => setShowQuitConfirm(false)}
          />
        )}
      </div>
      <p className="game-credits">Hollow Depths — a 2D metroidvania built in canvas</p>
    </div>
  );
}

function PauseOverlay({
  onResume,
  onQuit,
}: {
  onResume: () => void;
  onQuit: () => void;
}) {
  return (
    <div className="title-overlay" style={{ backdropFilter: "blur(3px)", background: "rgba(4,1,12,0.72)" }}>
      <div className="pause-panel">
        <p className="pause-title">Paused</p>
        <div className="pause-controls">
          <Control label="Move" keys={["←", "→"]} />
          <Control label="Jump" keys={["↑"]} />
          <Control label="Dash" keys={["X"]} />
          <Control label="Strike" keys={["C"]} />
          <Control label="Phantom Veil" keys={["Z (hold)"]} />
          <Control label="Pause" keys={["Esc"]} />
        </div>
        <div className="pause-actions">
          <button className="title-start" onClick={onResume}>
            RESUME
          </button>
          <button className="title-lb-btn" onClick={onQuit}>
            RETURN TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
}

function QuitConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") { e.preventDefault(); onCancel(); }
      if (e.code === "Enter") { e.preventDefault(); onConfirm(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  return (
    <div className="quit-modal-bg" onClick={onCancel}>
      <div className="quit-modal" onClick={(e) => e.stopPropagation()}>
        <p className="quit-modal-title">Return to Title?</p>
        <p className="quit-modal-body">
          Your run will end and progress will not be saved.
        </p>
        <div className="quit-modal-actions">
          <button className="title-start" onClick={onConfirm}>
            QUIT RUN
          </button>
          <button className="title-lb-btn" onClick={onCancel}>
            KEEP PLAYING
          </button>
        </div>
      </div>
    </div>
  );
}

function TitleScreen({
  onStart,
  onLeaderboard,
}: {
  onStart: () => void;
  onLeaderboard: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyZ" || e.code === "Enter") {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  return (
    <div className="title-overlay">
      <div className="title-stack">
        <p className="title-pretitle">A descent through two sublayers</p>
        <h1 className="title-name">Hollow Depths</h1>
        <p className="title-subtitle">Sublayer 1: ten chambers, a sleeping throne.</p>
        <p className="title-subtitle" style={{ opacity: 0.65, marginTop: -8 }}>
          Sublayer 2: the wraith you woke is hunting you.
        </p>
        <div className="title-btn-row">
          <button onClick={onStart} className="title-start">
            BEGIN THE DESCENT
          </button>
          <button onClick={onLeaderboard} className="title-lb-btn">
            LEADERBOARD
          </button>
        </div>
        <div className="title-controls">
          <Control label="Move" keys={["←", "→"]} />
          <Control label="Jump" keys={["↑"]} />
          <Control label="Dash" keys={["X"]} />
          <Control label="Strike" keys={["C"]} />
          <Control label="Phantom Veil" keys={["Z (hold)"]} />
          <Control label="Pause" keys={["Esc"]} />
        </div>
        <p className="title-hint">Click the canvas first if keys do nothing.</p>
      </div>
    </div>
  );
}

function Control({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="control-row">
      <span className="control-label">{label}</span>
      <span className="control-keys">
        {keys.map((k) => (
          <kbd key={k}>{k}</kbd>
        ))}
      </span>
    </div>
  );
}

function VictoryScreen({
  game,
  onLeaderboard,
  onPlayAgain,
}: {
  game: GameState;
  onLeaderboard: () => void;
  onPlayAgain: () => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const runFrames = game.hunterDefeatedTime ?? game.gameTime;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          totalFrames: runFrames,
          deaths: game.deaths,
          hollowFrames: game.hollowDefeatedTime ?? null,
          sovereignFrames: game.sovereignDefeatedTime ?? null,
          playerHpAtHollow: game.playerHpAtHollow || null,
          playerHpAtSovereign: game.playerHpAtSovereign || null,
          playerHpAtHunter: game.playerHpAtHunter || null,
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="title-overlay">
      <div className="victory-panel">
        <p className="victory-pre">TRUE ENDING</p>
        <h2 className="victory-title">The Wraith is Unmade</h2>
        <div className="victory-stats">
          <StatRow label="Final Time" value={formatFrames(runFrames)} highlight />
          <StatRow label="Deaths" value={String(game.deaths)} />
          <StatRow label="Hollow slain at" value={formatFrames(game.hollowDefeatedTime)} />
          <StatRow label="Sovereign slain at" value={formatFrames(game.sovereignDefeatedTime)} />
          <StatRow
            label="HP remaining"
            value={`${game.playerHpAtHunter} / ${game.player.maxHp}`}
          />
        </div>

        {status !== "done" ? (
          <form onSubmit={handleSubmit} className="victory-form">
            <input
              className="victory-input"
              type="text"
              placeholder="Enter your name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              autoFocus
            />
            <button
              type="submit"
              className="title-start"
              disabled={status === "loading" || !name.trim()}
            >
              {status === "loading" ? "SAVING…" : "ADD TO LEADERBOARD"}
            </button>
            {status === "error" && (
              <p className="victory-error">Failed to save — check your connection.</p>
            )}
          </form>
        ) : (
          <p className="victory-saved">✓ Run recorded</p>
        )}

        <div className="victory-actions">
          <button className="title-lb-btn" onClick={onLeaderboard}>
            VIEW LEADERBOARD
          </button>
          <button className="title-lb-btn" onClick={onPlayAgain}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-row${highlight ? " stat-highlight" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function LeaderboardScreen({
  onBack,
  onPlayAgain,
}: {
  onBack: () => void;
  onPlayAgain: () => void;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json() as Promise<LeaderboardEntry[]>;
      })
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="title-overlay lb-overlay">
      <div className="lb-panel">
        <h2 className="lb-title">LEADERBOARD</h2>

        {loading && <p className="lb-empty">Loading…</p>}
        {error && <p className="lb-empty">Could not reach the server.</p>}
        {!loading && !error && entries.length === 0 && (
          <p className="lb-empty">No runs yet — be the first to descend.</p>
        )}
        {!loading && !error && entries.length > 0 && (
          <div className="lb-table-wrap">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Time</th>
                  <th>Deaths</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <React.Fragment key={e.id}>
                    <tr
                      className={`lb-row${expanded === e.id ? " lb-row-open" : ""}`}
                      onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    >
                      <td className="lb-rank">{i + 1}</td>
                      <td className="lb-name">{e.name}</td>
                      <td className="lb-time">{formatFrames(e.totalFrames)}</td>
                      <td className="lb-deaths">{e.deaths}</td>
                      <td className="lb-chevron">{expanded === e.id ? "▲" : "▼"}</td>
                    </tr>
                    {expanded === e.id && (
                      <tr className="lb-detail-row">
                        <td colSpan={5}>
                          <div className="lb-detail">
                            <DetailStat
                              label="Hollow slain at"
                              value={formatFrames(e.hollowFrames)}
                            />
                            <DetailStat
                              label="Sovereign slain at"
                              value={formatFrames(e.sovereignFrames)}
                            />
                            <DetailStat
                              label="HP at Hollow"
                              value={e.playerHpAtHollow != null ? String(e.playerHpAtHollow) : "—"}
                            />
                            <DetailStat
                              label="HP at Sovereign"
                              value={e.playerHpAtSovereign != null ? String(e.playerHpAtSovereign) : "—"}
                            />
                            <DetailStat
                              label="HP at Hunter kill"
                              value={e.playerHpAtHunter != null ? String(e.playerHpAtHunter) : "—"}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="victory-actions">
          <button className="title-lb-btn" onClick={onBack}>
            BACK TO TITLE
          </button>
          <button className="title-lb-btn" onClick={onPlayAgain}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
