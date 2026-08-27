# PROGRESS — KI BLOX

Letzte Aktualisierung: 2026-08-27.

Das Spiel ist **spielbar**. v0.6.5: Kampagne hart (bewachte Kugeln, kurze I-Frames, Wächter mit Adds).

## Status

| Bereich | Stand |
|---------|-------|
| Titel / Laden / Pause / Tod / Wunsch | Fertig |
| Drei Modi + Regeln-Overlay | Fertig |
| Inventar + Hotbar-Zählung | Fertig |
| Aufgaben / Quest-Log / Progress | Fertig |
| Voxel-Welt + Chunk-Meshing | Fertig |
| FPS-Bewegung, Ki-Flug Blick, Snap, Step-up, Void-Rescue | Fertig |
| localStorage Save v6 | Fertig |
| Bauen / Abbauen, Hotbar Desktop + Touch | Fertig |
| Ki-Kampf, Dash, Super Saiyan | Fertig |
| Drachenkugeln + Orryx-Wünsche | Fertig |
| Kampagne 5 Welten / 6 Völker / Story / Bosse | Fertig |
| Humanoids + Walk/Fly/Punch | Fertig |
| Touch-Sticks + Gamepad | Fertig |
| Auth / DB / Multiplayer | Aus, absichtlich |
| Tests (Playwright-Smoke intern) | Manuell + Smoke, keine CI-Matrix |


## Geschafft

### Welt & Grafik

- 128×80×128 Terrain, Schirmbäume, Lehm-Kuppeln, Zikkurat, Pfade, Wasserfälle, Ki-Haine
- 16³-Chunks, Ambient Occlusion, Atlas-Texturen (kein Bloom)
- Drachenkugeln mit Sternen, Shenron-Modell (prozedural)
- Gegner: grunt, shooter, flyer, brute, elite, lord — Pixel-Humanoids
- Dichte Baumkronen, zugeschlossene 1-Block-Löcher, begehbare Blätter

### Loop

- Ki sammeln (Kristalle, Kämpfe), Super Saiyan ab 4500
- Sieben Kugeln → Wunsch: Kraft / Heilen / Neue Jagd / Tor
- Neue Jagd **verstreut** die Kugeln wirklich (`scatterBalls`)
- Tod → Respawn am Nest, Ki bleibt
- Save v5: Position, Blick, Power, HP, Energie, Flug, SSJ, Kugeln, Edits, Kampagne

### Steuerung (v0.2, die wichtige Runde)

- WASD ist FPS-Strafe, kein Fahrzeug-Lenken
- Primary **Fortsetzen / Spielen** lädt den Save, regeneriert die Welt **nicht**
- „Am Spawn neu starten“ = gleicher Seed, Avatar reset
- „Neue Welt“ = neuer Seed
- Pointer Lock **vor** async Chunk-Rebuild (User-Gesture)
- Linksziehen sieht um, mine-t nicht (Drag-Schwelle)
- Touch: Flug sinkt ohne Sprung-Hold, Hotbar tappbar
- Touch-Erkennung ohne False-Positive auf Laptops mit `maxTouchPoints`
- Ghost-Gamepad (viele Buttons „gedrückt“) wird ignoriert
- Edge-Trigger starten „bereits gedrückt“, damit klemmende Pads nicht Dash feuern
- Spawn-Unverwundbarkeit ~1.4 s
- Dispose: Gegner, Kugeln, Wolken, Pools, gemeinsame Geometrien einmal

## Zahlen

| | |
|---|---|
| Kern (`src/game` + HUD) | ~4.5k Zeilen |
| Engine | ~2.0k Zeilen |
| Save-Key | `kiblox-save-v5` |
| Gegner-Spawns | bis 24 + Boss |
| Drachenkugeln | 7 |
| Edit-Cap im Save | 2500 |

## Offen (kein Blocker zum Spielen)

Siehe [`ROADMAP.md`](./ROADMAP.md) und [`QUALITY.md`](./QUALITY.md). Kurz: mehr Biome-Props, klarere Treffer, Inventar,
größere Welt, optional P2P — alles nach v1.
