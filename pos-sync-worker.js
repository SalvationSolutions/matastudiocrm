// Standalone scheduled CRM sync Worker. Deploy separately with CRM_DB D1 binding,
// POS_EXPORT_SECRET (same secret as POS CRM_EXPORT_SECRET), POS_EXPORT_URL.
// No public import endpoint; never expose the signing secret to the browser.
import { importPosBatch } from "./lib/pos-import.js";
const tables=["Customers","Sales","SaleItems","VoidsRefunds"];
const enc=new TextEncoder();
const hex=b=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
async function signedRequest(url,secret){
 const timestamp=String(Date.now()),nonce=crypto.randomUUID(),u=new URL(url);
 const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const payload=["GET",u.pathname+"?"+u.searchParams.toString(),timestamp,nonce].join("\n");
 const signature=hex(await crypto.subtle.sign("HMAC",key,enc.encode(payload)));
 return fetch(u.toString(),{headers:{"x-crm-timestamp":timestamp,"x-crm-nonce":nonce,"x-crm-signature":signature},redirect:"error"});
}
async function sync(env){
 if(!env.CRM_DB||!env.POS_EXPORT_URL||!env.POS_EXPORT_SECRET||String(env.POS_EXPORT_SECRET).length<32)throw Error("Missing CRM sync configuration");
 const endpoint=new URL(env.POS_EXPORT_URL);
 if(endpoint.protocol!=="https:"||endpoint.pathname!=="/internal/crm-export")throw Error("Invalid POS export URL");
 for(const table of tables){
   // Full bounded scans capture updates to older invoices/refunds without relying on unreliable source timestamps.
   let offset=0;
   while(true){
     const url=new URL(endpoint);url.searchParams.set("table",table);url.searchParams.set("offset",String(offset));url.searchParams.set("limit","50");
     const response=await signedRequest(url,env.POS_EXPORT_SECRET);
     if(!response.ok)throw Error("POS export failed: "+response.status+" for "+table);
     const page=await response.json();
     if(!page.ok||page.table!==table||!Array.isArray(page.records)||page.records.length>50||page.offset!==offset)throw Error("Invalid POS response");
     await importPosBatch(env.CRM_DB,table,page.records);
     offset+=page.records.length;
     if(!page.hasMore)break;
     if(!page.records.length||offset>1000000)throw Error("Invalid pagination");
   }
   await env.CRM_DB.prepare("INSERT INTO crm_sync_state(source,cursor,last_success_at,last_error) VALUES(?,NULL,CURRENT_TIMESTAMP,NULL) ON CONFLICT(source) DO UPDATE SET last_success_at=CURRENT_TIMESTAMP,last_error=NULL").bind("rmata:"+table).run();
 }
}
export default {
 async scheduled(event,env,ctx){ctx.waitUntil(sync(env));},
 async fetch(){return new Response("Not found",{status:404,headers:{"cache-control":"no-store"}});}
};
