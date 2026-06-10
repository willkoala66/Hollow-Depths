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
  phantom: boolean;
  parry: boolean;
  parryPressed: boolean;
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
    phantom: false,
    parry: false,
    parryPressed: false,
  };
}

const KEY_MAP: Record<string, (keyof InputState)[]> = {
  ArrowLeft: ["left"],
  ArrowRight: ["right"],
  ArrowUp: ["up", "jump"],
  ArrowDown: ["down"],
  KeyZ: ["phantom"],
  KeyX: ["dash"],
  KeyC: ["shoot"],
  KeyV: ["parry"],
  Escape: ["pause"],
};

export function attachInput(state: InputState): () => void {
  const held = new Set<string>();

  const onDown = (e: KeyboardEvent) => {
    const actions = KEY_MAP[e.code];
    if (!actions) return;
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
    for (const action of actions) {
      (state as unknown as Record<string, boolean>)[action] = true;
      const pressedKey = `${action}Pressed`;
      if (pressedKey in state) {
        (state as unknown as Record<string, boolean>)[pressedKey] = true;
      }
    }
  };

  const onUp = (e: KeyboardEvent) => {
    const actions = KEY_MAP[e.code];
    if (!actions) return;
    held.delete(e.code);
    for (const action of actions) {
      let stillHeld = false;
      for (const code of held) {
        const otherActions = KEY_MAP[code];
        if (otherActions && otherActions.includes(action)) {
          stillHeld = true;
          break;
        }
      }
      if (!stillHeld) {
        (state as unknown as Record<string, boolean>)[action] = false;
      }
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
    state.phantom = false;
    state.parry = false;
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
  state.parryPressed = false;
}
