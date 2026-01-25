import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { apiFetch } from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type LogoutOptions = {
  redirect?: boolean
  redirectTo?: string
}

export async function logout(options: LogoutOptions = {}) {
  const { redirect = true, redirectTo = "/login" } = options

  // Always clear client state, even if the server call fails.
  try {
    await apiFetch("/sentinel/logout", { method: "GET" })
  } catch {
    // ignore
  } finally {
    try {
      useAuthStore.getState().clear()
    } catch {
      // ignore
    }

    try {
      localStorage.removeItem("mbthcrm_auth")
    } catch {
      // ignore
    }

    if (redirect && typeof window !== "undefined") {
      window.location.assign(redirectTo)
    }
  }
}