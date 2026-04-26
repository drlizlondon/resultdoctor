import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getLocationName,
  getPathwayFamily,
  getPathwayVariants,
} from "@/lib/pathway-registry";

export const Route = createFileRoute("/pathways/$location/$pathway")({
  component: PathwayVariantsPage,
});

function PathwayVariantsPage() {
  const { location, pathway } = Route.useParams();
  const locationName = getLocationName(location);
  const family = getPathwayFamily(location, pathway);
  const variants = getPathwayVariants(location, pathway);

  if (!locationName || !family) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Pathway not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          We could not find that pathway family for this location.
        </p>
        <Link to="/pathways" className="inline-flex mt-6 text-primary font-medium">
          Back to locations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full ring-1 ring-primary/15 mb-5">
          {locationName} · {family.name}
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Choose a variant
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          This keeps the route model clean as we add adult and paediatric versions
          without duplicating the same pathway name inside one location.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 mt-10">
        {variants.map((entry) => (
          <a
            key={entry.href}
            href={entry.calculatorHref}
            className="rounded-[18px] bg-card p-6 ring-1 ring-border shadow-card hover:-translate-y-0.5 hover:ring-primary/30 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {entry.specialty}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {entry.variantName}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  entry.status === "live"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {entry.status === "live" ? "Live" : "Coming soon"}
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {entry.clinicianUse}
            </p>
            <div className="mt-5 text-xs text-muted-foreground">
              {entry.source.organisation} · {entry.source.version}
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              Open pathway →
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
