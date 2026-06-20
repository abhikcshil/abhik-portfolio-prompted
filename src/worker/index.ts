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
  portfolio_db: D1Database;
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
    if (pathname === "/api/portfolio") return json(await getPortfolio(env.portfolio_db));
    if (pathname === "/api/domains") {
      const portfolio = await getPortfolio(env.portfolio_db);
      return json(portfolio.domains);
    }
    if (pathname === "/api/projects") {
      const portfolio = await getPortfolio(env.portfolio_db);
      return json(portfolio.projects);
    }
    if (pathname.startsWith("/api/projects/")) {
      const slug = decodeURIComponent(pathname.replace("/api/projects/", ""));
      const project = await getProjectBySlug(env.portfolio_db, slug);
      return project ? json(project) : notFound();
    }
  } catch {
    if (pathname === "/api/portfolio") return json(fallbackPublicPortfolio());
    if (pathname.startsWith("/api/projects/")) {
      const slug = decodeURIComponent(pathname.replace("/api/projects/", ""));
      const project = fallbackPublicPortfolio().projects.find((item) => item.slug === slug);
      return project ? json(project) : notFound();
    }
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
      return json(await getPortfolio(env.portfolio_db, { includePrivate: true }));
    }
    if (request.method === "POST" && pathname === "/api/admin/domains") {
      return json(await upsertDomain(env.portfolio_db, parseDomainInput(await readJson(request))));
    }
    if (request.method === "PUT" && pathname.startsWith("/api/admin/domains/")) {
      const id = decodeURIComponent(pathname.replace("/api/admin/domains/", ""));
      const input = parseDomainInput(await readJson(request));
      return json(await upsertDomain(env.portfolio_db, { ...input, id }));
    }
    if (request.method === "POST" && pathname === "/api/admin/projects") {
      return json(await upsertProject(env.portfolio_db, parseProjectInput(await readJson(request))));
    }
    if (request.method === "PUT" && pathname.startsWith("/api/admin/projects/")) {
      const id = decodeURIComponent(pathname.replace("/api/admin/projects/", ""));
      const input = parseProjectInput(await readJson(request));
      return json(await upsertProject(env.portfolio_db, { ...input, id }));
    }
    if (request.method === "DELETE" && pathname.startsWith("/api/admin/projects/")) {
      const id = decodeURIComponent(pathname.replace("/api/admin/projects/", ""));
      return json(await softDisableProject(env.portfolio_db, id));
    }
    if (request.method === "PUT" && pathname === "/api/admin/placements") {
      return json(await putPlacement(env.portfolio_db, parsePlacementInput(await readJson(request))));
    }
    if (request.method === "POST" && pathname === "/api/admin/seed") {
      return json(await seedDatabase(env.portfolio_db));
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
