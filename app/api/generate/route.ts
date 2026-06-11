import { NextRequest, NextResponse } from "next/server";
import { generatePolicies } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { description, tableName, openaiKey } = await req.json();

    if (!description || !tableName || !openaiKey) {
      return NextResponse.json(
        { error: "description, tableName and openaiKey are required" },
        { status: 400 }
      );
    }

    const policies = await generatePolicies(description, tableName, openaiKey);
    return NextResponse.json({ policies });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
