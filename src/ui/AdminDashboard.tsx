import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PortfolioPayload } from "../data/portfolio";
import { loadAdminPortfolio, seedPortfolio } from "./api";
import { AdminShell } from "./Layout";

export function AdminDashboard() {
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAdminPortfolio().then(setData).catch(() => setError("Admin API unavailable. Check D1 migrations and Cloudflare Access."));
  }, []);

  return (
    <AdminShell>
      <header className="admin-header">
        <div>
          <p>Admin</p>
          <h1>Portfolio Control</h1>
        </div>
        <button
          type="button"
          onClick={() => seedPortfolio().then(setData).catch(() => setError("Seed failed."))}
        >
          Seed
        </button>
      </header>
      {error && <div className="admin-alert">{error}</div>}
      <div className="admin-grid">
        <Link to="/admin/domains" className="admin-stat">
          <span>{data?.domains.length ?? "-"}</span>
          Domains
        </Link>
        <Link to="/admin/projects" className="admin-stat">
          <span>{data?.projects.length ?? "-"}</span>
          Projects
        </Link>
      </div>
    </AdminShell>
  );
}
