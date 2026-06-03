import { buildGoogleOAuthStartResponse, getSafeNextPath } from "@/lib/auth/google-oauth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  return await buildGoogleOAuthStartResponse(nextPath);
}
