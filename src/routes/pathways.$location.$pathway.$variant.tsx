import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getPathwayEntry,
} from "@/lib/pathway-registry";
import { AnaemiaPathwayPage } from "./pathway.anaemia";
import LFTPathwayPage from "./pathway.lft";

export const Route = createFileRoute("/pathways/$location/$pathway/$variant")({
  component: PathwayVariantRoute,
});

function PathwayVariantRoute() {
  const { location, pathway, variant } = Route.useParams();
  const entry = getPathwayEntry(location, pathway, variant);

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Pathway not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          We could not find that location/pathway/variant combination.
        </p>
        <Link to="/pathways" className="inline-flex mt-6 text-primary font-medium">
          Back to locations
        </Link>
      </div>
    );
  }

  if (entry.renderer === "anaemia") {
    return <AnaemiaPathwayPage />;
  }

  if (entry.renderer === "lft") {
    return <LFTPathwayPage />;
  }

  return null;
}
