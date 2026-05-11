// @obsiwealth/ui-web — DOM / HTML UI layer.
//
// This package owns every piece of code that manipulates the DOM:
//   modals, pages, charts, components, view state & view helpers,
//   fund/bank logo rendering, icons, and the password gate.
//
// It depends on `@obsiwealth/core` for pure domain logic and on a
// runtime-injected `HostContext` (see core's `hostRegistry`) for platform
// services like KV storage, toasts, resource URL resolution, and modal
// hosting.
//
// Transitional note: 15 legacy modals still extend Obsidian's `Modal`
// class directly, and `view/viewContext.ts` references `App` / the
// Obsidian-native `AppModel` type. These will be refactored onto
// `ModalHost` + an `AppModel` interface in a follow-up pass; until then
// `obsidian` is declared as an optional peer dependency.
//
// This package has intentionally no public barrel: the Obsidian shell
// imports deep paths (e.g. `@ui/pages/assetsPage`, `@ui/modals/fundModal`)
// directly. Re-exporting them from one root would create an import cycle
// with the shell and defeat tree-shaking. Keep the shell's imports narrow.

export {};
