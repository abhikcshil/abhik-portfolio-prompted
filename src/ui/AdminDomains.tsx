import { useEffect, useState } from "react";
import type { PortfolioDomain, PortfolioPayload } from "../data/portfolio";
import { loadAdminPortfolio, saveDomain } from "./api";
import { AdminShell } from "./Layout";

const emptyDomain: Partial<PortfolioDomain> = {
  slug: "",
  name: "",
  label: "",
  description: "",
  colorKey: "software",
  colorPrimary: "#38bdf8",
  colorSecondary: "#2563eb",
  orbitOrder: 1,
  enabled: true,
  visibility: "public",
};

export function AdminDomains() {
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [selected, setSelected] = useState<Partial<PortfolioDomain>>(emptyDomain);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAdminPortfolio().then(setPortfolio).catch(() => setMessage("Unable to load admin data."));
  }, []);

  return (
    <AdminShell>
      <header className="admin-header">
        <div>
          <p>Admin</p>
          <h1>Domains</h1>
        </div>
        <button type="button" onClick={() => setSelected(emptyDomain)}>
          New
        </button>
      </header>
      {message && <div className="admin-alert">{message}</div>}
      <div className="editor-layout">
        <div className="admin-list">
          {portfolio?.domains.map((domain) => (
            <button key={domain.id} type="button" onClick={() => setSelected(domain)}>
              <span style={{ background: domain.colorPrimary }} />
              {domain.name}
            </button>
          ))}
        </div>
        <form
          className="admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            saveDomain(selected, selected.id)
              .then((data) => {
                setPortfolio(data);
                setMessage("Domain saved.");
              })
              .catch(() => setMessage("Domain save failed."));
          }}
        >
          <label>
            Name
            <input value={selected.name ?? ""} onChange={(event) => setSelected({ ...selected, name: event.target.value })} />
          </label>
          <label>
            Slug
            <input value={selected.slug ?? ""} onChange={(event) => setSelected({ ...selected, slug: event.target.value })} />
          </label>
          <label>
            Description
            <textarea value={selected.description ?? ""} onChange={(event) => setSelected({ ...selected, description: event.target.value })} />
          </label>
          <div className="form-row">
            <label>
              Primary
              <input type="color" value={selected.colorPrimary ?? "#38bdf8"} onChange={(event) => setSelected({ ...selected, colorPrimary: event.target.value })} />
            </label>
            <label>
              Secondary
              <input type="color" value={selected.colorSecondary ?? "#2563eb"} onChange={(event) => setSelected({ ...selected, colorSecondary: event.target.value })} />
            </label>
            <label>
              Orbit
              <input type="number" value={selected.orbitOrder ?? 1} onChange={(event) => setSelected({ ...selected, orbitOrder: Number(event.target.value) })} />
            </label>
          </div>
          <label className="toggle-label">
            <input type="checkbox" checked={selected.enabled ?? true} onChange={(event) => setSelected({ ...selected, enabled: event.target.checked })} />
            Enabled
          </label>
          <button type="submit">Save Domain</button>
        </form>
      </div>
    </AdminShell>
  );
}
