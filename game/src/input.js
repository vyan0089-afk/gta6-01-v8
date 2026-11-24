// Keyboard input. Held keys give movement; one-shot presses are queued as flags
// and taken once by the loop, so a press between frames is never lost.
export const ACTION_ENTER = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SAVE = 4;
export const ACTION_RETRY = 8;
export const ACTION_RADIO = 16;
export const ACTION_GARAGE = 32;

export function createInput() {
  const held = new Set();
  let actions = 0;

  const map = {
    KeyW: 'forward', ArrowUp: 'forward',
    KeyS: 'back', ArrowDown: 'back',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'run', ShiftRight: 'run',
    Space: 'handbrake',
  };

  window.addEventListener('keydown', (event) => {
    if (event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) return;
    const name = map[event.code];
    if (name) {
      held.add(name);
      if (['forward', 'back', 'left', 'right'].includes(name)) event.preventDefault();
      return;
    }
    if (event.repeat) return;
    switch (event.code) {
      case 'KeyE': actions |= ACTION_ENTER; break;
      case 'KeyP': case 'Escape': actions |= ACTION_PAUSE; break;
      case 'F5': actions |= ACTION_SAVE; event.preventDefault(); break;
      case 'KeyR': actions |= ACTION_RETRY; break;
      case 'KeyM': actions |= ACTION_RADIO; break;
      case 'KeyG': actions |= ACTION_GARAGE; break;
      default: break;
    }
  });
  window.addEventListener('keyup', (event) => {
    const name = map[event.code];
    if (name) held.delete(name);
  });
  window.addEventListener('blur', () => held.clear());

  function state() {
    return {
      forward: held.has('forward'),
      back: held.has('back'),
      left: held.has('left'),
      right: held.has('right'),
      run: held.has('run'),
      handbrake: held.has('handbrake'),
    };
  }

  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  // For screenshot staging: pretend W is held.
  function pressForward(seconds) {
    held.add('forward');
    setTimeout(() => held.delete('forward'), seconds * 1000);
  }

  return { state, takeActions, pressForward };
}
