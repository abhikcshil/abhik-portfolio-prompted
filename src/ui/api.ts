import { fallbackPortfolio, publicPortfolio, type PortfolioPayload, type PortfolioProject } from "../data/portfolio";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function loadPublicPortfolio() {
  try {
    return await request<PortfolioPayload>("/api/portfolio");
  } catch {
    return publicPortfolio(fallbackPortfolio);
  }
}

export async function loadAdminPortfolio() {
  return request<PortfolioPayload>("/api/admin/portfolio");
}

export async function loadPublicProject(slug: string) {
  try {
    return await request<PortfolioProject>(`/api/projects/${slug}`);
  } catch {
    return publicPortfolio(fallbackPortfolio).projects.find((project) => project.slug === slug) ?? null;
  }
}

export function saveDomain(body: unknown, id?: string) {
  return request<PortfolioPayload>(id ? `/api/admin/domains/${id}` : "/api/admin/domains", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(body),
  });
}

export function saveProject(body: unknown, id?: string) {
  return request<PortfolioPayload>(id ? `/api/admin/projects/${id}` : "/api/admin/projects", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(body),
  });
}

export function disableProject(id: string) {
  return request<PortfolioPayload>(`/api/admin/projects/${id}`, { method: "DELETE" });
}

export function seedPortfolio() {
  return request<PortfolioPayload>("/api/admin/seed", { method: "POST" });
}
