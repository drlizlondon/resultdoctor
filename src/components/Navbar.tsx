import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ModeToggle } from "./ModeToggle";
import {
  getLocationName,
  getPathwayEntry,
  getPathwayFamily,
} from "@/lib/pathway-registry";

function getCrumb(path: string) {
  if (path === "/") return "Home";
  if (path === "/pathways") return "Locations";
  if (path === "/about") return "About";
  if (path === "/pathway/anaemia") return "Anaemia";
  if (path === "/pathway/lft") return "Abnormal LFTs";

  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "pathways") return undefined;

  if (parts.length === 2) {
    return getLocationName(parts[1]) ?? "Location";
  }

  if (parts.length === 3) {
    const location = getLocationName(parts[1]);
    const family = getPathwayFamily(parts[1], parts[2]);
    if (!location || !family) return "Pathway";
    return `${location} · ${family.name}`;
  }

  if (parts.length === 4) {
    const entry = getPathwayEntry(parts[1], parts[2], parts[3]);
    if (!entry) return "Pathway";
    return `${entry.locationName} · ${entry.pathwayName} · ${entry.variantName}`;
  }

  return undefined;
}

export function Navbar() {
  const { location } = useRouterState();
  const path = location.pathname;
  const crumb = getCrumb(path);

  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Logo />
        {crumb && path !== "/" && (
          <div className="hidden md:block text-sm text-muted-foreground font-medium tracking-tight">
            {crumb}
          </div>
        )}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/about"
            className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
