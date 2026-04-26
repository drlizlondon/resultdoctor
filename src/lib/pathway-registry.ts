export type LocationSlug = "ncl" | "nwl";
export type PathwaySlug = "anaemia" | "lft";
export type VariantSlug = "adult" | "child";
export type PathwayRenderer = "anaemia" | "lft";

export type PathwaySourceSummary = {
  organisation: string;
  document: string;
  version: string;
  effectiveDate?: string;
};

export type PathwayRegistryEntry = {
  location: LocationSlug;
  locationName: string;
  pathway: PathwaySlug;
  pathwayName: string;
  variant: VariantSlug;
  variantName: string;
  specialty: string;
  shortDescription: string;
  clinicianUse: string;
  status: "live" | "coming_soon";
  renderer: PathwayRenderer;
  calculatorHref: string;
  testTags: string[];
  patientSummary: string;
  source: PathwaySourceSummary;
};

const registryInput: PathwayRegistryEntry[] = [
  {
    location: "ncl",
    locationName: "North Central London",
    pathway: "anaemia",
    pathwayName: "Anaemia",
    variant: "adult",
    variantName: "Adult",
    specialty: "Haematology",
    shortDescription:
      "Adult abnormal FBC anaemia pathway built from the shared NCL primary care clinical pathway.",
    clinicianUse:
      "Clinician-facing anaemia assessment using haemoglobin, MCV, ferritin and related FBC investigations.",
    status: "live",
    renderer: "anaemia",
    calculatorHref: "/pathway/anaemia",
    testTags: ["hb", "haemoglobin", "mcv", "ferritin", "iron", "reticulocytes", "b12", "folate"],
    patientSummary:
      "Use this when low haemoglobin, ferritin, MCV, or related anaemia tests are abnormal and you need to know what to check next.",
    source: {
      organisation: "NCL ICB",
      document: "Abnormal Full Blood Count (FBC) in Adults Primary Care Clinical Pathway",
      version: "Final Version January 2023",
      effectiveDate: "2023-01-01",
    },
  },
  {
    location: "ncl",
    locationName: "North Central London",
    pathway: "lft",
    pathwayName: "Abnormal LFTs",
    variant: "adult",
    variantName: "Adult",
    specialty: "Hepatology",
    shortDescription:
      "Adult abnormal liver function test pathway for primary care, aligned to the shared NCL pathway.",
    clinicianUse:
      "Clinician-facing LFT triage using bilirubin, ALT, ALP, AST, GGT, albumin and fibrosis risk context.",
    status: "live",
    renderer: "lft",
    calculatorHref: "/pathway/lft",
    testTags: ["bilirubin", "alt", "alp", "ast", "ggt", "albumin", "inr", "lfts", "liver"],
    patientSummary:
      "Use this when bilirubin, ALT, ALP, GGT, or other liver blood tests are abnormal and you need the next recommended checks.",
    source: {
      organisation: "NCL ICB",
      document: "Adult Abnormal Liver Function Tests Primary Care Clinical Pathway",
      version: "Final Version February 2025",
    },
  },
];

const seenKeys = new Set<string>();

for (const entry of registryInput) {
  const key = `${entry.location}:${entry.pathway}:${entry.variant}`;
  if (seenKeys.has(key)) {
    throw new Error(
      `Duplicate pathway registry entry for ${entry.location}/${entry.pathway}/${entry.variant}`
    );
  }
  seenKeys.add(key);
}

export const pathwayRegistry = registryInput.map((entry) => ({
  ...entry,
  href: `/pathways/${entry.location}/${entry.pathway}/${entry.variant}` as const,
}));

export type PathwayRegistryRecord = (typeof pathwayRegistry)[number];

type LocationSummary = {
  slug: LocationSlug;
  name: string;
  liveCount: number;
  pathwayCount: number;
};

export function getLocations(): LocationSummary[] {
  const order: LocationSlug[] = ["ncl", "nwl"];
  const locations: LocationSummary[] = [];

  for (const slug of order) {
    const entries = pathwayRegistry.filter((entry) => entry.location === slug);
    if (entries.length === 0) continue;

    locations.push({
      slug,
      name: entries[0].locationName,
      liveCount: entries.filter((entry) => entry.status === "live").length,
      pathwayCount: new Set(entries.map((entry) => entry.pathway)).size,
    });
  }

  return locations;
}

export function getLocationFamilies(location: string) {
  const entries = pathwayRegistry.filter((entry) => entry.location === location);
  const familyMap = new Map<
    string,
    {
      slug: PathwaySlug;
      name: string;
      specialty: string;
      description: string;
      variantCount: number;
      liveCount: number;
    }
  >();

  for (const entry of entries) {
    if (!familyMap.has(entry.pathway)) {
      familyMap.set(entry.pathway, {
        slug: entry.pathway,
        name: entry.pathwayName,
        specialty: entry.specialty,
        description: entry.shortDescription,
        variantCount: 0,
        liveCount: 0,
      });
    }

    const family = familyMap.get(entry.pathway)!;
    family.variantCount += 1;
    if (entry.status === "live") family.liveCount += 1;
  }

  return Array.from(familyMap.values());
}

export function getLocationName(location: string) {
  return pathwayRegistry.find((entry) => entry.location === location)?.locationName;
}

export function getPathwayFamily(location: string, pathway: string) {
  return getLocationFamilies(location).find((entry) => entry.slug === pathway);
}

export function getPathwayVariants(location: string, pathway: string) {
  return pathwayRegistry.filter(
    (entry) => entry.location === location && entry.pathway === pathway
  );
}

export function getPathwayEntry(
  location: string,
  pathway: string,
  variant: string
) {
  return pathwayRegistry.find(
    (entry) =>
      entry.location === location &&
      entry.pathway === pathway &&
      entry.variant === variant
  );
}
