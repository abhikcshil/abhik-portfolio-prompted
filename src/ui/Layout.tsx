import { NavLink } from "react-router-dom";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/">
          Abhik
        </a>
        <nav>
          <NavLink to="/admin">Overview</NavLink>
          <NavLink to="/admin/domains">Domains</NavLink>
          <NavLink to="/admin/projects">Projects</NavLink>
        </nav>
        <p>Part of ACS Studios</p>
      </aside>
      <section className="admin-content">{children}</section>
    </main>
  );
}
