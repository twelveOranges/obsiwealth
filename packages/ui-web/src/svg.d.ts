/**
 * Module declaration for `*.svg` imports.
 *
 * esbuild is configured (see `build.js`) with `loader: { ".svg": "text" }`,
 * so `import logo from "…/foo.svg"` resolves to the raw SVG markup as a
 * string at bundle time. Keeping the declaration here (included via
 * `tsconfig.json > include`) lets the rest of the codebase type-check
 * without installing a SVG-specific package.
 */
declare module "*.svg" {
  const content: string;
  export default content;
}
