import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/pathways")({
  component: PathwaysPage,
});

// ─── PATHWAY REGISTRY ────────────────────────────────────────────────────────
const PATHWAYS = [
  // ── HAEMATOLOGY ──────────────────────────────────────────────────────────
  {
    id: "anaemia",
    category: "Haematology",
    emoji: "🩸",
    title: "Anaemia",
    subtitle: "Iron deficiency pathway",
    description:
      "Hb, MCV, ferritin → referral decision with sex-specific thresholds. Outcome A (haematology), B (specialist), or C (primary care).",
    icb: "NWL ICB",
    version: "V1 · 9/7/20",
    status: "live" as const,
    inputs: ["Hb", "MCV", "Ferritin"],
    route: "/pathway/anaemia",
    accentColor: "red",
  },
  {
    id: "lft",
    category: "Hepatology",
    emoji: "🫀",
    title: "Abnormal LFTs",
    subtitle: "Liver function test pathway",
    description:
      "ALT, AST, ALP, GGT, bilirubin, albumin → pattern recognition (hepatitic/cholestatic/mixed), FIB-4 fibrosis risk score, and referral urgency.",
    icb: "NCL ICB",
    version: "BSG 2018",
    status: "live" as const,
    inputs: ["ALT", "AST", "ALP", "GGT", "Bilirubin", "Albumin"],
    route: "/pathway/lft",
    accentColor: "emerald",
  },
  {
    id: "thrombocytopenia",
    category: "Haematology",
    emoji: "🔴",
    title: "Thrombocytopenia",
    subtitle: "Low platelet pathway",
    description:
      "Platelet count + clinical context → referral thresholds. Persistent <80 ×10⁹/L for 4 months or <80 with symptoms requires haematology referral.",
    icb: "NWL ICB",
    version: "V1 · 9/7/20",
    status: "coming_soon" as const,
    inputs: ["Platelets", "Duration", "Symptoms"],
    route: null,
    accentColor: "rose",
  },
  {
    id: "macrocytosis",
    category: "Haematology",
    emoji: "🔵",
    title: "Macrocytosis",
    subtitle: "Raised MCV pathway",
    description:
      "MCV >101 fL → B12, folate, TFTs, alcohol, LFTs. Distinguishes between causes and directs investigation.",
    icb: "NWL ICB",
    version: "V1 · 9/7/20",
    status: "coming_soon" as const,
    inputs: ["MCV", "B12", "Folate", "TSH"],
    route: null,
    accentColor: "blue",
  },
  {
    id: "neutropenia",
    category: "Haematology",
    emoji: "⚪",
    title: "Neutropenia",
    subtitle: "Low neutrophil pathway",
    description:
      "Neutrophil count grading: severe <0.5, moderate 0.5–1.0, mild 1.0–1.5 ×10⁹/L. Risk stratification and referral criteria.",
    icb: "NWL ICB",
    version: "V1 · 9/7/20",
    status: "coming_soon" as const,
    inputs: ["Neutrophils", "WBC", "Clinical context"],
    route: null,
    accentColor: "slate",
  },
  {
    id: "b12",
    category: "Haematology",
    emoji: "🟡",
    title: "B12 Deficiency",
    subtitle: "Cobalamin pathway",
    description:
      "Serum B12 + symptoms → intrinsic factor antibodies, treatment decision (IM vs oral), and haematology referral criteria.",
    icb: "NWL ICB",
    version: "V1 · 9/7/20",
    status: "coming_soon" as const,
    inputs: ["B12", "Folate", "Symptoms"],
    route: null,
    accentColor: "yellow",
  },
];

const CATEGORY_ORDER = ["Haematology", "Hepatology"];

const accentStyles: Record<string, { badge: string; border: string; button: string; tag: string }> = {
  red: {
    badge: "bg-red-100 text-red-700",
    border: "hover:border-red-300 focus-within:border-red-300",
    button: "bg-red-600 hover:bg-red-700 text-white",
    tag: "bg-red-50 text-red-700",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700",
    border: "hover:border-emerald-300 focus-within:border-emerald-300",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    tag: "bg-emerald-50 text-emerald-700",
  },
  rose: {
    badge: "bg-rose-100 text-rose-700",
    border: "hover:border-rose-200",
    button: "bg-slate-200 text-slate-500 cursor-not-allowed",
    tag: "bg-rose-50 text-rose-700",
  },
  blue: {
    badge: "bg-blue-100 text-blue-700",
    border: "hover:border-blue-200",
    button: "bg-slate-200 text-slate-500 cursor-not-allowed",
    tag: "bg-blue-50 text-blue-700",
  },
  slate: {
    badge: "bg-slate-100 text-slate-600",
    border: "hover:border-slate-300",
    button: "bg-slate-200 text-slate-500 cursor-not-allowed",
    tag: "bg-slate-50 text-slate-600",
  },
  yellow: {
    badge: "bg-yellow-100 text-yellow-700",
    border: "hover:border-yellow-200",
    button: "bg-slate-200 text-slate-500 cursor-not-allowed",
    tag: "bg-yellow-50 text-yellow-700",
  },
};

function PathwayCard({
  pathway,
  onNavigate,
}: {
  pathway: (typeof PATHWAYS)[number];
  onNavigate: (route: string) => void;
}) {
  const accent = accentStyles[pathway.accentColor] ?? accentStyles.slate;
  const isLive = pathway.status === "live";

  return (
    <div
      className={`bg-white rounded-xl border-2 border-slate-200 p-5 flex flex-col gap-3 transition-all ${
        isLive ? `cursor-pointer ${accent.border}` : "opacity-75"
      }`}
      onClick={() => isLive && pathway.route && onNavigate(pathway.route)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{pathway.emoji}</span>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">
              {pathway.title}
            </h3>
            <p className="text-xs text-slate-500">{pathway.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accent.badge}`}
          >
            {pathway.icb}
          </span>
          {isLive ? (
            <span className="text-xs text-green-600 font-medium">● Live</span>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              Coming soon
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        {pathway.description}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {pathway.inputs.map((inp) => (
          <span
            key={inp}
            className={`text-xs px-2 py-0.5 rounded-md font-medium ${accent.tag}`}
          >
            {inp}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs text-slate-400">{pathway.version}</span>
        <button
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${accent.button}`}
          disabled={!isLive}
          onClick={(e) => {
            e.stopPropagation();
            if (isLive && pathway.route) onNavigate(pathway.route);
          }}
        >
          {isLive ? "Open pathway →" : "In development"}
        </button>
      </div>
    </div>
  );
}

function PathwaysPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = PATHWAYS.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      p.inputs.some((i) =>
        i.toLowerCase().includes(search.toLowerCase())
      ) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const liveCount = PATHWAYS.filter((p) => p.status === "live").length;
  const totalCount = PATHWAYS.length;

  const grouped = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const cat_pathways = filtered.filter((p) => p.category === cat);
      if (cat_pathways.length) acc[cat] = cat_pathways;
      return acc;
    },
    {} as Record<string, typeof PATHWAYS>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <button
                  onClick={() => navigate({ to: "/" })}
                  className="text-slate-400 hover:text-slate-600 transition-colors text-sm"
                >
                  ←
                </button>
                <h1 className="text-xl font-bold text-slate-900">
                  Clinical Pathways
                </h1>
              </div>
              <p className="text-sm text-slate-500">
                {liveCount} live · {totalCount - liveCount} in development
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
                NWL ICB
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
                NCL ICB
              </span>
            </div>
          </div>

          {/* Quick lookup search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by test name, e.g. ALT, ferritin, MCV…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {Object.entries(grouped).map(([category, pathways]) => (
          <div key={category}>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pathways.map((p) => (
                <PathwayCard
                  key={p.id}
                  pathway={p}
                  onNavigate={(route) => navigate({ to: route as "/" })}
                />
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium">No pathways found for "{search}"</p>
            <p className="text-sm mt-1">
              Try searching by test name (e.g. "ALT", "Hb", "ferritin")
            </p>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center pt-2 pb-6">
          <p className="text-xs text-slate-400">
            All pathways are derived from published NHS ICB guidelines and are
            intended to support — not replace — clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
