import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getLocationFamilies,
  getLocationName,
} from "@/lib/pathway-registry";

export const Route = createFileRoute("/pathways/$location")({
  component: LocationPathwaysPage,
});

function LocationPathwaysPage() {
  const { location } = Route.useParams();
  const locationName = getLocationName(location);
  const families = getLocationFamilies(location);

  if (!locationName) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Location not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          This location does not have any registered pathways yet.
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
          {locationName}
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Choose a pathway family
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Every pathway is organised by location first, then pathway family, then
          population variant such as adult or child.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 mt-10">
        {families.map((family) => (
          <a
            key={family.slug}
            href={`/pathways/${location}/${family.slug}`}
            className="rounded-[18px] bg-card p-6 ring-1 ring-border shadow-card hover:-translate-y-0.5 hover:ring-primary/30 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {family.specialty}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {family.name}
                </h2>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {family.liveCount}/{family.variantCount} live
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {family.description}
            </p>
            <p className="mt-5 text-sm font-medium text-foreground">
              View variants →
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
