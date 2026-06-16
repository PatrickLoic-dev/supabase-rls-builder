import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an expert in Supabase Row Level Security (RLS) policies.
Your task is to convert natural language security rules into valid PostgreSQL RLS policy SQL for Supabase.

Rules:
- Always generate complete, valid SQL statements
- Use auth.uid() for the current user's ID
- Use auth.jwt() for JWT claims
- Use auth.role() for the user's role
- Generate separate policies for SELECT, INSERT, UPDATE, DELETE when needed
- Format SQL cleanly and readably
- Add a brief comment explaining each policy

Output format — return a JSON object with a "policies" key containing an array:
{
  "policies": [
    {
      "name": "policy_name",
      "operation": "SELECT | INSERT | UPDATE | DELETE | ALL",
      "definition": "USING (...) expression",
      "check": "WITH CHECK (...) expression or null",
      "sql": "full CREATE POLICY statement",
      "explanation": "brief explanation"
    }
  ]
}

Only output the JSON object described above, no markdown, no extra text.`;

export interface GeneratedPolicy {
  name: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  definition: string;
  check: string | null;
  sql: string;
  explanation: string;
}

export async function generatePolicies(
  description: string,
  tableName: string,
  apiKey: string
): Promise<GeneratedPolicy[]> {
  const client = new OpenAI({ apiKey });

  const userPrompt = `Table: "${tableName}"
Security rule: "${description}"

Generate the appropriate RLS policies for this table and rule.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content ?? "[]";

  try {
    const parsed = JSON.parse(content);
    let policies: GeneratedPolicy[];
    if (Array.isArray(parsed)) {
      policies = parsed;
    } else if (Array.isArray(parsed.policies)) {
      policies = parsed.policies;
    } else {
      // GPT used a different wrapper key — find the first array value
      const arrayVal = Object.values(parsed).find(Array.isArray) as GeneratedPolicy[] | undefined;
      policies = arrayVal ?? [];
    }
    return policies.map((p) => ({
      ...p,
      sql: p.sql.replace(/\{TABLE_NAME\}/g, tableName),
    }));
  } catch {
    throw new Error("Failed to parse OpenAI response as JSON");
  }
}
