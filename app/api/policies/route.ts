import { NextRequest, NextResponse } from "next/server";
import { SupabaseManager } from "@/lib/supabase-manager";

function getManager(req: NextRequest) {
  const url = req.headers.get("x-supabase-url");
  const key = req.headers.get("x-supabase-key");
  if (!url || !key) throw new Error("Missing x-supabase-url or x-supabase-key headers");
  return new SupabaseManager(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const manager = getManager(req);
    const table = req.nextUrl.searchParams.get("table") ?? undefined;
    const [policies, tables] = await Promise.all([
      manager.getPolicies(table),
      manager.getTables(),
    ]);
    return NextResponse.json({ policies, tables });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const manager = getManager(req);
    const { sqls, enableRLS, table } = await req.json();

    if (!sqls || !Array.isArray(sqls)) {
      return NextResponse.json({ error: "sqls array is required" }, { status: 400 });
    }

    if (enableRLS && table) {
      await manager.enableRLS(table);
    }

    const results = await manager.applyPolicies(sqls);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
