export function onRequestGet({env}) {
  const configured=Boolean(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET&&env.GOOGLE_OAUTH_REDIRECT_URI);
  return Response.json({provider:"gmail",configured,connected:false,sending_enabled:false},{headers:{"cache-control":"no-store"}});
}
