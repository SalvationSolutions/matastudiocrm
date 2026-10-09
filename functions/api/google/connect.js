// Never initiate Google OAuth without verified staff authentication and a CSRF-protected session.
export function onRequestGet() {
  return Response.json({ok:false,error:"Staff login must be configured before connecting Gmail."},{status:403,headers:{"cache-control":"no-store"}});
}
