import { SYS_VAR } from "@/constants/const";
import { useAuthStore } from "@/stores/authStore";

type ApiJsonResult<T> = {
  response: Response;
  data: T;
};

const joinUrl = (baseUrl: string, path: string) => {
  const base = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

const handleUnauthorized = () => {
  try {
    useAuthStore.getState().clear();
  } finally {
    // Ensure persisted auth is wiped too.
    try {
      localStorage.removeItem("mbthcrm_auth");
    } catch {
      // ignore
    }

    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
};

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = joinUrl(SYS_VAR.BACKEND_URL, path);

  const response = await fetch(url, {
    ...init,
    credentials: init.credentials ?? "include",
    headers: {
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 401) {
    handleUnauthorized();
  }

  return response;
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiJsonResult<T>> {
  const response = await apiFetch(path, init);

  // Some endpoints might return empty body; guard json() accordingly.
  const text = await response.text();
  let data: T;
  try {
    data = (text ? JSON.parse(text) : null) as T;
  } catch {
    data = null as T;
  }

  return { response, data };
}

export const jsonHeaders = {
  "Content-Type": "application/json",
} as const;
