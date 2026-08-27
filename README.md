# KI BLOX

Voxel first-person in the browser: Minecraft bones, Dragon-Ball blood.
Five worlds, six peoples, seven orbs, one wish-serpent.

[![License: MIT](https://img.shields.io/badge/License-MIT-2ea043.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](./package.json)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-000.svg)](https://threejs.org/)

> **Fan work.** Unofficial. Not affiliated with Toei, Shueisha, Bandai or Mojang.
> See [`NOTICE.md`](./NOTICE.md).

![Titel](docs/title.png)

**Kampagne · Bauen · Fliegen · Ki · Orryx**

![Im Spiel](docs/play.png)

## Spielen

Fortschritt lokal (`localStorage`, Schlüssel `kiblox-save-v5`). Kein Account.

Quellcode: [github.com/Pierreg99/KIBlockx](https://github.com/Pierreg99/KIBlockx)

| | |
|---|---|
| **Kampagne** | Orbit-Saga: Verdant → Terra → Cinder → Rime → Aether |
| **Völker** | Solari, Veldari, Cryon, Automata, Thrynn, Aetheri — blocky Humanoids, Walk/Fly |
| **Kampf** | Schlag, geladener Ki-Stoß, Dash, Super Saiyan ab 4500 Ki |
| **Welt** | 128×80×128 Blöcke, Inseln, Tempel, Bosse |
| **Bauen** | Halten = abbauen, Rechtsklick = setzen, Hotbar 1–5 |

### Steuerung

**Tastatur + Maus**

| Taste | Aktion |
|-------|--------|
| WASD | Laufen (W vor, A links, D rechts — FPS-Strafe) |
| Maus | Umsehen (Klick sperrt den Pointer) |
| Leertaste | Springen · in der Luft nochmal: Ki-Flug |
| Flug + Leertaste | Steigen |
| Flug + Shift / Strg | Sinken |
| E | Mit NPC reden |
| Linksklick halten | Abbauen / schlagen |
| Rechtsklick | Block setzen |
| Q halten, loslassen | Geladener Ki-Stoß |
| R | Dash |
| F | Super Saiyan |
| 1–5 / Mausrad | Hotbar |
| ESC | Pause |

**Touch:** Stick links, Blick rechts, Rede / Flug / Ki unten.

### Kampagne

1. **Verdant** — Venn. Sieben Kugeln, dann Rax.
2. **Terra** — Lira. Automata, Einheit Sieben.
3. **Cinder** — Oru. Lava, Skarn.
4. **Rime** — Nyx. Hohe Veyra.
5. **Aether** — Aeon. Lord Kryll, letzter Wunsch.

Orryx nach Boss + sieben Kugeln. Wunsch **Das Tor öffnen** schaltet die nächste Welt frei.

Freies Spiel bleibt die Sandbox ohne Quest.

### Wünsche

| Wunsch | Effekt |
|--------|--------|
| Das Tor öffnen | Sternentor (Kampagne) |
| Mehr Kraft | +4000 Ki |
| Voller Körper | Leben + Energie voll |
| Neue Jagd | Kugeln neu verstreuen |

## Docs

| File | |
|------|--|
| [`PLAN.md`](./PLAN.md) | Vision, Architektur |
| [`QUALITY.md`](./QUALITY.md) | Spiel-Bar, Physik, Grafik |
| [`PROGRESS.md`](./PROGRESS.md) | Was steht |
| [`ROADMAP.md`](./ROADMAP.md) | Was als Nächstes |
| [`CHANGELOG.md`](./CHANGELOG.md) | Versionen |
| [`LICENSE`](./LICENSE) | MIT |
| [`NOTICE.md`](./NOTICE.md) | Fan-Disclaimer |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Beiträge |

## Technik

| | |
|---|---|
| UI | React 19, TanStack Start, Tailwind v4 |
| 3D | Three.js 0.185, Chunk-Meshes, AO, no bloom (WebGL-safe) |
| State | Zustand HUD, Save v5 |
| Audio | Web Audio, synthetisiert |
| Input | Pointer Lock, Touch, Gamepad |

```
src/game/     engine, world, campaign, beings, input
src/components/game-app.tsx   HUD, Story, Warp
public/game/  atlas, skies, portraits
```

Auth and database stay **off**.

## Lizenz

MIT — [`LICENSE`](./LICENSE). Völker, Welten und Orryx sind original.
Dragon-Ball- und Minecraft-Stimmung ist Hommage, kein Asset-Diebstahl.
