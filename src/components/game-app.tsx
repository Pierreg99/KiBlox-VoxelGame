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
  Sword,
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
import { GEAR_LIST, isGear, ITEM_NAMES, voxGearKey } from "@/game/items";
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
            <p className="mt-1 truncate text-[10px] tracking-[0.14em] text-subtle uppercase">
              {hud.planetName} · {hud.landmark}
            </p>
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
        <div className="pointer-events-auto relative z-30 flex max-w-[95vw] items-end gap-1 overflow-x-auto bg-surface/85 p-2 mc-cut">
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
              className={`relative flex h-12 w-12 items-center justify-center overflow-visible mc-cut ${
                i === hud.selected ? "mc-btn-go" : "opacity-80"
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
          {hud.weaponName}
          {hud.flying ? " · Flug · W vor · Shift runter" : " · Boden · W vor · Shift schleichen"}
          {" · LMB Schlag · RMB schwer · Q Ki · X Slam · V Hagel"}
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
      <p className="mc-kicker">Orbit-Saga</p>
      <h1 className="mc-logo mc-logo-sm mt-2">KI BLOX</h1>
      {fail ? (
        <>
          <p className="mt-4 text-sm text-muted">Die Welt konnte nicht geladen werden.</p>
          <button type="button" onClick={onRetry} className="mc-btn mc-btn-go mt-6 w-56">
            Erneut versuchen
          </button>
        </>
      ) : (
        <>
          <p className="mc-splash">Die Insel nimmt Form an</p>
          <div className="mt-8 h-2 w-64 overflow-hidden border-2 border-ink bg-raised">
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
    <div className="absolute inset-0 z-30">
      <div className="pointer-events-none absolute inset-0 mc-vignette" />
      <div className="pointer-events-none scouter-frame" />
      <div className="pointer-events-none scouter-frame-b" />
      <p className="pointer-events-none absolute top-5 left-5 text-[11px] tracking-[0.18em] text-muted uppercase">
        {hud.planetName || "Verdant"} · 0.7.0
      </p>
      <p className="pointer-events-none absolute top-5 right-5 text-right font-display text-sm tracking-[0.2em] text-muted">
        SCOUTER
      </p>

      <div className="pointer-events-none absolute inset-x-0 top-[16%] flex flex-col items-center px-4">
        <h1 className="mc-logo">KI BLOX</h1>
        <p className="mc-splash">Bauen · Fliegen · Die Kugeln holen</p>
      </div>

      <div className="absolute inset-x-0 bottom-[11%] flex flex-col items-center px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="mc-stack pointer-events-auto">
          {hud.hasSave && (
            <button type="button" onClick={() => engine()?.playFromTitle("continue")} className="mc-btn mc-btn-go">
              Fortsetzen
            </button>
          )}
          <button type="button" onClick={() => engine()?.playFromTitle("story")} className="mc-btn mc-btn-go">
            Kampagne
          </button>
          <button type="button" onClick={() => engine()?.playFromTitle("creative")} className="mc-btn">
            Kreativ
          </button>
          <button type="button" onClick={() => engine()?.playFromTitle("sandbox")} className="mc-btn">
            Freies Spiel
          </button>
          <button type="button" onClick={() => void engine()?.newWorld()} className="mc-btn mc-btn-quiet">
            Neue Insel
          </button>
        </div>
        <p className="mt-4 hidden text-center text-[11px] tracking-wide text-subtle sm:block">
          W vor · A links · D rechts · X Slam · V Hagel · Q Ki
        </p>
      </div>
    </div>
  );
}

function PauseOverlay({ engine }: { engine: () => GameEngine | null }) {
  const muted = useHud((s) => s.muted);
  return (
    <div className="absolute inset-0 z-40">
      <div className="pointer-events-none absolute inset-0 bg-bg/45" />
      <div className="pointer-events-none scouter-frame" />
      <div className="pointer-events-none scouter-frame-b" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <h2 className="mc-logo mc-logo-sm pointer-events-none">PAUSE</h2>
        <p className="mc-splash pointer-events-none mb-6">Die Insel steht still</p>
        <div className="mc-stack pointer-events-auto">
          <button type="button" onClick={() => engine()?.resume()} className="mc-btn mc-btn-go">
            Weiter
          </button>
          <button type="button" onClick={() => engine()?.openPanel("inventory")} className="mc-btn">
            Inventar
          </button>
          <button type="button" onClick={() => engine()?.openPanel("quests")} className="mc-btn">
            Aufgaben
          </button>
          <button type="button" onClick={() => engine()?.openPanel("rules")} className="mc-btn">
            Regeln
          </button>
          <button type="button" onClick={() => engine()?.setMuted(!muted)} className="mc-btn">
            {muted ? "Ton an" : "Ton aus"}
          </button>
          <button type="button" onClick={() => engine()?.goTitle()} className="mc-btn mc-btn-quiet">
            Zum Titel
          </button>
        </div>
      </div>
    </div>
  );
}

function WishOverlay({ engine }: { engine: () => GameEngine | null }) {
  const campaign = useHud((s) => s.campaign);
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-bg/60 px-4 pb-10 sm:items-center sm:pb-0">
      <div className="mc-window max-w-md">
        <p className="mc-kicker">Orryx</p>
        <h2 className="mc-title mt-1">Sag deinen Wunsch</h2>
        <span className="mc-rule" />
        <p className="text-sm text-muted">Die sieben Kugeln sind vereint. Wähle weise.</p>
        <div className="mt-4 flex flex-col gap-2">
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
      className="absolute inset-0 z-40 flex items-end justify-center bg-bg/40 px-4 pb-8 sm:items-end sm:pb-12"
      onClick={next}
    >
      <div className="mc-window relative z-10 max-w-lg" onClick={next}>
        <div className="pointer-events-none flex gap-4">
          {hud.storyPortrait ? (
            <img
              src={hud.storyPortrait}
              alt=""
              className="mc-cut h-20 w-20 shrink-0 object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="mc-kicker">{hud.storySpeaker}</p>
            <p className="mt-2 text-sm leading-relaxed text-fg">{hud.storyText}</p>
          </div>
        </div>
        <button
          type="button"
          className="mc-btn mc-btn-go relative z-20 mt-4"
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
    <div className="absolute inset-0 z-40 flex items-center justify-center px-4">
      <img src="/game/warp.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-bg/55" />
      <div className="mc-window relative max-w-lg">
        <p className="mc-kicker">Sternentor</p>
        <h2 className="mc-title mt-1">Wähle eine Welt</h2>
        <span className="mc-rule" />
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PLANET_ORDER.map((id) => {
            const p = PLANETS[id];
            const open = unlocked.includes(id);
            return (
              <button
                key={id}
                type="button"
                disabled={!open}
                onClick={() => void engine()?.travelTo(id)}
                className={`p-3 text-left ${id === current ? "mc-btn-go" : "mc-btn"} disabled:opacity-40`}
                style={{ height: "auto", minHeight: "3.25rem", flexDirection: "column", alignItems: "flex-start" }}
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
    <button type="button" onClick={onClick} className="mc-btn" style={{ height: "3.25rem", justifyContent: "space-between", padding: "0 0.9rem" }}>
      <span>{label}</span>
      <span className="text-xs tracking-normal text-muted">{hint}</span>
    </button>
  );
}

function DeadOverlay({ engine }: { engine: () => GameEngine | null }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-bg/70 px-4">
      <h2 className="mc-logo mc-logo-sm">BESIEGT</h2>
      <p className="mc-splash mb-6">Ki bleibt. Der Körper kehrt zum Nest zurück.</p>
      <button type="button" onClick={() => engine()?.respawn()} className="mc-btn mc-btn-go w-56">
        Wiederbeleben
      </button>
    </div>
  );
}

function InventoryOverlay({ engine }: { engine: () => GameEngine | null }) {
  const hud = useHud();
  const creative = hud.mode === "creative";
  const show = (id: number) => creative || (hud.inventory[id] ?? 0) > 0;
  const gearIds = GEAR_LIST.filter(show);
  const blockIds = PLACEABLE.filter(show);
  const empty = gearIds.length === 0 && blockIds.length === 0;
  const label = (id: number) => ITEM_NAMES[id] ?? BLOCK_NAMES[id] ?? "—";
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/50 px-4">
      <div className="mc-window">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mc-kicker">Beutel</p>
            <h2 className="mc-title">Inventar</h2>
          </div>
          <p className="text-xs text-muted">{creative ? "Unendlich" : "Klick setzt in den Slot"}</p>
        </div>
        <span className="mc-rule" />
        {gearIds.length > 0 ? (
          <>
            <p className="mt-2 text-[10px] tracking-[0.16em] text-subtle uppercase">Waffen und Vorrat</p>
            <div className="mt-1 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {gearIds.map((id) => {
                const n = hud.inventory[id] ?? 0;
                const inBar = hud.hotbar.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    title={label(id)}
                    onClick={() => engine()?.setHotbarBlock(hud.selected, id)}
                    className={`flex flex-col items-center gap-1 p-2 ${inBar ? "mc-btn-go" : "mc-btn"}`}
                    style={{ height: "auto" }}
                  >
                    <VoxelSwatch id={id} />
                    <span className="hud-num max-w-full truncate text-[10px] text-muted">
                      {label(id)}
                    </span>
                    <span className="hud-num text-[10px] text-subtle">{creative ? "—" : n}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
        {blockIds.length > 0 ? (
          <>
            <p className="mt-3 text-[10px] tracking-[0.16em] text-subtle uppercase">Blöcke</p>
            <div className="mt-1 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {blockIds.map((id) => {
                const n = hud.inventory[id] ?? 0;
                const inBar = hud.hotbar.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    title={label(id)}
                    onClick={() => engine()?.setHotbarBlock(hud.selected, id)}
                    className={`flex flex-col items-center gap-1 p-2 ${inBar ? "mc-btn-go" : "mc-btn"}`}
                    style={{ height: "auto" }}
                  >
                    <VoxelSwatch id={id} />
                    <span className="hud-num text-[10px] text-muted">{creative ? "—" : n}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
        {empty ? (
          <p className="mt-4 text-sm text-muted">Leer. Brich Blöcke, dann füllt sich der Beutel.</p>
        ) : null}
        <div className="mt-4 flex items-end gap-1.5">
          {hud.hotbar.map((id, i) => (
            <button
              key={`bar-${i}`}
              type="button"
              onClick={() => engine()?.selectSlot(i)}
              className={`flex h-11 w-11 items-center justify-center ${
                i === hud.selected ? "mc-btn-go" : "mc-btn"
              }`}
              style={{ width: "2.75rem", height: "2.75rem" }}
            >
              <VoxelSwatch id={id} />
            </button>
          ))}
        </div>
        <button type="button" className="mc-btn mc-btn-go mt-5" onClick={() => engine()?.closePanel()}>
          Schließen
        </button>
      </div>
    </div>
  );
}

function QuestLogOverlay({ engine }: { engine: () => GameEngine | null }) {
  const hud = useHud();
  const meta = MODE_META[hud.mode];
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/50 px-4">
      <div className="mc-window">
        <p className="mc-kicker">{meta.tag}</p>
        <h2 className="mc-title">Aufgaben</h2>
        <span className="mc-rule" />
        <p className="text-sm text-muted">
          {hud.questDone}/{hud.questTotal} erfüllt
        </p>
        <ul className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
          {hud.questList.map((q) => {
            const pct = q.target > 0 ? Math.min(100, (q.value / q.target) * 100) : 0;
            return (
              <li key={q.id} className="border-b-2 border-bg py-2">
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
                <div className="mt-1.5 h-2 overflow-hidden border border-ink bg-bg">
                  <div className={`h-full ${q.complete ? "bg-ok" : "bg-accent"}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <button type="button" className="mc-btn mc-btn-go mt-5" onClick={() => engine()?.closePanel()}>
          Schließen
        </button>
      </div>
    </div>
  );
}

function RulesOverlay({ engine }: { engine: () => GameEngine | null }) {
  const hud = useHud();
  const meta = MODE_META[hud.mode];
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/50 px-4">
      <div className="mc-window">
        <p className="mc-kicker">{meta.tag}</p>
        <h2 className="mc-title">{meta.name}</h2>
        <span className="mc-rule" />
        <p className="text-sm text-muted">{meta.blurb}</p>
        <ul className="mt-3 space-y-2">
          {meta.rules.map((line) => (
            <li key={line} className="border-b-2 border-bg py-2 text-sm text-fg">
              {line}
            </li>
          ))}
        </ul>
        <button type="button" className="mc-btn mc-btn-go mt-5" onClick={() => engine()?.acceptRules()}>
          Verstanden
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
      className="mc-cut flex h-11 w-11 items-center justify-center bg-surface/85 text-fg"
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
            label="Slam"
            icon={<ChevronDown className="size-5" />}
            onDown={() => {
              const i = engineRef.current?.input;
              if (i) i.touchSlam = true;
            }}
          />
          <TouchBtn
            label="Hagel"
            icon={<Sword className="size-5" />}
            onDown={() => {
              const i = engineRef.current?.input;
              if (i) i.touchBarrage = true;
            }}
          />
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
  const gear = voxGearKey(id);
  if (gear) return gear;
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
    <span className={`vox${isGear(id) ? " vox-gear" : ""}`} data-vox={voxKey(id)} aria-hidden>
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
