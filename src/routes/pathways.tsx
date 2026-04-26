import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMode } from "@/lib/mode";
import {
  categories,
  pathways,
  type PathwayCategory,
} from "@/lib/pathway-catalogue";

export const Route = createFileRoute("/pathways")({
  component: PathwaysPage,
});

function PathwaysPage() {
  const { mode } = useMode();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | PathwayCategory>("All");

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pathways.filter((entry) => {
      if (category !== "All" && entry.category !== category) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        entry.name,
        entry.plain,
        entry.description,
        entry.category,
        entry.slug,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [category, query]);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
      <div className="max-w-4xl">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full ring-1 ring-primary/15 mb-5">
          {mode === "patient" ? "Search or open a pathway" : "Pathway catalogue"}
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Find the right pathway
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {mode === "patient"
            ? "Search by blood test name or open a pathway directly. Once inside a pathway, enter your results and analyse them there."
            : "Search by test name or open a pathway directly. Use this page to find the right live pathway, then analyse the results inside that pathway."}
        </p>
      </div>

      <div className="mt-8 rounded-[22px] border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground">Search pathways</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Search by pathway name, blood test, or plain-language description.
        </p>
        <div className="mt-4 flex items-center rounded-[18px] border border-border bg-background px-4 py-3">
          <span className="mr-3 text-2xl text-muted-foreground">🔎</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anaemia, ferritin, MCV..."
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                category === item
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground ring-1 ring-border"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 mt-10 md:grid-cols-2 xl:grid-cols-3">
        {filteredEntries.map((entry) => {
          const liveTarget =
            entry.slug === "anaemia" ? "/pathway/anaemia" : entry.slug === "lft" ? "/pathway/lft" : null;

          return (
            <div
              key={entry.slug}
              className="rounded-[22px] border border-border bg-card p-6 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {entry.category}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-foreground">{entry.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.plain}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    entry.available
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {entry.available ? "Live" : "In development"}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground">{entry.description}</p>

              {entry.available && liveTarget ? (
                <Link
                  to={liveTarget}
                  className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Open pathway
                  <span aria-hidden>→</span>
                </Link>
              ) : (
                <div className="mt-6 inline-flex items-center gap-2 rounded-[12px] border border-border bg-background px-5 py-3 text-sm font-semibold text-muted-foreground">
                  Coming soon
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-[18px] bg-amber-50 p-5 ring-1 ring-amber-200">
        <p className="text-sm font-semibold text-amber-900">Scope note</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-800">
          These live tools reflect published NHS guidance and are designed to help people reach the right next step faster.
          They are not presented as NHS-commissioned products or local service agreements unless that is explicitly in place.
        </p>
      </div>
    </div>
  );
}
