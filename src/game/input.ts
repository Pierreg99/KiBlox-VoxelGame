export type Actions = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  jump: boolean;
  jumpPressed: boolean;
  flyDown: boolean;
  sprint: boolean;
  punch: boolean;
  punchPressed: boolean;
  place: boolean;
  placePressed: boolean;
  ki: boolean;
  kiPressed: boolean;
  kiReleased: boolean;
  ssjPressed: boolean;
  dashPressed: boolean;
  pausePressed: boolean;
  hotbar: number | null;
  scroll: number;
};

const EMPTY: Actions = {
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  jump: false,
  jumpPressed: false,
  flyDown: false,
  sprint: false,
  punch: false,
  punchPressed: false,
  place: false,
  placePressed: false,
  ki: false,
  kiPressed: false,
  kiReleased: false,
  ssjPressed: false,
  dashPressed: false,
  pausePressed: false,
  hotbar: null,
  scroll: 0,
};

function radial(x: number, y: number, dz = 0.15) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = ((m - dz) / (1 - dz)) / m;
  return { x: x * scale, y: y * scale };
}

export class Input {
  keys = new Set<string>();
  private prevKeys = new Set<string>();
  mouseDx = 0;
  mouseDy = 0;
  lookSens = 0.0022;
  punchHeld = false;
  placeHeld = false;
  kiHeld = false;
  scrollAcc = 0;
  dragging = false;
  touchMove = { x: 0, y: 0 };
  touchLook = { x: 0, y: 0 };
  touchJump = false;
  touchDown = false;
  touchPunch = false;
  touchPlace = false;
  touchKi = false;
  touchSsj = false;
  private punchEdge = false;
  private placeEdge = false;
  private kiEdge = false;
  private kiUpEdge = false;
  private ssjEdge = false;
  private dashEdge = false;
  private pauseEdge = false;
  enabled = false;
  private el: HTMLElement;
  private unsub: (() => void)[] = [];

  constructor(el: HTMLElement) {
    this.el = el;
    const on = (
      target: EventTarget,
      type: string,
      fn: EventListener,
      opts?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, fn, opts);
      this.unsub.push(() => target.removeEventListener(type, fn, opts));
    };

    on(window, "keydown", (e) => {
      const ev = e as KeyboardEvent;
      if (!this.enabled) return;
      this.keys.add(ev.code);
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyF", "KeyR"].includes(
          ev.code,
        )
      ) {
        ev.preventDefault();
      }
      if (ev.code === "KeyF") this.ssjEdge = true;
      if (ev.code === "KeyR") this.dashEdge = true;
      if (ev.code === "Escape" || ev.code === "KeyP") this.pauseEdge = true;
      if (ev.code === "KeyQ" || ev.code === "KeyE") this.kiEdge = true;
    });
    on(window, "keyup", (e) => {
      const code = (e as KeyboardEvent).code;
      if (code === "KeyQ" || code === "KeyE") this.kiUpEdge = true;
      this.keys.delete(code);
    });
    on(window, "blur", () => this.keys.clear());
    on(document, "visibilitychange", () => {
      if (document.hidden) this.keys.clear();
    });
    on(
      el,
      "mousemove",
      (e) => {
        if (!this.enabled) return;
        const ev = e as MouseEvent;
        if (document.pointerLockElement === el) {
          this.mouseDx += ev.movementX;
          this.mouseDy += ev.movementY;
          return;
        }
        if (this.dragging) {
          this.mouseDx += ev.movementX;
          this.mouseDy += ev.movementY;
        }
      },
    );
    on(el, "pointerdown", (e) => {
      if (!this.enabled) return;
      const ev = e as PointerEvent;
      if (document.pointerLockElement === el) return;
      if (ev.button !== 0 && ev.pointerType !== "touch") {
        /* right already handled */
      }
      if (ev.pointerType === "mouse" && ev.button === 0) {
        this.dragging = true;
        try {
          el.setPointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
      }
    });
    on(window, "pointerup", () => {
      this.dragging = false;
    });
    on(window, "pointercancel", () => {
      this.dragging = false;
    });
    on(el, "mousedown", (e) => {
      if (!this.enabled) return;
      const ev = e as MouseEvent;
      if (ev.button === 0) {
        this.punchHeld = true;
        this.punchEdge = true;
      }
      if (ev.button === 2) {
        this.placeHeld = true;
        this.placeEdge = true;
      }
      if (ev.button === 1) {
        this.kiEdge = true;
        this.kiHeld = true;
      }
    });
    on(window, "mouseup", (e) => {
      const ev = e as MouseEvent;
      if (ev.button === 0) this.punchHeld = false;
      if (ev.button === 2) this.placeHeld = false;
      if (ev.button === 1) {
        this.kiHeld = false;
        this.kiUpEdge = true;
      }
    });
    on(el, "contextmenu", (e) => e.preventDefault());
    on(
      el,
      "wheel",
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.scrollAcc += Math.sign((e as WheelEvent).deltaY);
      },
      { passive: false },
    );
  }

  injectKeys(codes: string[]) {
    this.keys.clear();
    for (const c of codes) this.keys.add(c);
  }

  poll(): Actions {
    const a: Actions = { ...EMPTY };
    const k = this.keys;

    let mx = 0;
    let my = 0;
    if (k.has("KeyW") || k.has("ArrowUp")) my += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) my -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) mx += 1;
    if (k.has("KeyA") || k.has("ArrowLeft")) mx -= 1;
    mx += this.touchMove.x;
    my += this.touchMove.y;

    const gp = typeof navigator !== "undefined" ? navigator.getGamepads?.()[0] : null;
    if (gp && gp.mapping === "standard") {
      const st = radial(gp.axes[0] ?? 0, gp.axes[1] ?? 0);
      mx += st.x;
      my -= st.y;
      const look = radial(gp.axes[2] ?? 0, gp.axes[3] ?? 0, 0.18);
      a.lookX += look.x * 0.04;
      a.lookY += look.y * 0.04;
      if (gp.buttons[0]?.pressed) a.jump = true;
      if (gp.buttons[0]?.pressed && !this.prevPadA) a.jumpPressed = true;
      if (gp.buttons[7]?.pressed || gp.buttons[5]?.pressed) {
        a.ki = true;
        if (!this.prevPadKi) a.kiPressed = true;
      } else if (this.prevPadKi) {
        a.kiReleased = true;
      }
      if (gp.buttons[2]?.pressed) {
        a.punch = true;
        if (!this.prevPadPunch) a.punchPressed = true;
      }
      if (gp.buttons[1]?.pressed && !this.prevPadDash) a.dashPressed = true;
      this.prevPadA = !!gp.buttons[0]?.pressed;
      this.prevPadKi = !!(gp.buttons[7]?.pressed || gp.buttons[5]?.pressed);
      this.prevPadPunch = !!gp.buttons[2]?.pressed;
      this.prevPadDash = !!gp.buttons[1]?.pressed;
    }

    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }
    a.moveX = mx;
    a.moveY = my;

    a.lookX += this.mouseDx * this.lookSens + this.touchLook.x;
    a.lookY += this.mouseDy * this.lookSens + this.touchLook.y;
    this.mouseDx = 0;
    this.mouseDy = 0;
    this.touchLook.x = 0;
    this.touchLook.y = 0;

    a.jump = k.has("Space") || this.touchJump || a.jump;
    a.jumpPressed = (!this.prevKeys.has("Space") && k.has("Space")) || this.touchJumpPressed || a.jumpPressed;
    this.touchJumpPressed = false;

    a.flyDown = k.has("ControlLeft") || k.has("ControlRight") || k.has("KeyC") || this.touchDown;
    a.sprint = k.has("ShiftLeft") || k.has("ShiftRight");
    // In fly mode Shift is descend — engine decides. Also map Shift as flyDown when flying.

    a.punch = this.punchHeld || this.touchPunch || a.punch;
    a.punchPressed = this.punchEdge || this.touchPunchPressed || a.punchPressed;
    this.punchEdge = false;
    this.touchPunchPressed = false;

    a.place = this.placeHeld || this.touchPlace;
    a.placePressed = this.placeEdge || this.touchPlacePressed;
    this.placeEdge = false;
    this.touchPlacePressed = false;

    a.ki = this.kiHeld || k.has("KeyQ") || k.has("KeyE") || this.touchKi || a.ki;
    a.kiPressed = this.kiEdge || this.touchKiPressed || a.kiPressed;
    a.kiReleased = this.kiUpEdge || this.touchKiReleased || a.kiReleased;
    this.kiEdge = false;
    this.kiUpEdge = false;
    this.touchKiPressed = false;
    this.touchKiReleased = false;

    a.ssjPressed = this.ssjEdge || this.touchSsjPressed;
    this.ssjEdge = false;
    this.touchSsjPressed = false;

    a.dashPressed = this.dashEdge || this.touchDashPressed || a.dashPressed;
    this.dashEdge = false;
    this.touchDashPressed = false;

    a.pausePressed = this.pauseEdge;
    this.pauseEdge = false;

    for (let i = 1; i <= 5; i++) {
      if (k.has(`Digit${i}`) && !this.prevKeys.has(`Digit${i}`)) a.hotbar = i - 1;
    }
    a.scroll = this.scrollAcc;
    this.scrollAcc = 0;

    this.prevKeys = new Set(k);
    return a;
  }

  private prevPadA = false;
  private prevPadKi = false;
  private prevPadPunch = false;
  private prevPadDash = false;
  touchJumpPressed = false;
  touchPunchPressed = false;
  touchPlacePressed = false;
  touchKiPressed = false;
  touchKiReleased = false;
  touchSsjPressed = false;
  touchDashPressed = false;

  dispose() {
    for (const u of this.unsub) u();
    this.unsub = [];
  }
}
