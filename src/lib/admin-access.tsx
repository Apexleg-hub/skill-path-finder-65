// Save as src/lib/admin-access.tsx
import { createContext, useContext } from "react";
// Adjust this import to match your existing Supabase client file.
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "owner" | "admin" | "staff" | "viewer";

export type AdminAccess = { userId: string; email: string; role: AdminRole };

const RANK: Record<AdminRole, number> = { owner: 4, admin: 3, staff: 2, viewer: 1 };

export const atLeast = (role: AdminRole, min: AdminRole) => RANK[role] >= RANK[min];

// The browser check below only decides what to SHOW. Real protection is Row Level Security and
// the role checks inside the database functions: a user with no row in admin_roles gets no data
// even if they edit this code in their browser.
export async function getAdminAccess(): Promise<AdminAccess | null> {
  // getUser() validates the session token with Supabase rather than trusting local storage.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data, error } = await supabase
    .from("admin_roles" as never)
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error || !data) return null;

  const role = (data as { role: AdminRole }).role;
  if (!(role in RANK)) return null;
  return { userId: userData.user.id, email: userData.user.email ?? "", role };
}

export const AdminContext = createContext<AdminAccess | null>(null);

export function useAdmin(): AdminAccess {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside the admin layout");
  return ctx;
}
