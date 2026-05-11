# apps/obsidian

Obsidian plugin shell for ObsiWealth.

## Files

- `src/main.ts` — `Plugin` subclass, wires up repositories, commands and
  the ribbon icon.
- `src/mainView.ts` — the `ItemView` subclass that renders the main
  Funds / Assets / Stats tabs. All rendering work is delegated to
  `@ui/*` modules.
- `src/settings/` — `PluginSettingTab` subclass and backup import /
  export controls.
- `src/storage/obsidianHost.ts` — the one and only file that touches
  Obsidian APIs outside of the shell (`Modal`, `Notice`,
  `vault.adapter`). Implements `HostContext` for `@core`.

## Build

Build entry points are configured in the repo-root `build.js` and
`tsconfig.json`. The produced `main.js` + `manifest.json` live at the
repo root because Obsidian requires it.

## Why a thin shell?

Everything outside this directory (except `assets/`) is platform-
neutral. Porting to a new host (RN, WeChat miniapp, plain web) requires
creating a sibling `apps/<name>/` that provides its own implementation
of `HostContext` and its own native entry point.
