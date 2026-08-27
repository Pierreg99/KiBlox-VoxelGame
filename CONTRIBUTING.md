# Contributing

Issues und PRs sind willkommen. Das Spiel ist klein — lieber ein klarer Fix
als ein neues System.

## Setup

```bash
git clone https://github.com/Pierreg99/KIBlockx.git
cd kiblox
npm install
npm run dev
```

Dev-Server: Vite auf Port 8080, Host `0.0.0.0`.

## Checks vor einem PR

```bash
npm run typecheck
npm run lint
npm run build
```

Wenn du Steuerung anfasst: WASD muss **FPS-Strafe** bleiben (W −Z bei Yaw 0,
A −X, D +X). Flug auf Touch muss ohne extra Knopf sinken können.

## Code-Karte

| Du willst … | Datei |
|-------------|--------|
| Balancing, Weltgröße, Blöcke | `src/game/constants.ts` |
| Terrain, Kugeln, Spawns | `src/game/world.ts` |
| Charaktere, Animation | `src/game/beings.ts` |
| Loop, Kampf, Kamera, Wünsche | `src/game/engine.ts` |
| Tasten / Touch / Pad | `src/game/input.ts` |
| HUD, Titel, Overlays | `src/components/game-app.tsx` |
| Save-Format | `src/game/save.ts` — bei Bruch `SAVE_VERSION` + `SAVE_KEY` anheben |

## Leitplanken

- **Kein Auth, keine DB** für Spielstand. localStorage reicht.
- **Keine offiziellen Dragon-Ball- oder Minecraft-Assets.**
- Keine `console.log` in der Frame-Loop.
- Deutsche UI-Texte (Spieler:innen), englische Bezeichner im Code.
- Keine neuen Abstraktionen für einmalige Operationen.

## Lizenz

Beiträge stehen unter der MIT-Lizenz des Repos. Fan-Disclaimer in
[`NOTICE.md`](./NOTICE.md) gilt weiter.
