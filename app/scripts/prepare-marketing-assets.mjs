import { copyFile, mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Copy the project's original locally licensed fonts at build/dev time.
// Generated font files must stay untracked and are NOT included in the patch.
const root = fileURLToPath(new URL("../", import.meta.url));
const dir = join(root, "public", "marketing", "fonts");
await mkdir(dir, { recursive: true });
for (const name of ["baloo-variable.ttf", "inter-tight-variable.ttf"]) {
  const source = join(root, "assets", "fonts", name);
  const dest = join(dir, name);
  try {
    await stat(source);
    await copyFile(source, dest);
  } catch (error) {
    throw new Error(`Font originale mancante: ${source}. Non sostituirlo con download non verificati.`, { cause: error });
  }
}
console.log("LOCO: font originali preparati in public/marketing/fonts");
