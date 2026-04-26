export type ReferenceRange =
  | {
      type: "range";
      low: number;
      high: number;
      unit: string;
      note?: string;
    }
  | {
      type: "lower-bound";
      low: number;
      unit: string;
      note?: string;
    }
  | {
      type: "upper-bound";
      high: number;
      unit: string;
      note?: string;
    }
  | {
      type: "sex-specific-range";
      unit: string;
      male: { low: number; high: number };
      female: { low: number; high: number };
      note?: string;
    };

export type LivePathwayInput = {
  id: string;
  pathway: "anaemia" | "lft";
  label: string;
  unit: string;
  normalReference: ReferenceRange;
  pathwayTrigger?: string;
  whyItMatters: string;
  ifAbnormalAskFor: string[];
};

export type StandardAction =
  | "urgent_admission"
  | "urgent_2ww_referral"
  | "urgent_specialist_discussion"
  | "routine_specialist_referral"
  | "repeat_bloods"
  | "start_treatment"
  | "arrange_ultrasound"
  | "request_extended_liver_panel"
  | "primary_care_investigation";

export const STANDARD_ACTION_LABELS: Record<StandardAction, string> = {
  urgent_admission: "Refer for urgent admission",
  urgent_2ww_referral: "Arrange urgent / 2WW referral",
  urgent_specialist_discussion: "Seek urgent specialist advice",
  routine_specialist_referral: "Arrange routine specialist referral",
  repeat_bloods: "Repeat blood tests",
  start_treatment: "Start treatment",
  arrange_ultrasound: "Arrange ultrasound",
  request_extended_liver_panel: "Request extended liver test panel",
  primary_care_investigation: "Continue primary care investigation",
};

export const LIVE_PATHWAY_INPUTS: LivePathwayInput[] = [
  {
    id: "hb",
    pathway: "anaemia",
    label: "Haemoglobin",
    unit: "g/L",
    normalReference: {
      type: "sex-specific-range",
      unit: "g/L",
      male: { low: 130, high: 180 },
      female: { low: 115, high: 165 },
      note: "Adult non-pregnant reference range used in the catalogue. The NCL anaemia pathway itself starts at Hb <110 g/L.",
    },
    pathwayTrigger: "Anaemia pathway entry: Hb <110 g/L in men and non-pregnant women over 15 years.",
    whyItMatters: "This decides whether the anaemia pathway opens at all.",
    ifAbnormalAskFor: ["MCV", "Ferritin", "B12", "Folate", "CRP", "Reticulocytes", "Blood film", "U&Es / creatinine", "LFTs"],
  },
  {
    id: "mcv",
    pathway: "anaemia",
    label: "MCV",
    unit: "fL",
    normalReference: {
      type: "range",
      low: 80,
      high: 100,
      unit: "fL",
    },
    pathwayTrigger: "Microcytic <80 fL; Normocytic 80-100 fL; Macrocytic >100 fL.",
    whyItMatters: "This chooses the main branch of the anaemia pathway.",
    ifAbnormalAskFor: ["Ferritin", "CRP", "Iron", "TIBC", "Transferrin saturation", "Reticulocytes", "B12", "Folate"],
  },
  {
    id: "ferritin",
    pathway: "anaemia",
    label: "Ferritin",
    unit: "mcg/L",
    normalReference: {
      type: "sex-specific-range",
      unit: "mcg/L",
      male: { low: 30, high: 400 },
      female: { low: 15, high: 200 },
      note: "Ferritin is an acute phase reactant and may be raised by inflammation.",
    },
    pathwayTrigger: "Low ferritin branch: <30 mcg/L. Indeterminate branch: 30-150 mcg/L with no known inflammatory states. High ferritin branch: >150 mcg/L.",
    whyItMatters: "Ferritin helps distinguish iron deficiency from other causes of anaemia.",
    ifAbnormalAskFor: ["CRP", "Iron", "TIBC", "Transferrin saturation", "Coeliac screen"],
  },
  {
    id: "serum_iron",
    pathway: "anaemia",
    label: "Serum Iron",
    unit: "umol/L",
    normalReference: {
      type: "range",
      low: 10,
      high: 30,
      unit: "umol/L",
    },
    pathwayTrigger: "Microcytic indeterminate ferritin branch uses >7 umol/L vs <7 umol/L.",
    whyItMatters: "Used with CRP, TIBC, and transferrin saturation to separate iron replete from functional iron deficiency.",
    ifAbnormalAskFor: ["Ferritin", "CRP", "TIBC", "Transferrin saturation"],
  },
  {
    id: "tibc",
    pathway: "anaemia",
    label: "TIBC",
    unit: "umol/L",
    normalReference: {
      type: "range",
      low: 45,
      high: 72,
      unit: "umol/L",
    },
    pathwayTrigger: "Microcytic indeterminate ferritin branch uses >45 umol/L vs <45 umol/L.",
    whyItMatters: "Used with iron studies to classify the indeterminate ferritin branch.",
    ifAbnormalAskFor: ["Ferritin", "CRP", "Iron", "Transferrin saturation"],
  },
  {
    id: "transferrin_saturation",
    pathway: "anaemia",
    label: "Transferrin Saturation",
    unit: "%",
    normalReference: {
      type: "range",
      low: 20,
      high: 50,
      unit: "%",
    },
    pathwayTrigger: "Microcytic indeterminate ferritin branch uses >20% vs <20%.",
    whyItMatters: "Used alongside iron and TIBC when ferritin is not clearly low.",
    ifAbnormalAskFor: ["Ferritin", "CRP", "Iron", "TIBC"],
  },
  {
    id: "crp",
    pathway: "anaemia",
    label: "CRP",
    unit: "mg/L",
    normalReference: {
      type: "upper-bound",
      high: 10,
      unit: "mg/L",
    },
    pathwayTrigger: "Microcytic indeterminate ferritin branch uses normal CRP vs CRP >30 mg/L.",
    whyItMatters: "CRP helps interpret ferritin because ferritin may rise with inflammation.",
    ifAbnormalAskFor: ["Ferritin", "Iron", "TIBC", "Transferrin saturation"],
  },
  {
    id: "reticulocytes",
    pathway: "anaemia",
    label: "Reticulocytes",
    unit: "x10^9/L",
    normalReference: {
      type: "range",
      low: 25,
      high: 80,
      unit: "x10^9/L",
      note: "Catalogue note: or 0.5-2.5%. The anaemia pathway uses <80 vs >80.",
    },
    pathwayTrigger: "Low reticulocyte branch: <80 x10^9/L / <2%. High reticulocyte branch: >80 x10^9/L / >2%.",
    whyItMatters: "This separates underproduction from haemolysis / haemorrhage branches.",
    ifAbnormalAskFor: ["Bilirubin", "Blood film", "Haemolysis screen"],
  },
  {
    id: "b12",
    pathway: "anaemia",
    label: "Vitamin B12",
    unit: "ng/L",
    normalReference: {
      type: "range",
      low: 170,
      high: 900,
      unit: "ng/L",
    },
    pathwayTrigger: "Low B12 branch: <170 ng/L. Strong suspicion branch: >170 ng/L with strong clinical suspicion.",
    whyItMatters: "This is part of the macrocytic anaemia workup.",
    ifAbnormalAskFor: ["Folate", "Intrinsic factor antibody", "Blood film"],
  },
  {
    id: "folate",
    pathway: "anaemia",
    label: "Serum Folate",
    unit: "ug/L",
    normalReference: {
      type: "lower-bound",
      low: 3,
      unit: "ug/L",
      note: "3-4.5 ug/L is borderline in the catalogue and pathway context.",
    },
    pathwayTrigger: "Folate branch: <3 ug/L, or 3-4.5 ug/L with symptoms.",
    whyItMatters: "This is part of the macrocytic anaemia workup.",
    ifAbnormalAskFor: ["B12", "Coeliac screen"],
  },
  {
    id: "bilirubin",
    pathway: "lft",
    label: "Bilirubin",
    unit: "umol/L",
    normalReference: {
      type: "range",
      low: 3,
      high: 21,
      unit: "umol/L",
      note: "The LFT pathway red-flag threshold is bilirubin >40 umol/L.",
    },
    pathwayTrigger: "Urgent red flag if bilirubin >40 umol/L.",
    whyItMatters: "Bilirubin can send the LFT pathway straight to the urgent branch.",
    ifAbnormalAskFor: ["ALT", "ALP", "AST", "GGT", "Albumin", "FBC", "Reticulocytes", "LDH"],
  },
  {
    id: "alt",
    pathway: "lft",
    label: "ALT",
    unit: "IU/L",
    normalReference: {
      type: "range",
      low: 5,
      high: 40,
      unit: "IU/L",
    },
    pathwayTrigger: "Hepatitic branch if ALT>ALP. Urgent specialist advice if ALT >300 IU/L.",
    whyItMatters: "ALT helps identify the hepatitic pattern and contains an explicit >300 threshold in the pathway.",
    ifAbnormalAskFor: ["AST", "ALP", "GGT", "Bilirubin", "Albumin", "HBsAg", "HCV Ab"],
  },
  {
    id: "ast",
    pathway: "lft",
    label: "AST",
    unit: "IU/L",
    normalReference: {
      type: "range",
      low: 5,
      high: 40,
      unit: "IU/L",
    },
    pathwayTrigger: "Used on repeat testing in the hepatitic branch.",
    whyItMatters: "AST is requested on repeat testing to confirm ongoing abnormality.",
    ifAbnormalAskFor: ["ALT", "ALP", "GGT", "Bilirubin", "Albumin"],
  },
  {
    id: "alp",
    pathway: "lft",
    label: "ALP",
    unit: "IU/L",
    normalReference: {
      type: "range",
      low: 35,
      high: 130,
      unit: "IU/L",
    },
    pathwayTrigger: "Cholestatic branch if ALP>ALT.",
    whyItMatters: "ALP helps identify the cholestatic pattern.",
    ifAbnormalAskFor: ["GGT", "Bilirubin", "Vitamin D", "Bone profile", "Ultrasound"],
  },
  {
    id: "ggt",
    pathway: "lft",
    label: "GGT",
    unit: "IU/L",
    normalReference: {
      type: "range",
      low: 10,
      high: 55,
      unit: "IU/L",
    },
    pathwayTrigger: "Raised GGT supports liver aetiology in the cholestatic branch, but the pathway itself does not define a numeric GGT threshold.",
    whyItMatters: "GGT helps distinguish liver from bone causes of raised ALP.",
    ifAbnormalAskFor: ["ALT", "ALP", "Bilirubin", "Ultrasound"],
  },
  {
    id: "albumin",
    pathway: "lft",
    label: "Albumin",
    unit: "g/L",
    normalReference: {
      type: "range",
      low: 35,
      high: 50,
      unit: "g/L",
    },
    pathwayTrigger: "Low albumin is not a stand-alone pathway trigger, but concerns regarding low albumin may contribute to the urgent red-flag branch.",
    whyItMatters: "Albumin supports the red-flag assessment, but the guideline does not define a stand-alone low albumin threshold for urgent referral.",
    ifAbnormalAskFor: ["INR", "Ultrasound"],
  },
];
