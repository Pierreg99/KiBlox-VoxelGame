# PROGRESS — KI BLOX

Letzte Aktualisierung: 2026-08-27.

Das Spiel ist **spielbar**. v0.4: eigene Atlas-Texturen, dichtere Karte, straffere Bewegung.

## Status

| Bereich | Stand |
|---------|-------|
| Titel / Laden / Pause / Tod / Wunsch | Fertig |
| Voxel-Welt + Chunk-Meshing + Bloom | Fertig |
| FPS-Bewegung, Ki-Flug Blick, Snap, Step-up | Fertig |
| localStorage Save v4 | Fertig |
| Bauen / Abbauen, Hotbar Desktop + Touch | Fertig |
| Ki-Kampf, Dash, Super Saiyan | Fertig |
| Drachenkugeln + Shenron-Wünsche | Fertig |
| Touch-Sticks + Gamepad | Fertig |
| Auth / DB / Multiplayer | Aus, absichtlich |
| Tests (Playwright-Smoke intern) | Manuell + Smoke, keine CI-Matrix |

## Geschafft

### Welt & Grafik

- 128×80×128 Terrain, Schirmbäume, Lehm-Kuppeln, Zikkurat, Pfade, Wasserfälle, Ki-Haine
- 16³-Chunks, Ambient Occlusion, Atlas-Texturen, Bloom
- Drachenkugeln mit Sternen, Shenron-Modell (prozedural)
- Gegner: grunt, shooter, flyer

### Loop

- Ki sammeln (Kristalle, Kämpfe), Super Saiyan ab 4500
- Sieben Kugeln → Wunsch: Kraft / Heilen / Neue Jagd
- Neue Jagd **verstreut** die Kugeln wirklich (`scatterBalls`)
- Tod → Respawn am Nest, Ki bleibt
- Save: Position, Blick, Power, HP, Energie, Flug, SSJ, Kugeln, Edits

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
| Kern (`src/game` + HUD) | ~4.1k Zeilen |
| Engine | ~1.9k Zeilen |
| Save-Key | `kiblox-save-v2` |
| Gegner-Spawns | bis 16 |
| Drachenkugeln | 7 |
| Edit-Cap im Save | 2500 |

## Offen (kein Blocker zum Spielen)

Siehe [`ROADMAP.md`](./ROADMAP.md). Kurz: mehr Biome, bessere KI, Inventar,
größere Welt, optional P2P — alles nach v1.
