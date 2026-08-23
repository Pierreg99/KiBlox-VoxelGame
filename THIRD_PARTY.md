# Third-party licenses

KI BLOX is MIT-licensed original work. Runtime and build tooling come from
other projects. The following are the **direct** dependencies that ship in or
build the game. Transitive packages keep the licenses of their authors;
inspect `node_modules/<pkg>/LICENSE*` after `npm install` for the full set.

## Game runtime

| Package | License | Copyright / project |
|---------|---------|---------------------|
| [three](https://github.com/mrdoob/three.js) | MIT | mrdoob / three.js contributors |
| [react](https://github.com/facebook/react) / react-dom | MIT | Meta Platforms, Inc. and affiliates |
| [@tanstack/react-router](https://github.com/TanStack/router) | MIT | TanStack |
| [@tanstack/react-start](https://github.com/TanStack/router) | MIT | TanStack |
| [zustand](https://github.com/pmndrs/zustand) | MIT | Poimandres |
| [simplex-noise](https://github.com/jwagner/simplex-noise.js) | MIT | Jonas Wagner |
| [lucide-react](https://github.com/lucide-icons/lucide) | ISC | Lucide Contributors |
| [zod](https://github.com/colinhacks/zod) | MIT | Colin McDonnell |
| [tailwindcss](https://github.com/tailwindlabs/tailwindcss) | MIT | Tailwind Labs |

## Tooling (dev / build)

| Package | License |
|---------|---------|
| [vite](https://github.com/vitejs/vite) | MIT |
| [typescript](https://github.com/microsoft/TypeScript) | Apache-2.0 |
| [eslint](https://github.com/eslint/eslint) | MIT |
| [prettier](https://github.com/prettier/prettier) | MIT |
| [playwright](https://github.com/microsoft/playwright) | Apache-2.0 |

The App Builder workspace also vendors unused auth/database scaffolding
(`better-auth`, `kysely`, `pg`, `@electric-sql/pglite`, Radix primitives).
KI BLOX does **not** turn those on — progress lives in `localStorage` only.

## Fonts

Display type is loaded from Google Fonts (Bebas Neue / system stack) at
runtime. Those font files are **not** redistributed in this repository.

## No official media

No Dragon Ball, Minecraft or other copyrighted media is bundled. See
[`NOTICE.md`](./NOTICE.md).
