#!/usr/bin/env node
// @ts-check
"use strict";

const { program } = require("commander");
const path = require("path");
const fs = require("fs");
const { execSync, spawn } = require("child_process");

// ── Helpers ──────────────────────────────────────────────────────────────────

function chalk(code, text) {
  return `\x1b[${code}m${text}\x1b[0m`;
}
const green  = (t) => chalk(32, t);
const cyan   = (t) => chalk(36, t);
const yellow = (t) => chalk(33, t);
const red    = (t) => chalk(31, t);
const bold   = (t) => chalk(1,  t);
const dim    = (t) => chalk(2,  t);

function log(msg)  { console.log(`  ${msg}`); }
function info(msg) { log(`${cyan("›")} ${msg}`); }
function ok(msg)   { log(`${green("✓")} ${msg}`); }
function warn(msg) { log(`${yellow("⚠")} ${msg}`); }
function err(msg)  { log(`${red("✗")} ${msg}`); }

/** Parse a .env / .env.local file into a key→value map */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const out = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    out[key] = val;
  }
  return out;
}

/** Find credentials from the caller's project directory */
function loadProjectEnv(cwd) {
  const candidates = [".env.local", ".env"];
  for (const name of candidates) {
    const full = path.join(cwd, name);
    if (fs.existsSync(full)) return { vars: parseEnvFile(full), file: name };
  }
  return { vars: {}, file: null };
}

// ── Package root (where this CLI lives after install) ─────────────────────────
const PKG_ROOT = path.resolve(__dirname, "..");

// ── Commands ──────────────────────────────────────────────────────────────────

program
  .name("policycraft")
  .description("Generate Supabase RLS policies from plain English")
  .version(require(path.join(PKG_ROOT, "package.json")).version);

/* ── init ── */
program
  .command("init")
  .description("Set up PolicyCraft in the current project")
  .option("--skip-script", "Don't add an npm script to package.json")
  .action((opts) => {
    const cwd = process.cwd();
    console.log();
    console.log(bold("  PolicyCraft — setup"));
    console.log();

    // 1. Check for env file
    const { vars, file } = loadProjectEnv(cwd);
    const hasUrl = !!(vars.NEXT_PUBLIC_SUPABASE_URL || vars.SUPABASE_URL);
    const hasKey = !!vars.SUPABASE_SERVICE_ROLE_KEY;
    const hasAI  = !!vars.OPENAI_API_KEY;

    if (file) {
      info(`Found ${bold(file)}`);
      ok(`SUPABASE_URL          ${hasUrl ? green("found") : yellow("missing")}`);
      ok(`SERVICE_ROLE_KEY      ${hasKey ? green("found") : yellow("missing")}`);
      ok(`OPENAI_API_KEY        ${hasAI  ? green("found") : yellow("missing")}`);
    } else {
      warn("No .env.local or .env found in this directory.");
    }

    if (!hasUrl || !hasKey || !hasAI) {
      console.log();
      warn("Add the following to your " + bold(".env.local") + ":");
      console.log();
      if (!hasUrl) console.log(dim("    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co"));
      if (!hasKey) console.log(dim("    SUPABASE_SERVICE_ROLE_KEY=eyJ..."));
      if (!hasAI)  console.log(dim("    OPENAI_API_KEY=sk-..."));
      console.log();
      console.log("  Get your keys at: " + cyan("https://supabase.com/dashboard/project/_/settings/api"));
      console.log();
    }

    // 2. Add npm script to host project's package.json
    if (!opts.skipScript) {
      const pkgPath = path.join(cwd, "package.json");
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (!pkg.scripts?.policycraft) {
          pkg.scripts = pkg.scripts ?? {};
          pkg.scripts.policycraft = "policycraft start";
          fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
          ok(`Added ${bold("npm run policycraft")} script to package.json`);
        } else {
          info(`npm script ${bold("policycraft")} already exists — skipped`);
        }
      }
    }

    console.log();
    console.log(bold("  Ready! Launch with:"));
    console.log();
    console.log(cyan("    npx policycraft start"));
    console.log(dim("    # or"));
    console.log(cyan("    npm run policycraft"));
    console.log();
  });

/* ── start ── */
program
  .command("start")
  .description("Start the PolicyCraft UI (reads .env.local from current directory)")
  .option("-p, --port <port>", "Port to listen on", "3030")
  .option("--no-open", "Don't open the browser automatically")
  .action((opts) => {
    const cwd = process.cwd();
    const port = parseInt(opts.port, 10);
    console.log();
    console.log(bold("  PolicyCraft"));
    console.log();

    // Load host project's env vars
    const { vars, file } = loadProjectEnv(cwd);
    if (file) {
      info(`Loading credentials from ${bold(file)}`);
    } else {
      warn("No .env.local found — you can enter credentials in the UI");
    }

    // Merge host project vars into the environment, but don't override
    // vars already set in the process environment (e.g. CI)
    const env = {
      ...process.env,
      // Map common Supabase env var names
      NEXT_PUBLIC_SUPABASE_URL:  vars.NEXT_PUBLIC_SUPABASE_URL || vars.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      SUPABASE_SERVICE_ROLE_KEY: vars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      OPENAI_API_KEY:            vars.OPENAI_API_KEY || process.env.OPENAI_API_KEY || "",
      PORT: String(port),
      HOSTNAME: "0.0.0.0",
    };

    // Locate the standalone server built by `next build`
    const serverPath = path.join(PKG_ROOT, ".next", "standalone", "server.js");
    if (!fs.existsSync(serverPath)) {
      err("Standalone server not found. The package may not have been built correctly.");
      err(`Expected: ${serverPath}`);
      process.exit(1);
    }

    info(`Starting server on ${cyan(`http://localhost:${port}`)}`);
    console.log();

    const child = spawn(process.execPath, [serverPath], {
      env,
      stdio: "inherit",
      cwd: path.join(PKG_ROOT, ".next", "standalone"),
    });

    child.on("error", (e) => { err(e.message); process.exit(1); });
    child.on("exit",  (c) => process.exit(c ?? 0));

    // Open browser after a short delay
    if (opts.open !== false) {
      setTimeout(() => {
        const url = `http://localhost:${port}`;
        const openCmd =
          process.platform === "win32"  ? `start "" "${url}"` :
          process.platform === "darwin" ? `open "${url}"` :
                                          `xdg-open "${url}"`;
        try { execSync(openCmd, { stdio: "ignore" }); } catch {}
      }, 2000);
    }

    process.on("SIGINT",  () => { child.kill("SIGINT");  });
    process.on("SIGTERM", () => { child.kill("SIGTERM"); });
  });

program.parse(process.argv);
