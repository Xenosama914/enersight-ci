import { create } from "zustand";
import { persist } from "zustand/middleware";
import { org, ministryOrg, users } from "@/data/seed";
import type { Organization, Role, User } from "@/types";

/**
 * Auth mock pour la v1. `login` accepte n'importe quel email present dans la seed
 * (mot de passe ignore). `loginAs` permet de basculer de role pour tester les gardes.
 * A remplacer par Supabase Auth (SPEC.md section 6.1).
 */
interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  login: (email: string) => { ok: boolean; error?: string };
  loginAs: (role: Role) => void;
  register: (input: { fullName: string; email: string; orgName: string }) => { ok: boolean };
  logout: () => void;
}

function orgForUser(u: User): Organization {
  return u.org_id === ministryOrg.id ? ministryOrg : org;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      isAuthenticated: false,

      login: (email) => {
        const match = users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!match) {
          return { ok: false, error: "Aucun compte de demonstration pour cet email." };
        }
        set({ user: match, organization: orgForUser(match), isAuthenticated: true });
        return { ok: true };
      },

      loginAs: (role) => {
        const match = users.find((u) => u.role === role) ?? users[0];
        set({ user: match, organization: orgForUser(match), isAuthenticated: true });
      },

      register: ({ fullName, email, orgName }) => {
        const newUser: User = {
          id: `usr-${Date.now()}`,
          org_id: org.id,
          full_name: fullName,
          email,
          role: "admin",
          language: "fr",
        };
        set({
          user: newUser,
          organization: { ...org, name: orgName || org.name },
          isAuthenticated: true,
        });
        return { ok: true };
      },

      logout: () => set({ user: null, organization: null, isAuthenticated: false }),
    }),
    { name: "enersight-auth" },
  ),
);
