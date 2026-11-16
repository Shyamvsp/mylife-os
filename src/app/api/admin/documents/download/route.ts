import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/documents/download?id=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: entry, error } = await supabaseAdmin
      .from("entries")
      .select("id,title,data")
      .eq("id", id)
      .eq("module", "_admin_documents")
      .single();

    if (error || !entry) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const d = (entry.data as Record<string, unknown>) || {};
    const downloadUrl = (d.download_url as string) || "";
    const fileName = (d.file_name as string) || entry.title || "document";
    const fileType = (d.file_type as string) || "application/octet-stream";

    // Increment download count in background
    const currentCount = Number(d.download_count) || 0;
    void supabaseAdmin
      .from("entries")
      .update({
        data: {
          ...d,
          download_count: currentCount + 1,
        },
      })
      .eq("id", id);

    // If downloadUrl is present, redirect directly or fetch and stream
    if (downloadUrl) {
      // Fetch the file from Supabase public storage and stream with attachment header
      const fileRes = await fetch(downloadUrl);
      if (fileRes.ok) {
        const fileBuffer = await fileRes.arrayBuffer();
        return new Response(fileBuffer, {
          headers: {
            "Content-Type": fileType,
            "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      // Fallback redirect if fetch failed
      return NextResponse.redirect(downloadUrl);
    }

    return NextResponse.json({ error: "Download link unavailable." }, { status: 404 });
  } catch (err) {
    console.error("Error serving document download:", err);
    return NextResponse.json({ error: "Could not download document." }, { status: 500 });
  }
}
