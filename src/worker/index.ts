import {
  fallbackPublicPortfolio,
  getPortfolio,
  getProjectBySlug,
  putPlacement,
  seedDatabase,
  softDisableProject,
  upsertDomain,
  upsertProject,
} from "./db/queries";
import { parseDomainInput, parsePlacementInput, parseProjectInput } from "./validation";

type Env = {
  PORTFOLIO_DB: D1Database;
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...jsonHeaders, ...init?.headers },
  });
}

function notFound() {
  return json({ error: "Not found." }, { status: 404 });
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function hasAccess(request: Request, env: Env) {
  if (env.ENVIRONMENT === "local") return true;
  return (
    request.headers.has("cf-access-authenticated-user-email") ||
    request.headers.has("cf-access-jwt-assertion")
  );
}

async function handlePublicApi(request: Request, env: Env, pathname: string) {
  try {
    if (pathname === "/api/portfolio") return json(await getPortfolio(env.PORTFOLIO_DB));
    if (pathname === "/api/domains") {
      const portfolio = await getPortfolio(env.PORTFOLIO_DB);
      return json(portfolio.domains);
    }
    if (pathname === "/api/projects") {
      const portfolio = await getPortfolio(env.PORTFOLIO_DB);
      return json(portfolio.projects);
    }
    if (pathname.startsWith("/api/projects/")) {
      const slug = decodeURIComponent(pathname.replace("/api/projects/", ""));
      const project = await getProjectBySlug(env.PORTFOLIO_DB, slug);
      return project ? json(project) : notFound();
    }
  } catch {
    if (pathname === "/api/portfolio") return json(fallbackPublicPortfolio());
    return json({ error: "Portfolio data is temporarily unavailable." }, { status: 503 });
  }

  return null;
}

async function handleAdminApi(request: Request, env: Env, pathname: string) {
  if (!hasAccess(request, env)) {
    return json({ error: "Cloudflare Access authentication required." }, { status: 401 });
  }

  try {
    if (request.method === "GET" && pathname === "/api/admin/portfolio") {
      return json(await getPortfolio(env.PORTFOLIO_DB, { includePrivate: true }));
    }
    if (request.method === "POST" && pathname === "/api/admin/domains") {
      return json(await upsertDomain(env.PORTFOLIO_DB, parseDomainInput(await readJson(request))));
    }
    if (request.method === "PUT" && pathname.startsWith("/api/admin/domains/")) {
      const id = decodeURIComponent(pathname.replace("/api/admin/domains/", ""));
      const input = parseDomainInput(await readJson(request));
      return json(await upsertDomain(env.PORTFOLIO_DB, { ...input, id }));
    }
    if (request.method === "POST" && pathname === "/api/admin/projects") {
      return json(await upsertProject(env.PORTFOLIO_DB, parseProjectInput(await readJson(request))));
    }
    if (request.method === "PUT" && pathname.startsWith("/api/admin/projects/")) {
      const id = decodeURIComponent(pathname.replace("/api/admin/projects/", ""));
      const input = parseProjectInput(await readJson(request));
      return json(await upsertProject(env.PORTFOLIO_DB, { ...input, id }));
    }
    if (request.method === "DELETE" && pathname.startsWith("/api/admin/projects/")) {
      const id = decodeURIComponent(pathname.replace("/api/admin/projects/", ""));
      return json(await softDisableProject(env.PORTFOLIO_DB, id));
    }
    if (request.method === "PUT" && pathname === "/api/admin/placements") {
      return json(await putPlacement(env.PORTFOLIO_DB, parsePlacementInput(await readJson(request))));
    }
    if (request.method === "POST" && pathname === "/api/admin/seed") {
      return json(await seedDatabase(env.PORTFOLIO_DB));
    }
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Admin request failed." },
      { status: 400 },
    );
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const publicResponse = await handlePublicApi(request, env, url.pathname);
    if (publicResponse) return publicResponse;

    if (url.pathname.startsWith("/api/admin")) {
      const adminResponse = await handleAdminApi(request, env, url.pathname);
      return adminResponse ?? notFound();
    }

    if (url.pathname.startsWith("/api/")) return notFound();

    return env.ASSETS.fetch(request);
  },
};
