import { readFileSync } from "node:fs";
import { join } from "node:path";

export function GET() {
  const root = process.cwd();
  let license = "";
  let notice = "";

  try {
    license = readFileSync(join(root, "LICENSE.txt"), "utf8");
  } catch {
    license = "(LICENSE.txt not found)";
  }

  try {
    notice = readFileSync(join(root, "NOTICE"), "utf8");
  } catch {}

  const text = [license.trim(), "\n\n", notice.trim()].join("\n");

  return new Response(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
