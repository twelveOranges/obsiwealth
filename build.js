const esbuild = require("esbuild");
const path = require("path");

const isWatch = process.argv.includes("--watch");

// Workspace packages that expose both a bare alias (`@core`) pointing at
// `<pkg>/src/index.ts` AND a subpath alias (`@core/foo`) that resolves to
// a file or `index.ts` inside the package. Keep this list in sync with
// `tsconfig.json > compilerOptions.paths`.
const WORKSPACE_PACKAGES = [
  { alias: "@core", root: path.resolve(__dirname, "packages/core/src") },
  { alias: "@ui", root: path.resolve(__dirname, "packages/ui-web/src") },
];

// Subpath-only aliases (no bare entry; require `@host/<something>`).
// `@host` is the Obsidian plugin shell.
const SUBPATH_ONLY_PACKAGES = [
  { alias: "@host", root: path.resolve(__dirname, "apps/obsidian/src") },
];

async function build() {
  const ctx = await esbuild.context({
    entryPoints: ["apps/obsidian/src/main.ts"],
    bundle: true,
    outfile: "main.js",
    platform: "node",
    format: "cjs",
    external: ["obsidian"],
    sourcemap: true,
    // All SVG assets (built-in icons + bank logos) live on disk as individual
    // files under `assets/` and are inlined at build time via the `text`
    // loader — the resulting bundle is self-contained so the release zip only
    // needs `main.js + manifest.json + styles.css`.
    loader: { ".svg": "text" },
    alias: Object.fromEntries(
      WORKSPACE_PACKAGES.map((p) => [p.alias, path.join(p.root, "index.ts")]),
    ),
    plugins: [
      {
        name: "workspace-subpath-alias",
        setup(b) {
          const fs = require("fs");
          const EXTS = [".ts", ".tsx", ".js"];
          const tryResolve = (base) => {
            for (const ext of EXTS) {
              if (fs.existsSync(base + ext)) return base + ext;
            }
            for (const ext of EXTS) {
              const p = path.join(base, "index" + ext);
              if (fs.existsSync(p)) return p;
            }
            return null;
          };

          const allPkgs = [...WORKSPACE_PACKAGES, ...SUBPATH_ONLY_PACKAGES];
          for (const pkg of allPkgs) {
            const prefix = pkg.alias + "/";
            const filter = new RegExp(
              "^" + pkg.alias.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "/",
            );
            b.onResolve({ filter }, (args) => {
              const rest = args.path.slice(prefix.length);
              const resolved = tryResolve(path.join(pkg.root, rest));
              if (!resolved) return { errors: [{ text: `Cannot resolve ${args.path}` }] };
              return { path: resolved };
            });
          }
        },
      },
    ],
  });

  if (isWatch) {
    await ctx.watch();
    console.log("watching...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log("build done");
  }
}

build().catch(() => process.exit(1));