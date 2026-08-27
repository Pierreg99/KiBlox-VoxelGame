# QUALITY — KI BLOX

Was „fertig“ für eine spielbare Session heißt. Kein Marketing.

## Muss halten

| Check | Bar |
|-------|-----|
| Titel in wenigen Sekunden | Welt ist da, Kampagne / Freies Spiel klickbar |
| Laufen | WASD = FPS-Strafe, kein Fahrzeug |
| Boden | Kein Versinken in Bedrock, kein Durchfallen durch geschlossene Fläche |
| Bäume | Blätter tragfähig, Kronen dicht genug zum Stehen |
| Sprung / Flug | Leertaste springt, in der Luft nochmal = Ki-Flug geradeaus (Space hoch, Shift runter) |
| Charaktere | Minecraft-Proportion (32 px / 1.8 m), Ki-Gi, Walk/Fly/Punch |
| Völker | Solari, Veldari, Cryon, Automata, Thrynn, Aetheri — original |
| Kampf | Combo, schwerer Schlag, Ki-Scheibe, Slam, Hagel, SSJ ab 4500 |
| Kampagne | Fünf Welten, Story, Boss, Tor, Landmarken |
| Save | `kiblox-save-v7`, lokal, kein Account |
| Mobile | Touch-Sticks, Rede, Flug, Ki |
| Konsole | Keine uncaught errors im Play-Pfad |

## Grafik

- Voxel: ein Mesh pro Chunk, Face-Culling, Atlas, AO.
- Wesen: Box-Humanoids, Pixel-Gesichter, Gelenke, Aura an Elite/Lord.
- Kein UnrealBloom (schwarzer Frame auf Software-GL).
- 3D bleibt Geometrie. Imagine nur für 2D (Atlas, Sky, Portraits).

## Physik

- AABB vs Voxel, Substep, Step-up, Snap auf Support-Y (klebriger Rand gegen 1-Block-Löcher).
- Fallgeschwindigkeit gekappt. Unter y 1: Rescue auf Oberfläche oder Spawn.
- Blätter solid. 1-Block-Löcher in der Oberfläche werden zugeschlossen.

## Nicht die Bar

Auth, DB, Multiplayer, GLTF-Charaktere, Infinite-World.

## Nach jeder Runde

1. Typecheck grün
2. Dev-Preview zeigt Titel + Wesen
3. Fall-Probe: hoher y, fallen, nicht in Bedrock kleben
4. Production-Build startet
