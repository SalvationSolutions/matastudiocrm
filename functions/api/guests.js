// Guest PII must not be accessible without authenticated staff permissions.
export function onRequest() {
  return new Response(JSON.stringify({ok:false,error:"Guest access requires staff authentication."}),{status:403,headers:{"content-type":"application/json","cache-control":"no-store"}});
}
