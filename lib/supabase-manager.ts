import { createClient } from "@supabase/supabase-js";

export interface RLSPolicy {
  id: string;
  name: string;
  table: string;
  schema: string;
  command: string;
  definition: string;
  check: string | null;
  roles: string[];
}

export interface ApplyResult {
  success: boolean;
  policy: string;
  error?: string;
}

export class SupabaseManager {
  private url: string;
  private key: string;

  constructor(projectUrl: string, serviceKey: string) {
    if (!projectUrl.startsWith("https://") || !projectUrl.includes(".supabase.co")) {
      throw new Error("Invalid Supabase project URL");
    }
    this.url = projectUrl.replace(/\/$/, "");
    this.key = serviceKey;
  }

  private get headers() {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
    };
  }

  /** Execute raw SQL via the Supabase REST endpoint that accepts a query body. */
  private async sql<T = Record<string, unknown>[]>(query: string): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      // Fallback: try the pg endpoint (Supabase hosted)
      const res2 = await fetch(`${this.url}/pg`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ query }),
      });
      if (!res2.ok) {
        const text = await res2.text();
        throw new Error(`SQL error: ${text}`);
      }
      return res2.json() as Promise<T>;
    }

    return res.json() as Promise<T>;
  }

  /** List public tables via the PostgREST OpenAPI spec — works with service role key only. */
  async getTables(): Promise<string[]> {
    const res = await fetch(`${this.url}/rest/v1/`, {
      headers: { apikey: this.key, Authorization: `Bearer ${this.key}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch schema: ${res.status}`);

    const spec = await res.json() as { paths?: Record<string, unknown> };
    const paths = Object.keys(spec.paths ?? {});

    return paths
      .filter((p) => p.startsWith("/") && !p.startsWith("/rpc/"))
      .map((p) => p.replace(/^\//, "").split("?")[0])
      .filter(Boolean)
      .sort();
  }

  /** Fetch existing RLS policies by querying pg_policies via supabase-js client. */
  async getPolicies(table?: string): Promise<RLSPolicy[]> {
    const client = createClient(this.url, this.key, {
      auth: { persistSession: false },
      db: { schema: "information_schema" },
    });

    // Use a direct REST query against the pg_policies system view exposed via PostgREST
    let endpoint = `${this.url}/rest/v1/pg_policies?select=*&schemaname=eq.public`;
    if (table) endpoint += `&tablename=eq.${encodeURIComponent(table)}`;

    const res = await fetch(endpoint, {
      headers: { ...this.headers, Accept: "application/json" },
    });

    if (!res.ok) {
      // pg_policies may not be in the PostgREST schema — return empty gracefully
      return [];
    }

    const rows = await res.json() as {
      policyname: string;
      tablename: string;
      schemaname: string;
      cmd: string;
      qual: string | null;
      with_check: string | null;
      roles: string[];
    }[];

    if (!Array.isArray(rows)) return [];

    return rows.map((r, i) => ({
      id: `${r.tablename}-${r.policyname}-${i}`,
      name: r.policyname,
      table: r.tablename,
      schema: r.schemaname,
      command: r.cmd?.toUpperCase() ?? "ALL",
      definition: r.qual ?? "",
      check: r.with_check ?? null,
      roles: Array.isArray(r.roles) ? r.roles : [],
    }));
  }

  /** Apply one SQL statement, returning success/error per statement. */
  async applyPolicies(sqls: string[]): Promise<ApplyResult[]> {
    const results: ApplyResult[] = [];

    for (const sql of sqls) {
      const name = sql.match(/CREATE\s+POLICY\s+"?([^"\s(]+)"?/i)?.[1] ?? sql.slice(0, 40);

      try {
        // Try via the supabase-js client using a direct REST call to execute SQL
        // Supabase exposes a /query endpoint for service-role requests on some plans
        const res = await fetch(`${this.url}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({ query: sql }),
        });

        if (!res.ok) {
          const body = await res.text();
          // If exec_sql doesn't exist, tell the user clearly
          if (res.status === 404) {
            results.push({
              success: false,
              policy: name,
              error: "exec_sql function not found. Copy the SQL and run it in the Supabase SQL editor.",
            });
          } else {
            results.push({ success: false, policy: name, error: body });
          }
        } else {
          results.push({ success: true, policy: name });
        }
      } catch (err) {
        results.push({
          success: false,
          policy: name,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return results;
  }

  async enableRLS(table: string): Promise<void> {
    await this.applyPolicies([
      `ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`,
    ]);
  }
}
