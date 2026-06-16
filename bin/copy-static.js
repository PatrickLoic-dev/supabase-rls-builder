#!/usr/bin/env node
// After `next build`, copy public/ and .next/static/ into .next/standalone/
// so the standalone server can serve them at runtime.
"use strict";

const fs   = require("fs");
const path = require("path");

const root       = path.resolve(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

copyDir(path.join(root, "public"),       path.join(standalone, "public"));
copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));

console.log("✓ Static assets copied into .next/standalone");
