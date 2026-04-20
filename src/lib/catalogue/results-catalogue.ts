/**
 * ResultDoctor — Results Catalogue
 *
 * The single source of truth for every blood test the system understands.
 *
 * Each test knows:
 * - Its normal range (sex/age specific where needed)
 * - Which other tests it's grouped with on the same report
 * - Which pathways it triggers when abnormal
 * - Which other tests the system should request when it's abnormal
 *
 * Sources:
 * - NCL Abnormal FBC in Adults (January 2023)
 * - NCL Abnormal LFTs (February 2023)
 * - NCL Thyroid Function Tests
 * - NCL Iron Deficiency Pathway (August 2022)
 * - NWL Anaemia Pathway (V1, 9/7/20)
 */

import type { CatalogueTest } from "../types";

export const RESULTS_CATALOGUE: CatalogueTest[] = [

  // ───────────────────────────────────────────────
  // FULL BLOOD COUNT (FBC)
  // ───────────────────────────────────────────────

  {
    id: "hb",
    label: "Haemoglobin",
    abbreviation: "Hb",
    patientLabel: "Haemoglobin (Hb)",
    patientExplanation: "Haemoglobin is the protein in red blood cells that carries oxygen around your body. A low result means you may be anaemic.",
    unit: "g/L",
    inputRange: { min: 20, max: 250 },
    normalRange: {
      sexSpecific: {
        male: { low: 130, high: 180 },
        female: { low: 115, high: 165 },
      },
      unit: "g/L",
      note: "NCL anaemia threshold: <110 g/L for men and non-pregnant women over 15",
    },
    requiresSex: true,
    groupedWith: ["mcv", "mch", "mchc", "wbc", "neutrophils", "lymphocytes", "monocytes", "eosinophils", "basophils", "platelets", "haematocrit", "reticulocytes"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      low: ["ncl-fbc-anaemia", "nwl-anaemia"],
      high: ["ncl-fbc-polycythaemia", "nwl-erythrocytosis"],
    },
    whenLow_requestAlso: ["mcv", "ferritin", "b12", "folate", "crp", "reticulocytes", "blood_film", "lft", "renal"],
    whenHigh_requestAlso: ["haematocrit", "blood_film", "ferritin", "epo"],
  },

  {
    id: "mcv",
    label: "Mean Corpuscular Volume",
    abbreviation: "MCV",
    patientLabel: "MCV (red blood cell size)",
    patientExplanation: "MCV measures the size of your red blood cells. Too small usually means iron deficiency. Too large can mean B12 or folate deficiency.",
    unit: "fL",
    inputRange: { min: 40, max: 150 },
    normalRange: { low: 80, high: 100, unit: "fL" },
    groupedWith: ["hb", "mch", "mchc", "wbc", "platelets"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      low: ["ncl-fbc-anaemia"],
      high: ["ncl-fbc-macrocytosis"],
    },
    whenLow_requestAlso: ["ferritin", "iron_studies", "crp", "haemoglobin_electrophoresis"],
    whenHigh_requestAlso: ["b12", "folate", "lft", "tft", "reticulocytes", "myeloma_screen"],
  },

  {
    id: "wbc",
    label: "White Blood Cell Count",
    abbreviation: "WBC",
    patientLabel: "White Blood Cell Count (WBC)",
    patientExplanation: "White blood cells fight infection. Abnormal counts can indicate infection, inflammation or, rarely, blood disorders.",
    unit: "×10⁹/L",
    inputRange: { min: 0.1, max: 200 },
    normalRange: { low: 4.0, high: 11.0, unit: "×10⁹/L" },
    groupedWith: ["hb", "neutrophils", "lymphocytes", "monocytes", "eosinophils", "basophils", "platelets"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      low: ["ncl-fbc-neutropenia"],
      high: ["ncl-fbc-neutrophilia", "ncl-fbc-lymphocytosis"],
    },
    whenAbnormal_requestAlso: ["blood_film", "crp", "lft", "ldh"],
  },

  {
    id: "neutrophils",
    label: "Neutrophils",
    abbreviation: "Neutrophils",
    patientLabel: "Neutrophils (infection-fighting white cells)",
    patientExplanation: "Neutrophils are white blood cells that fight bacterial infections. Low levels can increase your risk of serious infection.",
    unit: "×10⁹/L",
    inputRange: { min: 0.01, max: 100 },
    normalRange: { low: 1.8, high: 7.5, unit: "×10⁹/L" },
    groupedWith: ["hb", "wbc", "lymphocytes", "platelets"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      low: ["ncl-fbc-neutropenia"],
      high: ["ncl-fbc-neutrophilia"],
    },
    whenLow_requestAlso: ["blood_film", "ana", "hiv", "hepatitis_screen", "b12", "folate"],
    whenHigh_requestAlso: ["blood_film", "crp", "lft", "ldh", "calcium"],
  },

  {
    id: "lymphocytes",
    label: "Lymphocytes",
    abbreviation: "Lymphocytes",
    patientLabel: "Lymphocytes (immune white cells)",
    patientExplanation: "Lymphocytes are white blood cells important for your immune system. Abnormal levels can have many causes including viral infections.",
    unit: "×10⁹/L",
    inputRange: { min: 0.01, max: 100 },
    normalRange: { low: 1.0, high: 3.5, unit: "×10⁹/L" },
    groupedWith: ["hb", "wbc", "neutrophils", "platelets"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      low: ["ncl-fbc-lymphopenia"],
      high: ["ncl-fbc-lymphocytosis"],
    },
    whenLow_requestAlso: ["blood_film", "b12", "folate", "ana", "hiv", "hepatitis_screen", "myeloma_screen", "ldh", "ferritin"],
    whenHigh_requestAlso: ["blood_film", "crp", "esr", "im_screen"],
  },

  {
    id: "monocytes",
    label: "Monocytes",
    abbreviation: "Monocytes",
    patientLabel: "Monocytes (white blood cells)",
    patientExplanation: "Monocytes are a type of white blood cell. Raised levels can indicate infection, inflammation or, rarely, blood disorders.",
    unit: "×10⁹/L",
    inputRange: { min: 0.01, max: 50 },
    normalRange: { low: 0.2, high: 1.0, unit: "×10⁹/L" },
    groupedWith: ["hb", "wbc", "neutrophils", "lymphocytes", "platelets"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      high: ["ncl-fbc-monocytosis"],
    },
    whenHigh_requestAlso: ["blood_film", "mcv", "tft", "iron_studies", "ferritin", "hiv", "hepatitis_screen"],
  },

  {
    id: "eosinophils",
    label: "Eosinophils",
    abbreviation: "Eosinophils",
    patientLabel: "Eosinophils (allergy/parasite white cells)",
    patientExplanation: "Eosinophils are white blood cells involved in allergic reactions and fighting parasites. High levels can indicate allergy, asthma or travel-related infections.",
    unit: "×10⁹/L",
    inputRange: { min: 0, max: 50 },
    normalRange: { low: 0.04, high: 0.5, unit: "×10⁹/L" },
    groupedWith: ["hb", "wbc", "neutrophils", "lymphocytes", "platelets"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      high: ["ncl-fbc-eosinophilia"],
    },
    whenHigh_requestAlso: ["blood_film", "crp", "esr", "ige"],
  },

  {
    id: "platelets",
    label: "Platelets",
    abbreviation: "Platelets",
    patientLabel: "Platelets (clotting cells)",
    patientExplanation: "Platelets help your blood to clot when you bleed. Too few can cause unusual bruising or bleeding. Too many can increase clot risk.",
    unit: "×10⁹/L",
    inputRange: { min: 1, max: 2000 },
    normalRange: { low: 150, high: 450, unit: "×10⁹/L" },
    groupedWith: ["hb", "wbc", "neutrophils", "lymphocytes"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      low: ["ncl-fbc-thrombocytopenia"],
      high: ["ncl-fbc-thrombocytosis"],
    },
    whenLow_requestAlso: ["blood_film", "coagulation_screen", "b12", "folate", "ana", "anca", "hiv", "hepatitis_screen", "lft", "renal"],
    whenHigh_requestAlso: ["blood_film", "crp", "esr", "ferritin", "iron_studies", "lft", "renal"],
  },

  {
    id: "haematocrit",
    label: "Haematocrit",
    abbreviation: "HCT",
    patientLabel: "Haematocrit (packed cell volume)",
    patientExplanation: "Haematocrit measures what proportion of your blood is made up of red blood cells. High levels can mean polycythaemia.",
    unit: "ratio",
    inputRange: { min: 0.1, max: 0.8 },
    normalRange: {
      sexSpecific: {
        male: { low: 0.39, high: 0.52 },
        female: { low: 0.35, high: 0.48 },
      },
      unit: "ratio",
      note: "Polycythaemia threshold: HCT >0.52 men, >0.48 women (NCL)",
    },
    requiresSex: true,
    groupedWith: ["hb", "mcv", "wbc", "platelets"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      high: ["ncl-fbc-polycythaemia"],
    },
    whenHigh_requestAlso: ["blood_film", "ferritin", "iron_studies", "epo", "lft", "renal"],
  },

  {
    id: "reticulocytes",
    label: "Reticulocyte Count",
    abbreviation: "Reticulocytes",
    patientLabel: "Reticulocytes (young red blood cells)",
    patientExplanation: "Reticulocytes are immature red blood cells. This test shows how fast your bone marrow is making new red cells.",
    unit: "×10⁹/L",
    inputRange: { min: 0, max: 500 },
    normalRange: { low: 25, high: 80, unit: "×10⁹/L", note: "Or 0.5–2.5%" },
    groupedWith: ["hb", "mcv"],
    groupLabel: "Full Blood Count (FBC)",
    feedsPathways: {
      low: ["ncl-fbc-anaemia"],
      high: ["ncl-fbc-anaemia"],
    },
  },

  // ───────────────────────────────────────────────
  // IRON STUDIES
  // ───────────────────────────────────────────────

  {
    id: "ferritin",
    label: "Ferritin",
    abbreviation: "Ferritin",
    patientLabel: "Ferritin (iron stores)",
    patientExplanation: "Ferritin measures how much iron is stored in your body. Low levels mean your iron stores are depleted. High levels can indicate inflammation or iron overload.",
    unit: "µg/L",
    inputRange: { min: 1, max: 5000 },
    normalRange: {
      sexSpecific: {
        male: { low: 30, high: 400 },
        female: { low: 15, high: 200 },
      },
      unit: "µg/L",
      note: "Iron deficiency: <15 µg/L absent stores, <30 µg/L low stores. Interpretation difficult with inflammation — ferritin is an acute phase reactant.",
    },
    requiresSex: true,
    groupedWith: ["iron_studies", "tibc", "transferrin_saturation"],
    groupLabel: "Iron Studies",
    feedsPathways: {
      low: ["ncl-iron-deficiency", "ncl-fbc-anaemia"],
      high: ["ncl-raised-ferritin"],
    },
    whenLow_requestAlso: ["iron_studies", "tibc", "crp", "coeliac_screen"],
    whenHigh_requestAlso: ["iron_studies", "transferrin_saturation", "lft", "crp", "haemochromatosis_screen"],
  },

  {
    id: "iron_studies",
    label: "Serum Iron",
    abbreviation: "Iron",
    patientLabel: "Iron level (serum iron)",
    patientExplanation: "This measures the amount of iron circulating in your blood at the time of the test.",
    unit: "µmol/L",
    inputRange: { min: 1, max: 80 },
    normalRange: { low: 10, high: 30, unit: "µmol/L" },
    groupedWith: ["ferritin", "tibc", "transferrin_saturation"],
    groupLabel: "Iron Studies",
    feedsPathways: {
      low: ["ncl-iron-deficiency", "ncl-fbc-anaemia"],
    },
    whenLow_requestAlso: ["ferritin", "tibc", "crp", "coeliac_screen"],
  },

  {
    id: "tibc",
    label: "Total Iron Binding Capacity",
    abbreviation: "TIBC",
    patientLabel: "TIBC (iron carrying capacity)",
    patientExplanation: "TIBC measures how well your blood can carry iron. High TIBC with low iron usually confirms iron deficiency.",
    unit: "µmol/L",
    inputRange: { min: 20, max: 100 },
    normalRange: { low: 45, high: 72, unit: "µmol/L" },
    groupedWith: ["ferritin", "iron_studies", "transferrin_saturation"],
    groupLabel: "Iron Studies",
    feedsPathways: {
      high: ["ncl-fbc-anaemia"],
    },
  },

  {
    id: "transferrin_saturation",
    label: "Transferrin Saturation",
    abbreviation: "Tsat",
    patientLabel: "Transferrin saturation",
    patientExplanation: "This shows what percentage of your blood's iron-carrying capacity is being used. Low means iron deficiency, very high can mean iron overload.",
    unit: "%",
    inputRange: { min: 1, max: 100 },
    normalRange: { low: 20, high: 50, unit: "%" },
    groupedWith: ["ferritin", "iron_studies", "tibc"],
    groupLabel: "Iron Studies",
    feedsPathways: {
      low: ["ncl-fbc-anaemia"],
      high: ["ncl-raised-ferritin"],
    },
  },

  // ───────────────────────────────────────────────
  // HAEMATINICS
  // ───────────────────────────────────────────────

  {
    id: "b12",
    label: "Vitamin B12",
    abbreviation: "B12",
    patientLabel: "Vitamin B12",
    patientExplanation: "B12 is essential for healthy red blood cells and nerves. Low levels can cause anaemia and nerve problems.",
    unit: "ng/L",
    inputRange: { min: 50, max: 2000 },
    normalRange: {
      low: 170,
      high: 900,
      unit: "ng/L",
      note: "B12 <170 ng/L may need treatment. Check intrinsic factor antibody if strong clinical suspicion despite borderline result. Do not test in pregnancy.",
    },
    groupedWith: ["folate", "hb", "mcv"],
    groupLabel: "Haematinics",
    feedsPathways: {
      low: ["ncl-fbc-anaemia"],
      high: ["nwl-raised-b12"],
    },
    whenLow_requestAlso: ["folate", "blood_film", "intrinsic_factor_ab"],
  },

  {
    id: "folate",
    label: "Serum Folate",
    abbreviation: "Folate",
    patientLabel: "Folate (folic acid level)",
    patientExplanation: "Folate is a B vitamin essential for making red blood cells. Low levels can cause a type of anaemia.",
    unit: "µg/L",
    inputRange: { min: 0.5, max: 40 },
    normalRange: {
      low: 3.0,
      unit: "µg/L",
      note: "Serum folate <3 µg/L deficient. 3–4.5 µg/L borderline — check red cell folate if strong clinical suspicion. Check B12 before starting folate treatment.",
    },
    groupedWith: ["b12", "hb", "mcv"],
    groupLabel: "Haematinics",
    feedsPathways: {
      low: ["ncl-fbc-anaemia"],
    },
    whenLow_requestAlso: ["b12", "blood_film"],
  },

  // ───────────────────────────────────────────────
  // LIVER FUNCTION TESTS (LFTs)
  // ───────────────────────────────────────────────

  {
    id: "alt",
    label: "Alanine Aminotransferase",
    abbreviation: "ALT",
    patientLabel: "ALT (liver enzyme)",
    patientExplanation: "ALT is an enzyme mainly found in liver cells. High levels suggest the liver cells may be inflamed or damaged.",
    unit: "IU/L",
    inputRange: { min: 1, max: 5000 },
    normalRange: { low: 5, high: 40, unit: "IU/L" },
    groupedWith: ["ast", "alp", "ggt", "bilirubin", "albumin", "inr"],
    groupLabel: "Liver Function Tests (LFTs)",
    feedsPathways: {
      high: ["ncl-lft"],
    },
    whenHigh_requestAlso: ["ast", "alp", "ggt", "bilirubin", "albumin", "hbsag", "hcv_ab", "ultrasound_liver"],
  },

  {
    id: "ast",
    label: "Aspartate Aminotransferase",
    abbreviation: "AST",
    patientLabel: "AST (liver enzyme)",
    patientExplanation: "AST is an enzyme found in the liver and heart. High levels can indicate liver damage.",
    unit: "IU/L",
    inputRange: { min: 1, max: 5000 },
    normalRange: { low: 5, high: 40, unit: "IU/L" },
    groupedWith: ["alt", "alp", "ggt", "bilirubin", "albumin"],
    groupLabel: "Liver Function Tests (LFTs)",
    feedsPathways: {
      high: ["ncl-lft"],
    },
    whenHigh_requestAlso: ["alt", "alp", "ggt", "bilirubin", "albumin"],
  },

  {
    id: "alp",
    label: "Alkaline Phosphatase",
    abbreviation: "ALP",
    patientLabel: "ALP (liver and bone enzyme)",
    patientExplanation: "ALP is an enzyme found in the liver, bone and bile duct. High levels can indicate liver, gallbladder or bone problems.",
    unit: "IU/L",
    inputRange: { min: 1, max: 2000 },
    normalRange: { low: 35, high: 130, unit: "IU/L" },
    groupedWith: ["alt", "ast", "ggt", "bilirubin", "albumin"],
    groupLabel: "Liver Function Tests (LFTs)",
    feedsPathways: {
      high: ["ncl-lft"],
    },
    whenHigh_requestAlso: ["ggt", "bilirubin", "vitamin_d", "bone_profile", "ultrasound_liver"],
  },

  {
    id: "ggt",
    label: "Gamma-Glutamyl Transferase",
    abbreviation: "GGT",
    patientLabel: "GGT (liver enzyme)",
    patientExplanation: "GGT is a liver enzyme. High levels are often related to alcohol use, liver disease or bile duct problems.",
    unit: "IU/L",
    inputRange: { min: 1, max: 2000 },
    normalRange: { low: 10, high: 55, unit: "IU/L" },
    groupedWith: ["alt", "ast", "alp", "bilirubin"],
    groupLabel: "Liver Function Tests (LFTs)",
    feedsPathways: {
      high: ["ncl-lft", "ncl-isolated-ggt"],
    },
    whenHigh_requestAlso: ["alt", "alp", "bilirubin", "ultrasound_liver"],
  },

  {
    id: "bilirubin",
    label: "Bilirubin",
    abbreviation: "Bili",
    patientLabel: "Bilirubin (bile pigment)",
    patientExplanation: "Bilirubin is a yellow pigment from broken-down red blood cells. High levels cause jaundice (yellowing of skin and eyes).",
    unit: "µmol/L",
    inputRange: { min: 1, max: 500 },
    normalRange: { low: 3, high: 21, unit: "µmol/L", note: "Jaundice threshold: >40 µmol/L (NCL LFT pathway)" },
    groupedWith: ["alt", "ast", "alp", "ggt", "albumin"],
    groupLabel: "Liver Function Tests (LFTs)",
    feedsPathways: {
      high: ["ncl-lft"],
    },
    whenHigh_requestAlso: ["alt", "ast", "alp", "ggt", "albumin", "fbc", "reticulocytes", "ldh"],
  },

  {
    id: "albumin",
    label: "Albumin",
    abbreviation: "Albumin",
    patientLabel: "Albumin (blood protein)",
    patientExplanation: "Albumin is a protein made by the liver. Low levels suggest the liver may not be working well or you may be malnourished.",
    unit: "g/L",
    inputRange: { min: 10, max: 60 },
    normalRange: { low: 35, high: 50, unit: "g/L" },
    groupedWith: ["alt", "ast", "alp", "ggt", "bilirubin"],
    groupLabel: "Liver Function Tests (LFTs)",
    feedsPathways: {
      low: ["ncl-lft"],
    },
    whenLow_requestAlso: ["inr", "ultrasound_liver"],
  },

  // ───────────────────────────────────────────────
  // THYROID FUNCTION TESTS (TFTs)
  // ───────────────────────────────────────────────

  {
    id: "tsh",
    label: "Thyroid Stimulating Hormone",
    abbreviation: "TSH",
    patientLabel: "TSH (thyroid control hormone)",
    patientExplanation: "TSH is produced by the brain to control the thyroid gland. High TSH means the thyroid may be underactive. Low TSH means it may be overactive.",
    unit: "mU/L",
    inputRange: { min: 0.001, max: 100 },
    normalRange: {
      low: 0.4,
      high: 4.0,
      unit: "mU/L",
      note: "Reference ranges vary by laboratory. In pregnancy, trimester-specific ranges apply.",
    },
    groupedWith: ["ft4", "ft3", "tpo_ab"],
    groupLabel: "Thyroid Function Tests (TFTs)",
    feedsPathways: {
      low: ["ncl-tft"],
      high: ["ncl-tft"],
    },
    whenLow_requestAlso: ["ft4", "ft3"],
    whenHigh_requestAlso: ["ft4", "tpo_ab"],
  },

  {
    id: "ft4",
    label: "Free Thyroxine",
    abbreviation: "FT4",
    patientLabel: "FT4 (thyroid hormone)",
    patientExplanation: "FT4 is the main hormone produced by your thyroid gland. Combined with TSH, it helps diagnose thyroid conditions.",
    unit: "pmol/L",
    inputRange: { min: 1, max: 60 },
    normalRange: { low: 9, high: 25, unit: "pmol/L" },
    groupedWith: ["tsh", "ft3", "tpo_ab"],
    groupLabel: "Thyroid Function Tests (TFTs)",
    feedsPathways: {
      low: ["ncl-tft"],
      high: ["ncl-tft"],
    },
    whenAbnormal_requestAlso: ["tsh", "ft3"],
  },

  {
    id: "ft3",
    label: "Free Tri-iodothyronine",
    abbreviation: "FT3",
    patientLabel: "FT3 (thyroid hormone)",
    patientExplanation: "FT3 is the active form of thyroid hormone. It's checked alongside TSH and FT4 for a complete thyroid picture.",
    unit: "pmol/L",
    inputRange: { min: 1, max: 30 },
    normalRange: { low: 3.5, high: 7.8, unit: "pmol/L" },
    groupedWith: ["tsh", "ft4", "tpo_ab"],
    groupLabel: "Thyroid Function Tests (TFTs)",
    feedsPathways: {
      low: ["ncl-tft"],
      high: ["ncl-tft"],
    },
  },

  // ───────────────────────────────────────────────
  // INFLAMMATORY MARKERS
  // ───────────────────────────────────────────────

  {
    id: "crp",
    label: "C-Reactive Protein",
    abbreviation: "CRP",
    patientLabel: "CRP (inflammation marker)",
    patientExplanation: "CRP is a protein that rises when there is inflammation or infection anywhere in the body.",
    unit: "mg/L",
    inputRange: { min: 0.1, max: 500 },
    normalRange: { high: 10, unit: "mg/L" },
    groupedWith: ["esr"],
    groupLabel: "Inflammatory Markers",
    feedsPathways: {
      high: ["ncl-fbc-anaemia", "ncl-lft"],
    },
    whenHigh_requestAlso: ["esr", "blood_film"],
  },

  {
    id: "esr",
    label: "Erythrocyte Sedimentation Rate",
    abbreviation: "ESR",
    patientLabel: "ESR (inflammation blood test)",
    patientExplanation: "ESR measures how quickly red blood cells settle in a tube. A high result suggests inflammation somewhere in the body.",
    unit: "mm/hr",
    inputRange: { min: 1, max: 150 },
    normalRange: {
      unit: "mm/hr",
      note: "Normal range increases with age. Generally: <20 mm/hr concerning in young adults.",
    },
    groupedWith: ["crp"],
    groupLabel: "Inflammatory Markers",
    feedsPathways: {
      high: ["nwl-raised-esr"],
    },
    whenHigh_requestAlso: ["crp", "protein_electrophoresis", "myeloma_screen"],
  },

  // ───────────────────────────────────────────────
  // RENAL FUNCTION
  // ───────────────────────────────────────────────

  {
    id: "creatinine",
    label: "Creatinine",
    abbreviation: "Creatinine",
    patientLabel: "Creatinine (kidney function)",
    patientExplanation: "Creatinine is a waste product filtered by your kidneys. High levels suggest the kidneys may not be working as well as they should.",
    unit: "µmol/L",
    inputRange: { min: 30, max: 2000 },
    normalRange: {
      sexSpecific: {
        male: { low: 64, high: 104 },
        female: { low: 49, high: 90 },
      },
      unit: "µmol/L",
    },
    requiresSex: true,
    groupedWith: ["egfr", "urea", "sodium", "potassium"],
    groupLabel: "Renal Profile (U&Es)",
    feedsPathways: {
      high: ["ncl-ckd"],
    },
    whenHigh_requestAlso: ["egfr", "urine_dipstick", "bp"],
  },

  {
    id: "egfr",
    label: "Estimated Glomerular Filtration Rate",
    abbreviation: "eGFR",
    patientLabel: "eGFR (kidney filtration rate)",
    patientExplanation: "eGFR estimates how well your kidneys are filtering your blood. The lower the number, the less well the kidneys are working.",
    unit: "mL/min/1.73m²",
    inputRange: { min: 1, max: 130 },
    normalRange: { low: 60, unit: "mL/min/1.73m²", note: "eGFR <60 on two occasions ≥90 days apart = CKD" },
    groupedWith: ["creatinine", "urea", "sodium", "potassium"],
    groupLabel: "Renal Profile (U&Es)",
    feedsPathways: {
      low: ["ncl-ckd"],
    },
    whenLow_requestAlso: ["creatinine", "urine_dipstick", "bp", "urine_acr"],
  },

  // ───────────────────────────────────────────────
  // MYELOMA / PARAPROTEIN SCREEN
  // ───────────────────────────────────────────────

  {
    id: "protein_electrophoresis",
    label: "Serum Protein Electrophoresis",
    abbreviation: "SPEP",
    patientLabel: "Protein electrophoresis (paraprotein screen)",
    patientExplanation: "This test looks for abnormal proteins in the blood that can indicate conditions like myeloma.",
    unit: "g/L (paraprotein if detected)",
    inputRange: { min: 0, max: 100 },
    normalRange: { unit: "g/L", note: "Normal = no paraprotein detected" },
    groupedWith: ["serum_free_light_chains", "urine_electrophoresis"],
    groupLabel: "Myeloma Screen",
    feedsPathways: {
      any: ["ncl-fbc-paraproteins", "nwl-paraproteinaemia"],
    },
    whenAbnormal_requestAlso: ["serum_free_light_chains", "renal", "bone_profile", "esr"],
  },

  {
    id: "serum_free_light_chains",
    label: "Serum Free Light Chains",
    abbreviation: "SFLC",
    patientLabel: "Free light chains (paraprotein screen)",
    patientExplanation: "Free light chains are protein fragments that can indicate myeloma or related conditions.",
    unit: "ratio",
    inputRange: { min: 0.01, max: 1000 },
    normalRange: { low: 0.26, high: 1.65, unit: "Kappa:Lambda ratio" },
    groupedWith: ["protein_electrophoresis", "urine_electrophoresis"],
    groupLabel: "Myeloma Screen",
    feedsPathways: {
      any: ["ncl-fbc-paraproteins", "nwl-paraproteinaemia"],
    },
  },

];

// ─────────────────────────────────────────────────────────────
// CATALOGUE LOOKUP HELPERS
// ─────────────────────────────────────────────────────────────

export const catalogueById = Object.fromEntries(
  RESULTS_CATALOGUE.map((t) => [t.id, t])
) as Record<string, CatalogueTest>;

/** Get all tests that are grouped with a given test (same report) */
export function getGroupedTests(testId: string): CatalogueTest[] {
  const test = catalogueById[testId];
  if (!test) return [];
  return test.groupedWith
    .map((id) => catalogueById[id])
    .filter(Boolean);
}

/** Get all tests that feed a given pathway */
export function getTestsForPathway(pathwayId: string): CatalogueTest[] {
  return RESULTS_CATALOGUE.filter(
    (t) =>
      t.feedsPathways.low?.includes(pathwayId) ||
      t.feedsPathways.high?.includes(pathwayId) ||
      t.feedsPathways.any?.includes(pathwayId)
  );
}

/** Determine if a result is abnormal, and in which direction */
export function classifyResult(
  test: CatalogueTest,
  value: number,
  sex?: Sex
): "low" | "high" | "normal" {
  const range = test.normalRange;

  let low: number | undefined;
  let high: number | undefined;

  if (range.sexSpecific && sex) {
    low = range.sexSpecific[sex]?.low;
    high = range.sexSpecific[sex]?.high;
  } else {
    low = range.low;
    high = range.high;
  }

  if (low !== undefined && value < low) return "low";
  if (high !== undefined && value > high) return "high";
  return "normal";
}

/** Get the tests the system should proactively request given an abnormal result */
export function getChallengeTests(
  testId: string,
  direction: "low" | "high" | "normal"
): string[] {
  const test = catalogueById[testId];
  if (!test || direction === "normal") return [];

  const requested = new Set<string>();

  // Always ask for grouped tests (same report)
  test.groupedWith.forEach((id) => requested.add(id));

  // Direction-specific requests
  if (direction === "low") {
    test.whenLow_requestAlso?.forEach((id) => requested.add(id));
  } else if (direction === "high") {
    test.whenHigh_requestAlso?.forEach((id) => requested.add(id));
  }
  test.whenAbnormal_requestAlso?.forEach((id) => requested.add(id));

  // Don't request the test itself
  requested.delete(testId);

  return [...requested];
}
