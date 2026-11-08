import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data,error}=await supabase.from("share_links").select("id,entry_id,expires_at,revoked_at,created_at,entries(title,module)").order("created_at",{ascending:false});
 if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({links:data??[]});
}
export async function DELETE(request:Request){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json().catch(()=>null);if(typeof body?.id!=="string")return NextResponse.json({error:"id is required"},{status:400});
 const {error}=await supabase.from("share_links").update({revoked_at:new Date().toISOString()}).eq("id",body.id).eq("user_id",user.id);
 if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({ok:true});
}
export async function POST(request:Request){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json().catch(()=>null);const entryId=body?.entryId;if(typeof entryId!=="string")return NextResponse.json({error:"entryId is required"},{status:400});
 const {data:entry,error:entryError}=await supabase.from("entries").select("id").eq("id",entryId).eq("user_id",user.id).single();if(entryError||!entry)return NextResponse.json({error:"Record not found"},{status:404});
 const token=randomBytes(32).toString("hex");const tokenHash=createHash("sha256").update(token).digest("hex");const expiresAt=new Date(Date.now()+7*24*60*60*1000).toISOString();
 const {error}=await supabase.from("share_links").insert({user_id:user.id,entry_id:entryId,token_hash:tokenHash,expires_at:expiresAt});if(error)return NextResponse.json({error:error.message},{status:500});
 const base=process.env.NEXT_PUBLIC_APP_URL||new URL(request.url).origin;return NextResponse.json({url:`${base}/share/${token}`,expiresAt});
}
