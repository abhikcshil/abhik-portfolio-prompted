import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./ui/AdminDashboard";
import { AdminDomains } from "./ui/AdminDomains";
import { AdminProjects } from "./ui/AdminProjects";
import { Home } from "./ui/Home";
import { ProjectDetail } from "./ui/ProjectDetail";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:slug" element={<ProjectDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/domains" element={<AdminDomains />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/projects/new" element={<AdminProjects mode="new" />} />
        <Route path="/admin/projects/:slug" element={<AdminProjects mode="edit" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
