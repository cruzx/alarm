import { mkdir, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

const port = Number(process.env.MOTION_FORGE_PORT || 4173);
const baseUrl = `http://127.0.0.1:${port}`;
const frameDir = path.resolve("exports", "frames");
const outFile = path.resolve("exports", "motion.mp4");
const projectJsonPath = process.env.MOTION_FORGE_PROJECT_JSON;

function run(command, args, options = {}) {
  return spawn(command, args, { stdio: "inherit", shell: false, ...options });
}

async function waitForServer() {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error(`Vite did not start at ${baseUrl}`);
}

if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0) {
  throw new Error("ffmpeg is required for MP4 export. Install it, then rerun npm run export:mp4.");
}

await rm(frameDir, { recursive: true, force: true });
await mkdir(frameDir, { recursive: true });

const server = run("npx", ["vite", "--host", "127.0.0.1", "--port", String(port)]);

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  if (projectJsonPath) {
    const projectJson = JSON.parse(await readFile(path.resolve(projectJsonPath), "utf8"));
    await page.addInitScript((project) => {
      window.__MOTION_FORGE_PROJECT__ = project;
    }, projectJson);
  }
  await page.goto(`${baseUrl}/?capture=1`, { waitUntil: "networkidle" });

  const meta = await page.evaluate(() => ({
    duration: window.motionForge.duration,
    fps: window.motionForge.fps,
    width: window.motionForge.width,
    height: window.motionForge.height,
  }));
  await page.setViewportSize({ width: meta.width, height: meta.height });

  const frames = Math.round(meta.duration * meta.fps);
  const captureTarget = (await page.locator("#capture-frame").count()) > 0 ? page.locator("#capture-frame") : page.locator("#stage");
  for (let i = 0; i < frames; i += 1) {
    await page.evaluate((seconds) => window.motionForge.seek(seconds), i / meta.fps);
    await captureTarget.screenshot({ path: path.join(frameDir, `frame-${String(i).padStart(5, "0")}.png`) });
  }
  await browser.close();

  const encode = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      String(meta.fps),
      "-i",
      path.join(frameDir, "frame-%05d.png"),
      "-pix_fmt",
      "yuv420p",
      "-vf",
      `scale=${meta.width}:${meta.height}:force_original_aspect_ratio=decrease,pad=${meta.width}:${meta.height}:(ow-iw)/2:(oh-ih)/2`,
      outFile,
    ],
    { stdio: "inherit" },
  );
  if (encode.status !== 0 || !existsSync(outFile)) {
    throw new Error("ffmpeg failed to create exports/motion.mp4");
  }
  console.log("Wrote exports/motion.mp4");
} finally {
  server.kill("SIGTERM");
}
