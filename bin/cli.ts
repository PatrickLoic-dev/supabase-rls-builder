#!/usr/bin/env node
import { Command } from "commander";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import path from "path";
import chalk from "chalk";

const program = new Command();

program
  .name("supabase-rls-builder")
  .description("Generate Supabase RLS policies from natural language")
  .version("0.1.0");

program
  .command("start", { isDefault: true })
  .description("Start the RLS Builder web interface")
  .option("-p, --port <port>", "Port to listen on", "3210")
  .option("--url <url>", "Supabase project URL")
  .option("--key <key>", "Supabase service role key")
  .option("--openai-key <key>", "OpenAI API key")
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    const dir = path.resolve(__dirname, "..");
    const app = next({ dev: false, dir });
    const handle = app.getRequestHandler();

    // Pass credentials via env if provided via CLI flags
    if (options.url) process.env.NEXT_PUBLIC_SUPABASE_URL = options.url;
    if (options.key) process.env.SUPABASE_SERVICE_ROLE_KEY = options.key;
    if (options.openaiKey) process.env.OPENAI_API_KEY = options.openaiKey;

    console.log(chalk.bold.green("\n🔐 Supabase RLS Builder\n"));
    console.log(chalk.gray("Preparing server..."));

    await app.prepare();

    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    server.listen(port, () => {
      console.log(chalk.green(`✓ Ready on`) + chalk.bold(` http://localhost:${port}`));
      console.log(chalk.gray("\nOpen the URL above to start building RLS policies.\n"));
    });
  });

program.parse();
