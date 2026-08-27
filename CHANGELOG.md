# Changelog

## 0.6.5 — 2026-08-27

- Kampagne is a real fight: guarded orbs, packs at the temple, short i-frames, fall/lava kill
- Ki is earned slowly (kills, crystals, stars). Super Saiyan is mid-saga, not planet one
- Enemies aggro in packs, lead shots, brutes charge, bosses enrage and call adds
- Wish on power is a spark, not a dump. Freies Spiel stays the softer hunt

## 0.6.4 — 2026-08-27

- Camera: dedicated FPS yaw/pitch rig (camera is a child, local rotation always identity). Title shot is locked — no orbit, no lookAt, player yaw is not overwritten
- Play view does not bob or shake the head; FOV only changes on zoom (Z)
- Menus: Minecraft slab buttons over the live island, extruded KI BLOX wordmark, scouter corner brackets. No left editorial sheet, no numbered SaaS list
- Pause / Inventar / Aufgaben / Regeln use the same beveled window chrome

## 0.6.3 — 2026-08-27

- Camera: FPS yaw/pitch rig only (no lookAt leftover from title), stable eye lerp, quieter bob/shake, tighter FOV
- Menus: left editorial sheet instead of generic centered cards (numbered modes, hairline rules)

## 0.6.2 — 2026-08-27

- Controls: sneak (Shift, edge-lock), sprint (Ctrl / double-tap W), zoom (Z), fly boost, ice slide, hold-to-place, look-sway fists, land dip, gamepad rumble
- Assets: Namek grass (olive-yellow), Ajisa wood (violet bark), glyph temple bricks, hexagonal ki crystal, teal water, circuit metal
- Swim up is world-up. Place repeats while held.

## 0.6.1 — 2026-08-27

- Controls: WASD is straight (W vor, A links, D rechts, S zurück). Ki-Flug no longer dives with the look; Space up, Shift down
- Blocks: wrap-seamless atlas (grass tufts, wood grain, temple bricks, lava veins, ice cracks, metal rivets)
- Menus: live world behind the title, solid sheets, isometric hotbar cubes, quieter type
- HUD chips and panels share one surface language

## 0.6.0 — 2026-08-27

- Three modes: Kampagne (story), Kreativ (infinite blocks, no damage), Freies Spiel
- Inventory: mining fills the bag, placing spends stacks; I opens the grid, 1–9 hotbar
- Quest log with progress bars, rules overlay at mode start, J / H / Pause shortcuts
- Creative tasks: mine, place, palette, tower, flight, shrine, cloud edge
- Sandbox tasks: orbs, hunts, camp, Super Saiyan
- Save slot `kiblox-save-v6` (inventory, mode, quest progress)

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
