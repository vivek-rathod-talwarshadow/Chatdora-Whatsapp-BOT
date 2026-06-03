import "server-only";

import type { User } from "@supabase/supabase-js";

import { getAppSessionUserFromCookies } from "@/lib/auth/app-session";
import type { AppSessionUser } from "@/lib/auth/session-token";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = Pick<User, "created_at" | "email" | "id" | "user_metadata">;

function toCurrentUserFromAppSession(sessionUser: AppSessionUser): CurrentUser {
  return {
    created_at: sessionUser.createdAt,
    email: sessionUser.email,
    id: sessionUser.id,
    user_metadata: {
      full_name: sessionUser.fullName ?? null
    }
  };
}

export async function getCurrentUser() {
  const appSessionUser = await getAppSessionUserFromCookies();

  if (appSessionUser) {
    return appSessionUser.email
      ? toCurrentUserFromAppSession(appSessionUser)
      : null;
  }

  const authSupabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await authSupabase.auth.getUser();

  return user ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
