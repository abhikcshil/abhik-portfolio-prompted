import type { PortfolioDomain, PortfolioProject } from "../data/portfolio";

export function domainAngle(domain: PortfolioDomain) {
  return (domain.orbitOrder * 72 + domain.slug.length * 19) % 360;
}

export function projectAngle(project: PortfolioProject, domainSlug: string) {
  const source = `${project.slug}:${domainSlug}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 360;
  }
  return hash;
}

export function projectOrder(project: PortfolioProject, domainSlug: string) {
  return project.placements.find((placement) => placement.domainSlug === domainSlug)?.placementOrder ?? 1;
}
