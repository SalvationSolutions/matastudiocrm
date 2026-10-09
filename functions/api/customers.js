// Never expose customer records before an authenticated, role-checked session is implemented.
export function onRequest() {
  return new Response(JSON.stringify({ok:false,error:"Authentication is not configured. Customer access disabled."}),{status:403,headers:{"content-type":"application/json","cache-control":"no-store"}});
}
