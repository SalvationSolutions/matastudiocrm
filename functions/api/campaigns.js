// Google OAuth and opt-in enforcement must be configured before sending is enabled.
export function onRequest() {
  return new Response(JSON.stringify({ok:false,error:"Email campaigns require authentication and a configured Google sender."}),{status:403,headers:{"content-type":"application/json","cache-control":"no-store"}});
}
