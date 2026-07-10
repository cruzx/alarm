import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildLottie } from "../src/lottie-spec.js";

const outDir = path.resolve("exports");
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "motion.json"), JSON.stringify(buildLottie(), null, 2));
console.log("Wrote exports/motion.json");
