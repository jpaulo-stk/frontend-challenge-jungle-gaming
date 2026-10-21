// Lighthouse: 3 runs per page and profile on vite preview; keeps the median report.
// Usage: pnpm build && pnpm lighthouse

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const PORT = 4173;
const BASE = `http://localhost:${String(PORT)}`;
const RUNS = 3;
const OUT = path.resolve("lighthouse");
const TMP = path.join(OUT, "tmp");

const pages = [
  { id: "inicio", path: "/" },
  { id: "detalhe", path: "/nft/emerald-ape-042" },
];
// Lighthouse defaults: mobile = Moto G Power, slow 4G, 4× CPU slowdown;
// desktop = the official desktop config (no CPU slowdown, fast network).
const profiles = [
  { id: "mobile", config: undefined },
  { id: "desktop", config: desktopConfig },
];
const categories = ["performance", "accessibility", "best-practices", "seo"];
const metrics = {
  LCP: "largest-contentful-paint",
  CLS: "cumulative-layout-shift",
  TBT: "total-blocking-time",
};

function startPreview() {
  const child = spawn("pnpm", ["preview", "--port", String(PORT), "--strictPort"], {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("vite preview did not start in 30s (run `pnpm build` first)"));
    }, 30_000);
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes(String(PORT))) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`vite preview exited with code ${String(code)}`));
    });
  });
}

function stopPreview(child) {
  if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
  else child.kill("SIGTERM");
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

// Retry once if the browser target crashes
async function audit(url, profile, attempt = 1) {
  try {
    return await auditOnce(url, profile);
  } catch (error) {
    if (attempt >= 2) throw error;
    process.stdout
      .write(`  nova tentativa: ${error instanceof Error ? error.message : String(error)}
`);
    return audit(url, profile, attempt + 1);
  }
}

async function auditOnce(url, profile) {
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH ?? chromium.executablePath(),
    chromeFlags: ["--headless=new", "--no-first-run", "--disable-extensions"],
  });
  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, output: ["html", "json"], logLevel: "error" },
      profile.config,
    );
    if (!result) throw new Error(`Lighthouse returned nothing for ${url}`);
    return result;
  } finally {
    await chrome.kill();
  }
}

async function main() {
  await mkdir(TMP, { recursive: true });
  const preview = await startPreview();
  const summary = [];
  let environment = null;

  try {
    for (const page of pages) {
      for (const profile of profiles) {
        const runs = [];
        for (let run = 1; run <= RUNS; run += 1) {
          process.stdout.write(
            `${page.id} · ${profile.id} · medição ${String(run)}/${String(RUNS)}\n`,
          );
          const result = await audit(`${BASE}${page.path}`, profile);
          const name = `${page.id}-${profile.id}-${String(run)}`;
          await writeFile(path.join(TMP, `${name}.report.html`), result.report[0]);
          await writeFile(path.join(TMP, `${name}.report.json`), result.report[1]);
          environment ??= {
            lighthouse: result.lhr.lighthouseVersion,
            chrome: result.lhr.environment.hostUserAgent.match(/Chrome\/[\d.]+/)?.[0] ?? "?",
            benchmarkIndex: result.lhr.environment.benchmarkIndex,
          };
          runs.push({
            report: result.report,
            lhr: result.lhr,
            performance: result.lhr.categories.performance.score ?? 0,
          });
        }

        const kept = [...runs].sort((a, b) => a.performance - b.performance)[Math.floor(RUNS / 2)];
        await writeFile(path.join(OUT, `${page.id}-${profile.id}.report.html`), kept.report[0]);
        await writeFile(path.join(OUT, `${page.id}-${profile.id}.report.json`), kept.report[1]);

        const row = { page: page.id, profile: profile.id };
        for (const category of categories) {
          row[category] = Math.round(
            median(runs.map((run) => (run.lhr.categories[category].score ?? 0) * 100)),
          );
        }
        for (const [label, audit] of Object.entries(metrics)) {
          row[label] = median(runs.map((run) => run.lhr.audits[audit].numericValue ?? 0));
        }
        summary.push(row);
      }
    }
  } finally {
    stopPreview(preview);
  }

  const format = {
    LCP: (value) => `${(value / 1000).toFixed(2)} s`,
    CLS: (value) => value.toFixed(3),
    TBT: (value) => `${String(Math.round(value))} ms`,
  };
  const header =
    "| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |";
  const lines = [
    `Medianas de ${String(RUNS)} medições por página e perfil.`,
    "",
    header,
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...summary.map(
      (row) =>
        `| ${row.page} | ${row.profile} | ${String(row.performance)} | ${String(row.accessibility)} | ${String(row["best-practices"])} | ${String(row.seo)} | ${format.LCP(row.LCP)} | ${format.CLS(row.CLS)} | ${format.TBT(row.TBT)} |`,
    ),
    "",
    `Lighthouse ${environment?.lighthouse ?? "?"} · ${environment?.chrome ?? "?"} (headless, Chromium do Playwright) · benchmarkIndex ${String(environment?.benchmarkIndex ?? "?")}`,
    `Node ${process.version} · ${os.cpus()[0]?.model ?? "CPU desconhecida"} · ${String(os.cpus().length)} núcleos`,
    "Perfis: mobile = padrão do Lighthouse (rede 4G lenta simulada, CPU 4× mais lenta); desktop = configuração desktop oficial (sem lentidão de CPU).",
    "",
  ];
  await writeFile(path.join(OUT, "summary.md"), lines.join("\n"));
  await writeFile(
    path.join(OUT, "summary.json"),
    `${JSON.stringify({ environment, summary }, null, 2)}\n`,
  );
  process.stdout.write(`\n${lines.join("\n")}`);
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exit(1);
});
