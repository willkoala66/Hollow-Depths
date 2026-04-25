import { useEffect, useRef, useState } from "react";
import { VIEW_H, VIEW_W } from "@/game/constants";
import { createGame, updateGame } from "@/game/game";
import { attachInput, createInputState } from "@/game/input";
import { renderGame } from "@/game/render";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [started, setStarted] = useState(false);
  const inputRef = useRef(createInputState());
  const gameRef = useRef(createGame());

  useEffect(() => {
    if (!started) return;
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
      if (ctx) {
        renderGame(ctx, gameRef.current);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, [started]);

  return (
    <div className="game-shell">
      <div className="game-frame">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="game-canvas"
        />
        {!started && <TitleScreen onStart={() => setStarted(true)} />}
      </div>
      <p className="game-credits">
        Hollow Depths — a 2D metroidvania built in canvas
      </p>
    </div>
  );
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.code === "Space" ||
        e.code === "Enter" ||
        e.code === "KeyZ" ||
        e.code === "KeyK"
      ) {
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
        <p className="title-pretitle">A descent in four chambers</p>
        <h1 className="title-name">Hollow Depths</h1>
        <p className="title-subtitle">
          Wake the wraith. Reclaim the throne. Refuse to be still.
        </p>
        <button onClick={onStart} className="title-start">
          BEGIN THE DESCENT
        </button>
        <div className="title-controls">
          <Control label="Move" keys={["←", "→", "A", "D"]} />
          <Control label="Jump" keys={["↑", "W", "Z", "K", "Space"]} />
          <Control label="Dash" keys={["X", "L", "Shift"]} />
          <Control label="Strike" keys={["C", "J"]} />
          <Control label="Pause" keys={["Esc", "P"]} />
        </div>
        <p className="title-hint">
          Click the canvas first if your keys do nothing.
        </p>
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
