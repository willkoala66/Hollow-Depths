export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean;
  dash: boolean;
  dashPressed: boolean;
  shoot: boolean;
  shootPressed: boolean;
  interact: boolean;
  interactPressed: boolean;
  pause: boolean;
  pausePressed: boolean;
}

export function createInputState(): InputState {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    dash: false,
    dashPressed: false,
    shoot: false,
    shootPressed: false,
    interact: false,
    interactPressed: false,
    pause: false,
    pausePressed: false,
  };
}

const KEY_MAP: Record<string, keyof InputState> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down",
  Space: "jump",
  KeyZ: "jump",
  KeyK: "jump",
  ShiftLeft: "dash",
  ShiftRight: "dash",
  KeyX: "dash",
  KeyL: "dash",
  KeyC: "shoot",
  KeyJ: "shoot",
  KeyE: "interact",
  Enter: "interact",
  Escape: "pause",
  KeyP: "pause",
};

export function attachInput(state: InputState): () => void {
  const held = new Set<string>();

  const onDown = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    if (
      e.code === "Space" ||
      e.code === "ArrowUp" ||
      e.code === "ArrowDown" ||
      e.code === "ArrowLeft" ||
      e.code === "ArrowRight"
    ) {
      e.preventDefault();
    }
    if (held.has(e.code)) return;
    held.add(e.code);
    (state as unknown as Record<string, boolean>)[action] = true;
    const pressedKey = `${action}Pressed`;
    if (pressedKey in state) {
      (state as unknown as Record<string, boolean>)[pressedKey] = true;
    }
  };

  const onUp = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    held.delete(e.code);
    // Recompute - only release if no other key for that action is held
    let stillHeld = false;
    for (const code of held) {
      if (KEY_MAP[code] === action) {
        stillHeld = true;
        break;
      }
    }
    if (!stillHeld) {
      (state as unknown as Record<string, boolean>)[action] = false;
    }
  };

  const onBlur = () => {
    held.clear();
    state.left = false;
    state.right = false;
    state.up = false;
    state.down = false;
    state.jump = false;
    state.dash = false;
    state.shoot = false;
    state.interact = false;
    state.pause = false;
  };

  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", onBlur);
  };
}

export function clearPressed(state: InputState) {
  state.jumpPressed = false;
  state.dashPressed = false;
  state.shootPressed = false;
  state.interactPressed = false;
  state.pausePressed = false;
}
