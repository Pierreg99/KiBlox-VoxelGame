import { useEffect, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from "react";
import {
  Crosshair,
  Pause,
  Volume2,
  VolumeX,
  Zap,
  ChevronsUp,
  ChevronDown,
  CircleDot,
  Hammer,
  Box,
  FastForward,
  MessageCircle,
  Backpack,
  ScrollText,
  BookOpen,
  Check,
} from "lucide-react";
import type { GameEngine } from "@/game/engine";
import {
  BASALT,
  BLOCK_NAMES,
  CLAY,
  CLOUD,
  DIRT,
  GRASS,
  ICE,
  KI,
  LEAVES,
  METAL,
  MOSS,
  PATH,
  PLACEABLE,
  SAND,
  SNOW,
  SSJ_POWER,
  STONE,
  TEMPLE,
  WOOD,
} from "@/game/constants";
import { PLANET_ORDER, PLANETS } from "@/game/campaign";
import { MODE_META } from "@/game/quests";
import { useHud } from "@/game/store";

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [fail, setFail] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true;
    let engine: GameEngine | null = null;
    const failTimer = window.setTimeout(() => {
      if (alive && useHud.getState().phase === "loading") setFail(true);
    }, 25000);
    void (async () => {
      try {
        const { GameEngine } = await import("@/game/engine");
        if (!alive || !canvasRef.current) return;
        engine = new GameEngine(canvasRef.current);
        engineRef.current = engine;
        await engine.start();
      } catch (err) {
        console.error(err);
        if (alive) setFail(true);
      }
    })();
    return () => {
      alive = false;
      window.clearTimeout(failTimer);
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
      {(hud.phase === "playing" ||
        hud.phase === "paused" ||
        hud.phase === "inventory" ||
        hud.phase === "quests" ||
        hud.phase === "rules") && <PlayHud engineRef={engineRef} />}
      {hud.phase === "playing" && hud.isTouch && <TouchPad engineRef={engineRef} />}
      {hud.phase === "loading" && (
        <LoadingOverlay progress={hud.loadProgress} fail={fail} onRetry={onRetry} />
      )}
      {hud.phase === "title" && <TitleOverlay engine={e} />}
      {hud.phase === "paused" && <PauseOverlay engine={e} />}
      {hud.phase === "wish" && <WishOverlay engine={e} />}
      {hud.phase === "story" && <StoryOverlay engine={e} />}
      {hud.phase === "warp" && <WarpOverlay engine={e} />}
      {hud.phase === "dead" && <DeadOverlay engine={e} />}
      {hud.phase === "inventory" && <InventoryOverlay engine={e} />}
      {hud.phase === "quests" && <QuestLogOverlay engine={e} />}
      {hud.phase === "rules" && <RulesOverlay engine={e} />}
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
          <div className="kb-chip">
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
                {hud.lookName ? <span className="text-fg">{hud.lookName} · </span> : null}
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
          <div className="w-48 max-w-[55vw] kb-chip">
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
        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex gap-1.5">
            <HudIconBtn
              label="Inventar"
              onClick={() => engineRef.current?.openPanel("inventory")}
              icon={<Backpack className="size-4" />}
            />
            <HudIconBtn
              label="Aufgaben"
              onClick={() => engineRef.current?.openPanel("quests")}
              icon={<ScrollText className="size-4" />}
            />
          </div>
          {hud.mode !== "creative" ? <DragonRadar /> : null}
        </div>
      </div>
      {hud.quest && (
        <div className="absolute top-4 left-1/2 z-20 w-[min(90vw,22rem)] -translate-x-1/2 sm:top-6">
          <button
            type="button"
            className="pointer-events-auto w-full kb-chip text-left"
            onClick={() => engineRef.current?.openPanel("quests")}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs text-fg">
                {hud.quest}
                {hud.npcHint ? " · E reden" : ""}
              </p>
              <span className="hud-num shrink-0 text-[11px] text-muted">
                {hud.questDone}/{hud.questTotal}
              </span>
            </div>
            {hud.questHint ? <p className="mt-0.5 truncate text-[11px] text-muted">{hud.questHint}</p> : null}
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full bg-ok"
                style={{ width: `${hud.questTarget > 0 ? Math.min(100, (hud.questValue / hud.questTarget) * 100) : 0}%` }}
              />
            </div>
          </button>
        </div>
      )}

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
        <div className="pointer-events-auto relative z-30 flex max-w-[95vw] items-end gap-1 overflow-x-auto rounded-xl bg-surface/85 p-2 ring-1 ring-border">
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
              className={`relative flex h-12 w-12 items-center justify-center overflow-visible rounded-md ${
                i === hud.selected ? "bg-raised ring-1 ring-accent" : "opacity-80"
              }`}
            >
              <VoxelSwatch id={id} />
              {hud.mode !== "creative" ? (
                <span className="hud-num absolute right-0.5 bottom-0.5 text-[9px] leading-none text-fg">
                  {hud.inventory[id] ?? 0}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <p className="hidden text-[11px] text-subtle sm:block">
          {hud.flying ? "Flug · W vor · Shift runter · Strg schneller · Z zoomen" : "Boden · W vor · Shift schleichen · Strg sprinten · Z zoomen"}
          {hud.superSaiyan ? " · Super Saiyan" : hud.ssjReady ? " · F Super Saiyan" : ""}
          {hud.mode !== "creative" ? ` · ${hud.ballsGot}/7 Kugeln` : ""}
          {" · I Beutel · J Aufgaben"}
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
      <p className="kb-kicker">Orbit-Saga</p>
      <p className="font-display mt-2 text-6xl tracking-wide text-fg">KI BLOX</p>
      {fail ? (
        <>
          <p className="mt-3 text-sm text-muted">Die Welt konnte nicht geladen werden.</p>
          <button type="button" onClick={onRetry} className="kb-primary mt-6 max-w-56">
            Erneut versuchen
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted">Die Welt nimmt Form an</p>
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
    <div className="absolute inset-0 z-30 flex items-end justify-start sm:items-stretch">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-bg)_0%,transparent_46%)]" />
      <div className="kb-sheet pointer-events-auto relative flex max-h-[100dvh] flex-col justify-end pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:justify-center">
        <p className="kb-kicker">Orbit-Saga</p>
        <h1 className="font-display mt-2 text-[4.4rem] leading-[0.86] tracking-wide text-fg sm:text-[5.6rem]">
          KI
          <br />
          BLOX
        </h1>
        <span className="kb-rule" />
        <p className="max-w-[18rem] text-sm leading-relaxed text-muted">
          Eine Insel. Drei Wege. Bauen, fliegen, die Kugeln holen.
        </p>
        <div className="mt-6">
          {hud.hasSave && (
            <button type="button" onClick={() => engine()?.playFromTitle("continue")} className="kb-mode kb-mode-go">
              <span className="n">00</span> Fortsetzen
            </button>
          )}
          <button type="button" onClick={() => engine()?.playFromTitle("story")} className="kb-mode kb-mode-go">
            <span className="n">01</span> Kampagne
          </button>
          <button type="button" onClick={() => engine()?.playFromTitle("creative")} className="kb-mode">
            <span className="n">02</span> Kreativ
          </button>
          <button type="button" onClick={() => engine()?.playFromTitle("sandbox")} className="kb-mode">
            <span className="n">03</span> Freies Spiel
          </button>
          <button type="button" onClick={() => void engine()?.newWorld()} className="kb-mode text-muted">
            <span className="n">—</span> Neue Insel
          </button>
        </div>
        <p className="mt-6 hidden text-[11px] leading-relaxed text-subtle sm:block">
          W vor · A links · D rechts · Shift schleichen · Strg sprinten · Z zoomen
        </p>
      </div>
    </div>
  );
}

function PauseOverlay({ engine }: { engine: () => GameEngine | null }) {
  const muted = useHud((s) => s.muted);
  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-start bg-bg/55">
      <div className="kb-sheet flex flex-col justify-center">
        <p className="kb-kicker">Halt</p>
        <h2 className="kb-title">Pause</h2>
        <span className="kb-rule" />
        <p className="text-sm text-muted">Die Insel steht still.</p>
        <div className="mt-6">
          <button type="button" onClick={() => engine()?.resume()} className="kb-mode kb-mode-go">
            <span className="n">01</span> Weiter
          </button>
          <button type="button" onClick={() => engine()?.openPanel("inventory")} className="kb-mode">
            <span className="n">02</span> Inventar
          </button>
          <button type="button" onClick={() => engine()?.openPanel("quests")} className="kb-mode">
            <span className="n">03</span> Aufgaben
          </button>
          <button type="button" onClick={() => engine()?.openPanel("rules")} className="kb-mode">
            <span className="n">04</span> Regeln
          </button>
          <button type="button" onClick={() => engine()?.setMuted(!muted)} className="kb-mode">
            <span className="n">05</span> {muted ? "Ton an" : "Ton aus"}
          </button>
          <button type="button" onClick={() => engine()?.goTitle()} className="kb-mode text-muted">
            <span className="n">—</span> Zum Titel
          </button>
        </div>
      </div>
    </div>
  );
}

function WishOverlay({ engine }: { engine: () => GameEngine | null }) {
  const campaign = useHud((s) => s.campaign);
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-bg/75 px-5 pb-10 sm:items-center sm:pb-0">
      <div className="kb-panel max-w-md">
        <p className="kb-kicker">Orryx</p>
        <h2 className="kb-title mt-1">Sag deinen Wunsch</h2>
        <p className="mt-2 text-sm text-muted">Die sieben Kugeln sind vereint. Wähle weise.</p>
        <div className="mt-5 flex flex-col gap-2">
          {campaign && (
            <WishBtn onClick={() => engine()?.grantWish("warp")} label="Das Tor öffnen" hint="Nächste Welt" />
          )}
          <WishBtn onClick={() => engine()?.grantWish("power")} label="Mehr Kraft" hint="+4000 Ki" />
          <WishBtn onClick={() => engine()?.grantWish("heal")} label="Voller Körper" hint="Leben auffüllen" />
          <WishBtn onClick={() => engine()?.grantWish("storm")} label="Neue Jagd" hint="Kugeln neu verstreuen" />
        </div>
      </div>
    </div>
  );
}

function StoryOverlay({ engine }: { engine: () => GameEngine | null }) {
  const hud = useHud();
  const next = () => engine()?.advanceStory();
  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-bg/50 px-5 pb-8 sm:items-center sm:pb-0"
      onClick={next}
    >
      <div
        className="kb-panel relative z-10 max-w-lg sm:p-6"
        onClick={next}
      >
        <div className="pointer-events-none flex gap-4">
          {hud.storyPortrait ? (
            <img
              src={hud.storyPortrait}
              alt=""
              className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-border"
            />
          ) : null}
          <div className="min-w-0">
            <p className="kb-kicker">{hud.storySpeaker}</p>
            <p className="mt-2 text-sm leading-relaxed text-fg">{hud.storyText}</p>
          </div>
        </div>
        <button
          type="button"
          className="kb-primary relative z-20 mt-4"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
        >
          Weiter
        </button>
      </div>
    </div>
  );
}

function WarpOverlay({ engine }: { engine: () => GameEngine | null }) {
  const unlocked = useHud((s) => s.unlocked);
  const current = useHud((s) => s.planet);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-5">
      <img src="/game/warp.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-bg/55" />
      <div className="kb-panel relative max-w-lg sm:p-6">
        <p className="kb-kicker">Sternentor</p>
        <h2 className="kb-title mt-1">Wähle eine Welt</h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PLANET_ORDER.map((id) => {
            const p = PLANETS[id];
            const open = unlocked.includes(id);
            return (
              <button
                key={id}
                type="button"
                disabled={!open}
                onClick={() => void engine()?.travelTo(id)}
                className={`rounded-lg p-3 text-left ring-1 ring-border ${
                  id === current ? "bg-raised" : "bg-surface"
                } disabled:opacity-40`}
              >
                <p className="font-display text-2xl leading-none">{p.name}</p>
                <p className="mt-1 text-xs text-muted">{open ? p.subtitle : "Versiegelt"}</p>
              </button>
            );
          })}
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
      className="flex h-14 items-center justify-between rounded-sm bg-raised px-4 text-left shadow-[0_0_0_1px_var(--color-border)] transition-transform duration-[var(--motion-quick)] active:scale-[0.98]"
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted">{hint}</span>
    </button>
  );
}

function DeadOverlay({ engine }: { engine: () => GameEngine | null }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/75 px-5">
      <div className="kb-sheet max-h-none h-auto py-10 text-left">
        <p className="kb-kicker">Niederlage</p>
        <h2 className="kb-title">Besiegt</h2>
        <span className="kb-rule" />
        <p className="text-sm text-muted">Ki bleibt. Der Körper kehrt zum Nest zurück.</p>
        <button type="button" onClick={() => engine()?.respawn()} className="kb-mode kb-mode-go mt-6">
          <span className="n">01</span> Wiederbeleben
        </button>
      </div>
    </div>
  );
}

function InventoryOverlay({ engine }: { engine: () => GameEngine | null }) {
  const hud = useHud();
  const creative = hud.mode === "creative";
  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-start bg-bg/50">
      <div className="kb-sheet">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="kb-kicker">Beutel</p>
            <h2 className="kb-title">Inventar</h2>
          </div>
          <p className="text-xs text-muted">{creative ? "Unendlich" : "Klick setzt in den Slot"}</p>
        </div>
        <span className="kb-rule" />
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {PLACEABLE.map((id) => {
            const n = hud.inventory[id] ?? 0;
            const shown = creative || n > 0;
            if (!shown) return null;
            const inBar = hud.hotbar.includes(id);
            return (
              <button
                key={id}
                type="button"
                title={BLOCK_NAMES[id]}
                onClick={() => engine()?.setHotbarBlock(hud.selected, id)}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 ring-1 ${
                  inBar ? "bg-raised ring-accent" : "bg-raised/60 ring-border"
                }`}
              >
                <VoxelSwatch id={id} />
                <span className="hud-num text-[10px] text-muted">{creative ? "—" : n}</span>
              </button>
            );
          })}
        </div>
        {PLACEABLE.every((id) => (hud.inventory[id] ?? 0) <= 0) && !creative ? (
          <p className="mt-4 text-sm text-muted">Leer. Brich Blöcke, dann füllt sich der Beutel.</p>
        ) : null}
        <div className="mt-4 flex items-end gap-1.5">
          {hud.hotbar.map((id, i) => (
            <button
              key={`bar-${i}`}
              type="button"
              onClick={() => engine()?.selectSlot(i)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                i === hud.selected ? "ring-1 ring-accent" : "ring-1 ring-border opacity-70"
              }`}
            >
              <VoxelSwatch id={id} />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="kb-mode kb-mode-go mt-6"
          onClick={() => engine()?.closePanel()}
        >
          <span className="n">01</span> Schließen
        </button>
      </div>
    </div>
  );
}

function QuestLogOverlay({ engine }: { engine: () => GameEngine | null }) {
  const hud = useHud();
  const meta = MODE_META[hud.mode];
  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-start bg-bg/50">
      <div className="kb-sheet">
        <p className="kb-kicker">{meta.tag}</p>
        <h2 className="kb-title">Aufgaben</h2>
        <span className="kb-rule" />
        <p className="mt-1 text-sm text-muted">
          {hud.questDone}/{hud.questTotal} erfüllt
        </p>
        <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
          {hud.questList.map((q) => {
            const pct = q.target > 0 ? Math.min(100, (q.value / q.target) * 100) : 0;
            return (
              <li key={q.id} className="border-b border-border py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${q.complete ? "text-muted" : "text-fg"}`}>{q.title}</p>
                  {q.complete ? (
                    <Check className="size-4 shrink-0 text-ok" />
                  ) : (
                    <span className="hud-num text-[11px] text-muted">
                      {q.value}/{q.target}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-subtle">{q.hint}</p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-bg">
                  <div className={`h-full rounded-full ${q.complete ? "bg-ok" : "bg-accent"}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="kb-mode kb-mode-go mt-6"
          onClick={() => engine()?.closePanel()}
        >
          <span className="n">01</span> Schließen
        </button>
      </div>
    </div>
  );
}

function RulesOverlay({ engine }: { engine: () => GameEngine | null }) {
  const hud = useHud();
  const meta = MODE_META[hud.mode];
  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-start bg-bg/50">
      <div className="kb-sheet">
        <p className="kb-kicker">{meta.tag}</p>
        <h2 className="kb-title">{meta.name}</h2>
        <span className="kb-rule" />
        <p className="mt-2 text-sm text-muted">{meta.blurb}</p>
        <ul className="mt-4 space-y-2">
          {meta.rules.map((line) => (
            <li key={line} className="border-b border-border py-2 text-sm text-fg">
              {line}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="kb-mode kb-mode-go mt-6"
          onClick={() => engine()?.acceptRules()}
        >
          <span className="n">01</span> Verstanden
        </button>
      </div>
    </div>
  );
}

function HudIconBtn({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface/85 text-fg ring-1 ring-border"
    >
      {icon}
    </button>
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
          <TouchBtn
            label="Schleichen"
            icon={<ChevronDown className="size-5" />}
            onDown={() => {
              const i = engineRef.current?.input;
              if (i) i.touchCrouch = true;
            }}
            onUp={() => {
              const i = engineRef.current?.input;
              if (i) i.touchCrouch = false;
            }}
          />
        </div>
        <div className="flex gap-2">
          <TouchBtn
            label="Beutel"
            icon={<Backpack className="size-5" />}
            onDown={() => engineRef.current?.openPanel("inventory")}
          />
          <TouchBtn
            label="Aufgaben"
            icon={<ScrollText className="size-5" />}
            onDown={() => engineRef.current?.openPanel("quests")}
          />
          <TouchBtn
            label="Rede"
            icon={<MessageCircle className="size-5" />}
            onDown={() => engineRef.current?.talkNearest()}
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

function voxKey(id: number) {
  if (id === GRASS) return "grass";
  if (id === DIRT) return "dirt";
  if (id === STONE) return "stone";
  if (id === WOOD) return "wood";
  if (id === KI) return "ki";
  if (id === SAND) return "sand";
  if (id === LEAVES) return "leaves";
  if (id === MOSS) return "moss";
  if (id === TEMPLE) return "temple";
  if (id === CLAY) return "clay";
  if (id === CLOUD) return "cloud";
  if (id === PATH) return "path";
  if (id === SNOW) return "snow";
  if (id === ICE) return "ice";
  if (id === METAL) return "metal";
  if (id === BASALT) return "basalt";
  return "stone-fallback";
}

function VoxelSwatch({ id }: { id: number }) {
  return (
    <span className="vox" data-vox={voxKey(id)} aria-hidden>
      <i className="vox-t" />
      <i className="vox-l" />
      <i className="vox-r" />
    </span>
  );
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
