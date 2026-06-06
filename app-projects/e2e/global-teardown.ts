import fs from "node:fs";
import path from "node:path";

/** Remove all test artifacts so they never pollute the real codex. */
export default function globalTeardown() {
  for (const dir of ["_test-content", "_test-inbox"]) {
    fs.rmSync(path.join(process.cwd(), dir), { recursive: true, force: true });
  }
}
