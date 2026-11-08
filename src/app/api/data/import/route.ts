import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isModuleKey } from "@/lib/modules";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawItems = Array.isArray(body) ? body : body.records || [];

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: "No records found in payload" }, { status: 400 });
    }

    const validPayloads = [];
    for (const item of rawItems) {
      const moduleKey = item.module?.toLowerCase();
      if (!isModuleKey(moduleKey)) continue;
      if (!item.title) continue;

      validPayloads.push({
        user_id: user.id,
        module: moduleKey,
        title: String(item.title).slice(0, 160),
        details: item.details ? String(item.details) : null,
        entry_date: item.entry_date || new Date().toISOString().slice(0, 10),
        data: typeof item.data === "object" && item.data !== null ? item.data : {},
        is_archived: Boolean(item.is_archived),
      });
    }

    if (validPayloads.length === 0) {
      return NextResponse.json({ error: "No valid module records recognized" }, { status: 400 });
    }

    const { data, error } = await supabase.from("entries").insert(validPayloads).select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported_count: data?.length || validPayloads.length,
      total_received: rawItems.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid JSON format";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
