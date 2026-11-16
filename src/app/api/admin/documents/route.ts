import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = [
  "dasapallivenkatshyamprasad@gmail.com",
  "shyamvsp@mylife.local",
];

async function getCallerUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function isUserAdmin(user: { email?: string; user_metadata?: Record<string, unknown> } | null) {
  if (!user) return false;
  return (
    ADMIN_EMAILS.includes(user.email || "") ||
    user.user_metadata?.role === "owner" ||
    user.user_metadata?.role === "admin" ||
    user.user_metadata?.role === "moderator"
  );
}

// GET: Returns list of documents
// - If Admin/Owner/Moderator: returns all documents (admin_only + everyone)
// - If Customer/Regular user: returns only documents with scope == 'everyone'
export async function GET() {
  try {
    const user = await getCallerUser();
    const isPrivileged = isUserAdmin(user);
    const supabaseAdmin = createAdminClient();

    let query = supabaseAdmin
      .from("entries")
      .select("id,title,details,entry_date,data,created_at,user_id")
      .eq("module", "_admin_documents")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    // Non-privileged users can ONLY see documents broadcasted to 'everyone'
    if (!isPrivileged) {
      query = query.filter("data->>scope", "eq", "everyone");
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const documents = (data || []).map((item) => {
      const d = (item.data as Record<string, unknown>) || {};
      return {
        id: item.id,
        title: item.title,
        description: item.details,
        date: item.entry_date,
        createdAt: item.created_at,
        fileName: d.file_name || item.title,
        fileSize: Number(d.file_size) || 0,
        fileType: d.file_type || "application/octet-stream",
        downloadUrl: d.download_url || "",
        storagePath: d.storage_path || "",
        scope: d.scope === "admin_only" ? "admin_only" : "everyone",
        category: d.category || "General",
        uploadedBy: d.uploaded_by || "Admin",
        downloadCount: Number(d.download_count) || 0,
      };
    });

    return NextResponse.json({ documents, isPrivileged });
  } catch (err) {
    console.error("Error listing documents:", err);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}

// POST: Upload a new document (Admin / Owner only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCallerUser();
    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "General";
    const scope = (formData.get("scope") as string) === "admin_only" ? "admin_only" : "everyone";

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload." }, { status: 400 });
    }

    // 50 MB limit
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 50 MB limit." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${scope}/${Date.now()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage 'admin-documents'
    const { error: uploadError } = await supabaseAdmin.storage
      .from("admin-documents")
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lweonmkbcdquseexcjij.supabase.co";
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/admin-documents/${filePath}`;

    const documentRecord = {
      user_id: user?.id,
      module: "_admin_documents",
      title: title || file.name,
      details: description || null,
      entry_date: new Date().toISOString().slice(0, 10),
      data: {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || "application/octet-stream",
        storage_path: filePath,
        download_url: publicUrl,
        scope, // "admin_only" or "everyone"
        category,
        uploaded_by: user?.user_metadata?.display_name || user?.email || "Admin",
        download_count: 0,
      },
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("entries")
      .insert(documentRecord)
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json({ error: `Database insert failed: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: inserted.id,
        title: inserted.title,
        description: inserted.details,
        downloadUrl: publicUrl,
        scope,
        fileName: file.name,
        fileSize: file.size,
      },
    });
  } catch (err) {
    console.error("Error uploading admin document:", err);
    return NextResponse.json({ error: "Failed to process document upload" }, { status: 500 });
  }
}

// DELETE: Delete a document (Admin / Owner only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCallerUser();
    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Fetch storage path first
    const { data: doc } = await supabaseAdmin
      .from("entries")
      .select("data")
      .eq("id", id)
      .eq("module", "_admin_documents")
      .single();

    if (doc?.data && typeof doc.data === "object") {
      const storagePath = (doc.data as Record<string, unknown>).storage_path as string;
      if (storagePath) {
        await supabaseAdmin.storage.from("admin-documents").remove([storagePath]);
      }
    }

    // Delete record
    const { error: deleteError } = await supabaseAdmin.from("entries").delete().eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting document:", err);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
