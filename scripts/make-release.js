// Collect the files an Obsidian plugin user actually needs
// (main.js + manifest.json + styles.css if present) into ./release/ so
// they can be attached to a GitHub Release as-is.
//
// As of this revision all SVG assets (built-in icons + bank/payment
// logos) are inlined into `main.js` at build time via the esbuild
// `text` loader, so there is nothing more to ship alongside it.
// PNG icons are handled by the in-app "upload local image" flow
// (stored under `.obsiwealth/icons/` so the user's own backup
// captures them).
//
// Kept deliberately dependency-free (pure Node fs) so `npm run release`
// works on a fresh clone with only devDependencies installed.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "release");

const REQUIRED = ["main.js", "manifest.json"];
const OPTIONAL = ["styles.css"];

function ensureEmptyDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copy(name, { required }) {
  const src = path.join(ROOT, name);
  if (!fs.existsSync(src)) {
    if (required) {
      console.error(`[release] missing required file: ${name}`);
      process.exit(1);
    }
    return false;
  }
  fs.copyFileSync(src, path.join(OUT_DIR, name));
  return true;
}

function main() {
  ensureEmptyDir(OUT_DIR);
  REQUIRED.forEach((name) => copy(name, { required: true }));
  OPTIONAL.forEach((name) => copy(name, { required: false }));

  const version = JSON.parse(
    fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"),
  ).version;
  console.log(
    `[release] v${version} ready in ./release/ (main.js + manifest.json + styles.css)`,
  );
}

main();
