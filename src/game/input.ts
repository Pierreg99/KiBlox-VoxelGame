export type Actions = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  jump: boolean;
  jumpPressed: boolean;
  flyDown: boolean;
  crouch: boolean;
  sprint: boolean;
  zoom: boolean;
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
  interactPressed: boolean;
  invPressed: boolean;
  questPressed: boolean;
  rulesPressed: boolean;
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
  crouch: false,
  sprint: false,
  zoom: false,
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
  interactPressed: false,
  invPressed: false,
  questPressed: false,
  rulesPressed: false,
  hotbar: null,
  scroll: 0,
};

function radial(x: number, y: number, dz = 0.15) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = ((m - dz) / (1 - dz)) / m;
  return { x: x * scale, y: y * scale };
}

const GAME_CODES = new Set([
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyF",
  "KeyR",
  "KeyE",
  "KeyI",
  "KeyJ",
  "KeyH",
  "KeyZ",
  "KeyC",
  "KeyX",
  "Tab",
  "ControlLeft",
  "ControlRight",
  "ShiftLeft",
  "ShiftRight",
]);

export function rumble(ms: number, strong = 0.42) {
  try {
    const gp = navigator.getGamepads?.()[0];
    void gp?.vibrationActuator?.playEffect("dual-rumble", {
      startDelay: 0,
      duration: ms,
      strongMagnitude: strong,
      weakMagnitude: strong * 0.55,
    });
  } catch {
    /* no pad */
  }
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
  dragDist = 0;
  touchMove = { x: 0, y: 0 };
  touchLook = { x: 0, y: 0 };
  touchJump = false;
  touchDown = false;
  touchPunch = false;
  touchPlace = false;
  touchKi = false;
  touchSsj = false;
  touchCrouch = false;
  touchSprint = false;
  private punchEdge = false;
  private placeEdge = false;
  private kiEdge = false;
  private kiUpEdge = false;
  private ssjEdge = false;
  private dashEdge = false;
  private pauseEdge = false;
  private interactEdge = false;
  private invEdge = false;
  private questEdge = false;
  private rulesEdge = false;
  private zoomEdge = false;
  enabled = false;
  private el: HTMLElement;
  private unsub: (() => void)[] = [];
  private lastForwardUp = -1;
  private sprintLatch = false;
  zoomOn = false;

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
      if (GAME_CODES.has(ev.code)) ev.preventDefault();
      if (ev.code === "KeyF") this.ssjEdge = true;
      if (ev.code === "KeyR") this.dashEdge = true;
      if (ev.code === "Escape" || ev.code === "KeyP") this.pauseEdge = true;
      if (ev.code === "KeyQ") this.kiEdge = true;
      if (ev.code === "KeyE") this.interactEdge = true;
      if (ev.code === "KeyI") this.invEdge = true;
      if (ev.code === "KeyJ" || ev.code === "Tab") this.questEdge = true;
      if (ev.code === "KeyH") this.rulesEdge = true;
      if (ev.code === "KeyZ") this.zoomEdge = true;
    });
    on(window, "keyup", (e) => {
      const code = (e as KeyboardEvent).code;
      if (code === "KeyQ") this.kiUpEdge = true;
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
          this.dragDist += Math.hypot(ev.movementX, ev.movementY);
        }
      },
    );
    on(el, "pointerdown", (e) => {
      if (!this.enabled) return;
      const ev = e as PointerEvent;
      if (document.pointerLockElement === el) return;
      if (ev.pointerType === "mouse" && ev.button === 0) {
        this.dragging = true;
        this.dragDist = 0;
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
    const now = performance.now();

    let mx = 0;
    let my = 0;
    if (k.has("KeyW") || k.has("ArrowUp")) my += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) my -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) mx += 1;
    if (k.has("KeyA") || k.has("ArrowLeft")) mx -= 1;
    mx += this.touchMove.x;
    my += this.touchMove.y;

    const wNow = k.has("KeyW") || k.has("ArrowUp") || this.touchMove.y > 0.65;
    const wWas = this.prevKeys.has("KeyW") || this.prevKeys.has("ArrowUp");
    if (wNow && !wWas) {
      if (now - this.lastForwardUp < 280) this.sprintLatch = true;
    }
    if (!wNow) {
      if (wWas) this.lastForwardUp = now;
      this.sprintLatch = false;
    }

    const gp = typeof navigator !== "undefined" ? navigator.getGamepads?.()[0] : null;
    if (gp && gp.mapping === "standard") {
      const pressedN = gp.buttons.reduce((n, b) => n + (b?.pressed ? 1 : 0), 0);
      const ghost = pressedN >= 6;
      if (!ghost) {
        const st = radial(gp.axes[0] ?? 0, gp.axes[1] ?? 0);
        mx += st.x;
        my -= st.y;
        const look = radial(gp.axes[2] ?? 0, gp.axes[3] ?? 0, 0.28);
        a.lookX += look.x * 0.032;
        a.lookY += look.y * 0.032;
        if (gp.buttons[0]?.pressed) a.jump = true;
        if (gp.buttons[0]?.pressed && !this.prevPadA) a.jumpPressed = true;
        if (gp.buttons[4]?.pressed) a.crouch = true;
        if (gp.buttons[5]?.pressed || gp.buttons[10]?.pressed) a.sprint = true;
        const lt = gp.buttons[6]?.value ?? 0;
        if (lt > 0.35) a.crouch = true;
        if (gp.buttons[7]?.pressed || gp.buttons[7]?.value > 0.4) {
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
        if (gp.buttons[3]?.pressed && !this.prevPadY) a.interactPressed = true;
        if (gp.buttons[9]?.pressed && !this.prevPadStart) a.pausePressed = true;
        if (gp.buttons[8]?.pressed && !this.prevPadBack) a.invPressed = true;
        if (gp.buttons[11]?.pressed && !this.prevPadRs) this.zoomOn = !this.zoomOn;
        if (gp.buttons[14]?.pressed && !this.prevPadLeft) a.scroll = -1;
        if (gp.buttons[15]?.pressed && !this.prevPadRight) a.scroll = 1;
        this.prevPadA = !!gp.buttons[0]?.pressed;
        this.prevPadKi = !!(gp.buttons[7]?.pressed || (gp.buttons[7]?.value ?? 0) > 0.4);
        this.prevPadPunch = !!gp.buttons[2]?.pressed;
        this.prevPadDash = !!gp.buttons[1]?.pressed;
        this.prevPadY = !!gp.buttons[3]?.pressed;
        this.prevPadStart = !!gp.buttons[9]?.pressed;
        this.prevPadBack = !!gp.buttons[8]?.pressed;
        this.prevPadRs = !!gp.buttons[11]?.pressed;
        this.prevPadLeft = !!gp.buttons[14]?.pressed;
        this.prevPadRight = !!gp.buttons[15]?.pressed;
      }
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

    a.crouch =
      a.crouch ||
      k.has("ShiftLeft") ||
      k.has("ShiftRight") ||
      k.has("KeyC") ||
      this.touchCrouch ||
      this.touchDown;
    a.flyDown = a.crouch;
    a.sprint =
      (a.sprint ||
        k.has("ControlLeft") ||
        k.has("ControlRight") ||
        this.sprintLatch ||
        this.touchSprint) &&
      !a.crouch &&
      a.moveY > 0.15;

    if (this.zoomEdge) this.zoomOn = !this.zoomOn;
    this.zoomEdge = false;
    a.zoom = this.zoomOn;

    const locked = document.pointerLockElement === this.el;
    a.punch = this.touchPunch || a.punch || (this.punchHeld && (locked || this.dragDist < 10));
    a.punchPressed =
      this.touchPunchPressed || a.punchPressed || (this.punchEdge && (locked || this.dragDist < 10));
    this.punchEdge = false;
    this.touchPunchPressed = false;

    a.place = this.placeHeld || this.touchPlace;
    a.placePressed = this.placeEdge || this.touchPlacePressed;
    this.placeEdge = false;
    this.touchPlacePressed = false;

    a.ki = this.kiHeld || k.has("KeyQ") || this.touchKi || a.ki;
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

    a.pausePressed = this.pauseEdge || a.pausePressed;
    this.pauseEdge = false;

    a.interactPressed = this.interactEdge || this.touchInteractPressed || a.interactPressed;
    this.interactEdge = false;
    this.touchInteractPressed = false;

    a.invPressed = this.invEdge || a.invPressed;
    this.invEdge = false;
    a.questPressed = this.questEdge;
    this.questEdge = false;
    a.rulesPressed = this.rulesEdge;
    this.rulesEdge = false;

    for (let i = 1; i <= 9; i++) {
      if (k.has(`Digit${i}`) && !this.prevKeys.has(`Digit${i}`)) a.hotbar = i - 1;
    }
    if (!a.scroll) a.scroll = this.scrollAcc;
    this.scrollAcc = 0;

    this.prevKeys = new Set(k);
    return a;
  }

  private prevPadA = true;
  private prevPadKi = true;
  private prevPadPunch = true;
  private prevPadDash = true;
  private prevPadY = true;
  private prevPadStart = true;
  private prevPadBack = true;
  private prevPadRs = true;
  private prevPadLeft = true;
  private prevPadRight = true;
  touchJumpPressed = false;
  touchPunchPressed = false;
  touchPlacePressed = false;
  touchKiPressed = false;
  touchKiReleased = false;
  touchSsjPressed = false;
  touchDashPressed = false;
  touchInteractPressed = false;

  dispose() {
    for (const u of this.unsub) u();
    this.unsub = [];
  }
}