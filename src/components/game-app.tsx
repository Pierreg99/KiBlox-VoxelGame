import { useEffect, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from "react";
import {
  Crosshair,
  Pause,
  Volume2,
  VolumeX,
  Zap,
  ChevronsUp,
  CircleDot,
  Hammer,
  Box,
  FastForward,
} from "lucide-react";
import type { GameEngine } from "@/game/engine";
import { DIRT, GRASS, KI, SSJ_POWER, STONE, WOOD } from "@/game/constants";
import { useHud } from "@/game/store";

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [fail, setFail] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let engine: GameEngine | null = null;
    void import("@/game/engine")
      .then(({ GameEngine }) => {
        if (cancelled || !canvasRef.current) return;
        engine = new GameEngine(canvasRef.current);
        engineRef.current = engine;
        return engine.start();
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setFail(true);
      });
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <h1 className="sr-only">KI BLOX</h1>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onContextMenu={(e) => e.preventDefault()}
      />
      <Hud engineRef={engineRef} fail={fail} onRetry={() => window.location.reload()} />
    </div>
  );
}

function Hud({
  engineRef,
  fail,
  onRetry,
}: {
  engineRef: RefObject<GameEngine | null>;
  fail: boolean;
  onRetry: () => void;
}) {
  const hud = useHud();
  const e = () => engineRef.current;

  return (
    <>
      {(hud.phase === "playing" || hud.phase === "paused") && <PlayHud engineRef={engineRef} />}
      {hud.phase === "playing" && hud.isTouch && <TouchPad engineRef={engineRef} />}
      {hud.phase === "loading" && (
        <LoadingOverlay progress={hud.loadProgress} fail={fail} onRetry={onRetry} />
      )}
      {hud.phase === "title" && <TitleOverlay engine={e} />}
      {hud.phase === "paused" && <PauseOverlay engine={e} />}
      {hud.phase === "wish" && <WishOverlay engine={e} />}
      {hud.phase === "dead" && <DeadOverlay engine={e} />}
    </>
  );
}

function PlayHud({ engineRef }: { engineRef: RefObject<GameEngine | null> }) {
  const hud = useHud();
  const hp = Math.max(0, hud.health / hud.maxHealth);
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 sm:top-6 sm:left-6 sm:right-6">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="rounded-xl bg-surface/85 px-3 py-2 shadow-panel ring-1 ring-border">
            <div className="flex items-center justify-between gap-4">
              <span className="font-display text-lg tracking-wide text-muted uppercase">
                Ki
              </span>
              <span className="hud-num font-display text-2xl leading-none text-ki">
                {hud.power.toLocaleString("de-DE")}
              </span>
            </div>
            {hud.lookPower != null && (
              <p className="mt-1 text-xs text-muted">
                Ziel: <span className="hud-num text-fg">{hud.lookPower.toLocaleString("de-DE")}</span>
              </p>
            )}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
              <div
                className={`h-full rounded-full ${hud.superSaiyan ? "bg-ki" : "bg-accent"}`}
                style={{ width: `${Math.min(100, (hud.power / (SSJ_POWER * 2)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="w-48 max-w-[55vw] rounded-xl bg-surface/85 px-3 py-2 ring-1 ring-border">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Leben</span>
              <span className="hud-num text-fg">{Math.ceil(hud.health)}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-raised">
              <div
                className={`h-full rounded-full ${hp < 0.3 ? "bg-danger" : "bg-ok"}`}
                style={{ width: `${hp * 100}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>Energie</span>
              <span className="hud-num text-fg">{Math.ceil(hud.energy)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max(0, Math.min(100, (hud.energy / hud.maxEnergy) * 100))}%` }}
              />
            </div>
          </div>
        </div>
        <DragonRadar />
      </div>

      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex size-12 items-center justify-center">
          {hud.charge > 0.02 && (
            <span
              className="absolute inset-0 rounded-full ring-2 ring-accent/80"
              style={{
                opacity: 0.35 + hud.charge * 0.65,
                transform: `scale(${0.7 + hud.charge * 0.55})`,
              }}
            />
          )}
          <Crosshair className="size-5 text-fg/80" strokeWidth={1.75} />
        </div>
      </div>

      {hud.combo > 1 && (
        <p className="absolute top-[42%] left-1/2 -translate-x-1/2 font-display text-2xl tracking-wide text-ki">
          {hud.combo}x
        </p>
      )}

      {hud.toast && (
        <div className="absolute top-24 left-1/2 z-20 w-[min(90vw,28rem)] -translate-x-1/2 text-center">
          <p
            className="inline-block rounded-md bg-surface/90 px-4 py-1.5 font-display text-xl tracking-wide text-fg ring-1 ring-border"
            style={{ animation: "toast-in 250ms cubic-bezier(0.22,1,0.36,1)" }}
          >
            {hud.toast}
          </p>
        </div>
      )}

      {hud.superSaiyan && (
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,color-mix(in_oklab,var(--color-ki)_28%,transparent)_100%)]"
          style={{ animation: "ssj-pulse 1.8s ease-in-out infinite" }}
        />
      )}

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 pb-[env(safe-area-inset-bottom)] sm:bottom-7 max-sm:bottom-60">
        {hud.target && (
          <span className="rounded-full bg-surface/80 px-2.5 py-0.5 text-xs text-muted ring-1 ring-border">
            {hud.target}
            {hud.mining > 0 ? ` · ${Math.round(hud.mining * 100)}%` : ""}
          </span>
        )}
        {hud.mining > 0 && (
          <div className="h-1 w-32 overflow-hidden rounded-full bg-raised">
            <div className="h-full bg-accent" style={{ width: `${hud.mining * 100}%` }} />
          </div>
        )}
        <div className="pointer-events-auto relative z-30 flex items-end gap-1.5 rounded-xl bg-surface/85 p-1.5 ring-1 ring-border">
          {hud.hotbar.map((id, i) => (
            <button
              type="button"
              key={`${id}-${i}`}
              aria-label={`Slot ${i + 1}`}
              onPointerDown={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                engineRef.current?.selectSlot(i);
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                i === hud.selected ? "ring-1 ring-accent" : "opacity-70"
              }`}
            >
              <span className={`block h-7 w-7 rounded-sm ${blockSwatch(id)}`} />
            </button>
          ))}
        </div>
        <p className="hidden text-[11px] text-subtle sm:block">
          {hud.flying ? "Flug · Leertaste steigen · Shift sinken" : "Boden"}
          {hud.superSaiyan ? " · Super Saiyan" : hud.ssjReady ? " · F Super Saiyan" : ""}
          {hud.dashReady ? " · R Dash" : " · Dash lädt"}
          {" · "}
          {hud.ballsGot}/7 Kugeln
          {!hud.isTouch ? " · ESC Pause" : ""}
        </p>
      </div>
    </div>
  );
}

function DragonRadar() {
  const { radar, ballsGot } = useHud();
  const r = 38;
  return (
    <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 rounded-full bg-surface/85 shadow-panel ring-1 ring-border">
      <div
        className="pointer-events-none absolute inset-1 rounded-full border border-ok/30"
        style={{ animation: "radar-sweep 4s linear infinite" }}
      />
      <div className="absolute inset-1 rounded-full border border-border" />
      <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg" />
      {radar.map((b) => {
        const d = Math.min(1, b.dist / 70);
        const x = Math.sin(b.angle) * d * r;
        const y = -Math.cos(b.angle) * d * r;
        return (
          <span
            key={b.id}
            className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ki"
            style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
          />
        );
      })}
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-display text-sm tracking-wider text-muted">
        {ballsGot}/7
      </span>
    </div>
  );
}

function LoadingOverlay({
  progress,
  fail,
  onRetry,
}: {
  progress: number;
  fail: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-bg">
      <p className="font-display text-5xl tracking-wide text-fg">KI BLOX</p>
      {fail ? (
        <>
          <p className="mt-2 text-sm text-muted">Die Welt konnte nicht geladen werden.</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 h-11 rounded-lg bg-accent px-5 font-display text-xl tracking-wide text-accent-fg"
          >
            Erneut versuchen
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">Die Welt nimmt Form an</p>
          <div className="mt-8 h-1.5 w-56 overflow-hidden rounded-full bg-raised">
            <div className="h-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="hud-num mt-2 text-xs text-subtle">{Math.round(progress * 100)}%</p>
        </>
      )}
    </div>
  );
}

function TitleOverlay({
  engine,
}: {
  engine: () => GameEngine | null;
}) {
  const hud = useHud();
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-end px-5 pb-20 pt-12 sm:justify-center sm:pb-0">
      <img
        src="/game/title.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-bg)_0%,transparent_52%)] sm:bg-[linear-gradient(to_top,color-mix(in_oklab,var(--color-bg)_78%,transparent)_0%,transparent_58%)]" />
      <div className="relative w-full max-w-md rounded-xl bg-surface/80 p-5 shadow-panel ring-1 ring-border backdrop-blur-sm sm:p-8">
        <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">Namek · Erde · Orbit</p>
        <h1 className="font-display mt-1 text-6xl leading-none tracking-wide text-fg sm:text-7xl">
          KI BLOX
        </h1>
        <p className="mt-2 text-sm text-muted">Baue. Fliege. Lade Ki. Sieben Kugeln. Ein Wunsch.</p>
        <div className="mt-5 flex flex-col gap-2 sm:mt-6">
          <button
            type="button"
            onClick={() => engine()?.playFromTitle("continue")}
            className="h-12 rounded-lg bg-accent px-5 font-display text-2xl tracking-wide text-accent-fg transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            {hud.hasSave ? "Fortsetzen" : "Spielen"}
          </button>
          {hud.hasSave && (
            <button
              type="button"
              onClick={() => engine()?.playFromTitle("new")}
              className="h-11 rounded-lg bg-raised px-5 text-sm font-medium text-fg ring-1 ring-border transition-opacity hover:opacity-90"
            >
              Am Spawn neu starten
            </button>
          )}
          <button
            type="button"
            onClick={() => void engine()?.newWorld()}
            className="h-11 rounded-lg px-5 text-sm font-medium text-muted hover:text-fg"
          >
            Neue Welt
          </button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-subtle sm:hidden">
          Stick links, Blick rechts. Flug: Blickrichtung. Halten = steigen, loslassen = sinken.
        </p>
        <ul className="mt-6 hidden space-y-1 text-xs leading-relaxed text-subtle sm:block">
          <li>WASD bewegen · Maus umsehen · Leertaste springen, in der Luft nochmal: Ki-Flug</li>
          <li>Flug folgt dem Blick und gleitet aus · Leertaste steigen · Shift/Strg sinken</li>
          <li>Q halten, loslassen für Ki-Stoß · R Dash · F Super Saiyan · 1–5 Blöcke · ESC Pause</li>
        </ul>
      </div>
    </div>
  );
}

function PauseOverlay({ engine }: { engine: () => GameEngine | null }) {
  const muted = useHud((s) => s.muted);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/70 px-5">
      <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-panel ring-1 ring-border">
        <h2 className="font-display text-4xl tracking-wide">Pause</h2>
        <p className="mt-1 text-sm text-muted">Die Welt wartet.</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => engine()?.resume()}
            className="h-12 rounded-lg bg-accent font-display text-2xl text-accent-fg active:scale-[0.98]"
          >
            Weiter
          </button>
          <button
            type="button"
            onClick={() => engine()?.setMuted(!muted)}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-raised text-sm ring-1 ring-border"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            {muted ? "Ton an" : "Ton aus"}
          </button>
          <button
            type="button"
            onClick={() => engine()?.goTitle()}
            className="h-11 text-sm text-muted hover:text-fg"
          >
            Zum Titel
          </button>
        </div>
      </div>
    </div>
  );
}

function WishOverlay({ engine }: { engine: () => GameEngine | null }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-bg/55 px-5 pb-10 sm:items-center sm:pb-0">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-panel ring-1 ring-border">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">Shenron</p>
        <h2 className="font-display mt-1 text-4xl leading-none tracking-wide">Sag deinen Wunsch</h2>
        <p className="mt-2 text-sm text-muted">Die sieben Kugeln sind vereint. Wähle weise.</p>
        <div className="mt-5 flex flex-col gap-2">
          <WishBtn onClick={() => engine()?.grantWish("power")} label="Mehr Kraft" hint="+4000 Ki" />
          <WishBtn onClick={() => engine()?.grantWish("heal")} label="Voller Körper" hint="Leben auffüllen" />
          <WishBtn onClick={() => engine()?.grantWish("storm")} label="Neue Jagd" hint="Kugeln neu verstreuen" />
        </div>
      </div>
    </div>
  );
}

function WishBtn({ onClick, label, hint }: { onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 items-center justify-between rounded-lg bg-raised px-4 text-left ring-1 ring-border transition-transform active:scale-[0.98]"
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted">{hint}</span>
    </button>
  );
}

function DeadOverlay({ engine }: { engine: () => GameEngine | null }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/75 px-5">
      <div className="w-full max-w-sm rounded-xl bg-surface p-6 text-center shadow-panel ring-1 ring-border">
        <h2 className="font-display text-4xl tracking-wide">Besiegt</h2>
        <p className="mt-2 text-sm text-muted">Ki bleibt. Der Körper kehrt zum Nest zurück.</p>
        <button
          type="button"
          onClick={() => engine()?.respawn()}
          className="mt-6 h-12 w-full rounded-lg bg-accent font-display text-2xl text-accent-fg"
        >
          Wiederbeleben
        </button>
      </div>
    </div>
  );
}

function TouchPad({ engineRef }: { engineRef: RefObject<GameEngine | null> }) {
  const stickRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const lookId = useRef<number | null>(null);
  const lastLook = useRef({ x: 0, y: 0 });

  const setMove = (x: number, y: number) => {
    const inp = engineRef.current?.input;
    if (!inp) return;
    inp.touchMove.x = x;
    inp.touchMove.y = y;
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        ref={stickRef}
        className="pointer-events-auto absolute bottom-24 left-4 h-28 w-28 touch-none rounded-full bg-surface/45 ring-1 ring-border sm:bottom-6 sm:left-5 sm:h-32 sm:w-32"
        onPointerDown={(ev) => {
          ev.currentTarget.setPointerCapture(ev.pointerId);
          moveStick(ev, stickRef.current, setKnob, setMove);
        }}
        onPointerMove={(ev) => moveStick(ev, stickRef.current, setKnob, setMove)}
        onPointerUp={() => {
          setKnob({ x: 0, y: 0 });
          setMove(0, 0);
        }}
        onPointerCancel={() => {
          setKnob({ x: 0, y: 0 });
          setMove(0, 0);
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/80"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>

      <div
        className="pointer-events-auto absolute inset-y-0 right-0 w-1/2 touch-none"
        onPointerDown={(ev) => {
          lookId.current = ev.pointerId;
          lastLook.current = { x: ev.clientX, y: ev.clientY };
          (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
        }}
        onPointerMove={(ev) => {
          if (lookId.current !== ev.pointerId) return;
          const inp = engineRef.current?.input;
          if (!inp) return;
          inp.touchLook.x += (ev.clientX - lastLook.current.x) * 0.0045;
          inp.touchLook.y += (ev.clientY - lastLook.current.y) * 0.0045;
          lastLook.current = { x: ev.clientX, y: ev.clientY };
        }}
        onPointerUp={() => {
          lookId.current = null;
        }}
        onPointerCancel={() => {
          lookId.current = null;
        }}
      />

      <div className="pointer-events-auto absolute right-3 bottom-24 flex flex-col items-end gap-2 sm:right-4 sm:bottom-6">
        <div className="flex gap-2">
          <TouchBtn
            label="Dash"
            icon={<FastForward className="size-5" />}
            onDown={() => {
              const i = engineRef.current?.input;
              if (i) i.touchDashPressed = true;
            }}
          />
          <TouchBtn
            label="Ki"
            icon={<Zap className="size-5" />}
            onDown={() => {
              const i = engineRef.current?.input;
              if (!i) return;
              i.touchKi = true;
              i.touchKiPressed = true;
            }}
            onUp={() => {
              const i = engineRef.current?.input;
              if (!i) return;
              i.touchKi = false;
              i.touchKiReleased = true;
            }}
          />
          <TouchBtn
            label="SSJ"
            icon={<ChevronsUp className="size-5" />}
            onDown={() => {
              const i = engineRef.current?.input;
              if (i) i.touchSsjPressed = true;
            }}
          />
        </div>
        <div className="flex gap-2">
          <TouchBtn
            label="Setzen"
            icon={<Box className="size-5" />}
            onDown={() => {
              const i = engineRef.current?.input;
              if (!i) return;
              i.touchPlace = true;
              i.touchPlacePressed = true;
            }}
            onUp={() => {
              const i = engineRef.current?.input;
              if (i) i.touchPlace = false;
            }}
          />
          <TouchBtn
            label="Schlag"
            icon={<Hammer className="size-5" />}
            onDown={() => {
              const i = engineRef.current?.input;
              if (!i) return;
              i.touchPunch = true;
              i.touchPunchPressed = true;
            }}
            onUp={() => {
              const i = engineRef.current?.input;
              if (i) i.touchPunch = false;
            }}
          />
          <TouchBtn
            label="Flug"
            icon={<CircleDot className="size-5" />}
            onDown={() => {
              const i = engineRef.current?.input;
              if (!i) return;
              i.touchJump = true;
              i.touchJumpPressed = true;
            }}
            onUp={() => {
              const i = engineRef.current?.input;
              if (i) i.touchJump = false;
            }}
          />
        </div>
        <button
          type="button"
          className="flex h-11 items-center gap-1.5 rounded-lg bg-surface/80 px-3 text-xs text-muted ring-1 ring-border"
          onClick={() => engineRef.current?.pause()}
        >
          <Pause className="size-4" /> Pause
        </button>
      </div>
    </div>
  );
}

function TouchBtn({
  label,
  icon,
  onDown,
  onUp,
}: {
  label: string;
  icon: ReactNode;
  onDown: () => void;
  onUp?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-surface/80 text-fg ring-1 ring-border"
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {icon}
    </button>
  );
}

function blockSwatch(id: number) {
  if (id === GRASS) return "bg-block-grass";
  if (id === DIRT) return "bg-block-dirt";
  if (id === STONE) return "bg-block-stone";
  if (id === WOOD) return "bg-block-wood";
  if (id === KI) return "bg-ki";
  return "bg-raised";
}

function moveStick(
  ev: PointerEvent,
  el: HTMLDivElement | null,
  setKnob: (v: { x: number; y: number }) => void,
  setMove: (x: number, y: number) => void,
) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = ev.clientX - cx;
  let dy = ev.clientY - cy;
  const max = r.width * 0.38;
  const m = Math.hypot(dx, dy);
  if (m > max) {
    dx = (dx / m) * max;
    dy = (dy / m) * max;
  }
  setKnob({ x: dx, y: dy });
  setMove(dx / max, -dy / max);
}
