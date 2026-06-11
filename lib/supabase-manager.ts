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
  private projectRef: string;
  private serviceKey: string;
  private baseUrl: string;

  constructor(projectUrl: string, serviceKey: string) {
    // Extract project ref from URL: https://xxxx.supabase.co → xxxx
    const match = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) throw new Error("Invalid Supabase project URL");
    this.projectRef = match[1];
    this.serviceKey = serviceKey;
    this.baseUrl = `https://api.supabase.com/v1/projects/${this.projectRef}`;
  }

  private async request<T>(
    path: string,
    method = "GET",
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.serviceKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  async getTables(): Promise<string[]> {
    const result = await this.request<{ name: string; schema: string }[]>(
      "/database/tables"
    );
    return result
      .filter((t) => t.schema === "public")
      .map((t) => t.name)
      .sort();
  }

  async getPolicies(table?: string): Promise<RLSPolicy[]> {
    const result = await this.request<RLSPolicy[]>("/database/policies");
    if (table) return result.filter((p) => p.table === table);
    return result;
  }

  async executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request("/database/query", "POST", { query: sql });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async applyPolicies(sqls: string[]): Promise<ApplyResult[]> {
    const results: ApplyResult[] = [];
    for (const sql of sqls) {
      const policyName = sql.match(/CREATE POLICY\s+"?([^"\s]+)"?/i)?.[1] ?? sql;
      const result = await this.executeSQL(sql);
      results.push({ policy: policyName, ...result });
    }
    return results;
  }

  async enableRLS(table: string): Promise<void> {
    await this.executeSQL(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
  }
}
