import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
export default async function SharedEntryPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;if(!/^[a-f0-9]{64}$/.test(token))notFound();const hash=createHash("sha256").update(token).digest("hex");const admin=createAdminClient();
 const {data:link}=await admin.from("share_links").select("entry_id,expires_at,revoked_at").eq("token_hash",hash).maybeSingle();if(!link||link.revoked_at||(link.expires_at&&new Date(link.expires_at)<new Date()))notFound();
 const {data:entry}=await admin.from("entries").select("title,details,module,entry_date,data").eq("id",link.entry_id).maybeSingle();if(!entry)notFound();
 return <main className="mx-auto min-h-screen max-w-2xl p-5 py-12"><div className="panel p-6 sm:p-9"><p className="muted text-xs font-semibold tracking-widest">MYLIFE OS · READ-ONLY SHARE</p><h1 className="mt-3 text-3xl font-bold">{entry.title}</h1><p className="muted mt-2 text-sm">{entry.module} · {entry.entry_date}</p>{entry.details&&<p className="mt-5 whitespace-pre-wrap">{entry.details}</p>}<div className="mt-6 space-y-3">{Object.entries(entry.data as Record<string,unknown>).filter(([,v])=>v!==null&&v!==undefined&&v!=="").map(([key,value])=><div key={key} className="rounded-xl p-3" style={{background:"var(--background)"}}><p className="muted text-xs">{key.replaceAll("_"," ")}</p><p className="mt-1 break-words">{String(value)}</p></div>)}</div><p className="muted mt-8 border-t pt-4 text-xs" style={{borderColor:"var(--line)"}}>This link provides read-only access to this one record. It may be viewed by anyone who has the link until it expires or is revoked.</p></div></main>
}
