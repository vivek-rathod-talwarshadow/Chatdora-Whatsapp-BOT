import "server-only";

import { notFound } from "next/navigation";

export const OWNER_SUPER_ADMIN_EMAIL = "vivekrathod12379@gmail.com";

export function isOwnerSuperAdminEmail(email: string | null | undefined) {
  return typeof email === "string" && email.trim().toLowerCase() === OWNER_SUPER_ADMIN_EMAIL;
}

export function requireOwnerSuperAdmin(email: string | null | undefined) {
  if (!isOwnerSuperAdminEmail(email)) {
    notFound();
  }
}
