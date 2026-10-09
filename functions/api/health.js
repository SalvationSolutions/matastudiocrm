export async function onRequestGet({env}) {
  const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
  if(!env.CRM_DB) return new Response(JSON.stringify({ok:false,service:"matastudiocrm",database:"unbound"}),{status:503,headers});
  try {
    await env.CRM_DB.prepare("SELECT 1 AS healthy").first();
    return new Response(JSON.stringify({ok:true,service:"matastudiocrm",database:"connected",pos_sync:"disabled"}),{headers});
  } catch {
    return new Response(JSON.stringify({ok:false,service:"matastudiocrm",database:"unavailable"}),{status:503,headers});
  }
}
