# Changelog

## 0.5.1 — 2026-08-27

- Characters: Minecraft 32px / 1.8 m humanoids, painted pixel faces/gi, jointed walk-run-fly-punch
- Species silhouettes: Solari spikes, Veldari antennae, Cryon crystals, Automata visor, Thrynn horns, Aetheri bun
- Title orbit shows the Solari hero walking; FPS gi-arms with punch follow-through
- Fall-Fix: sticky AABB support (no 1-block speckles), snap-to-floor, fall-speed cap, void rescue without bedrock clamp
- Leaves walkable; denser tree canopies; surface pits filled
- Enemies use the same support snap so they stop dropping through edges
- Docs: README, PLAN, QUALITY, PROGRESS, ROADMAP, NOTICE aligned to v0.5.1 / Orbit-Saga

## 0.5.0 — 2026-08-27

- Orbit-Saga: five original worlds (Verdant, Terra, Cinder, Rime, Aether)
- Species: Solari, Veldari, Cryon, Automata, Thrynn, Aetheri
- Story, bosses, star-gate travel, Orryx wishes
- New blocks: snow, ice, lava, metal, basalt
- Scouter shows species name + power

## 0.4.1 — 2026-08-27

- World actually draws after Spielen (direct renderer, no bloom pass that went black)
- Load bar moves while the island generates; Spielen is ready as soon as the title is up
- Load no longer stalls if animation frames are paused (preview / background tab)

## 0.4.0 — 2026-08-27

- Original block atlas: cube-face grass sides (not mini-landscapes), crystal grain, path, even water/stone
- Map: umbrella trees, clay pod village, ziggurat temple, paths, waterfalls, crystal groves, lookout
- Movement: snappier walk, look-fly with coast, ground snap, 3-stage step-up, grounded respawn
- Save slot `kiblox-save-v4`

## 0.3.0 — 2026-08-27

- Own generated block atlas, sky, title art, dragon-orb and ki-blast sprites
- Richer map: biomes, rivers, ravines, temple ruin, village, cloud islands, taller world
- Movement: coyote / jump buffer, accel+friction, look-based ki-flight, swim-look, step-up, FOV
- New blocks: Tempelstein, Lehm, Wolkenflaum
- Save slot `kiblox-save-v3` (old worlds do not migrate)

## 0.2.0 — 2026-08-23

- Continue vs new-world, pointer lock, touch fly/hotbar
- Drag-look vs mine, storm wish scatter, ghost gamepad, dispose leaks
- Docs, MIT license, NOTICE, roadmap

## 0.1.0 — 2026-08-23

- Initial public snapshot
