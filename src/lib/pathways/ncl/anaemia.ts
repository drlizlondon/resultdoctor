import type { ExactPathwayResult, PathwaySourceMeta } from "../types";

export type NclAnaemiaMcvBranch = "unknown" | "microcytic" | "normocytic" | "macrocytic";
export type NclAnaemiaReticBranch = "unknown" | "low" | "high";
export type NclAnaemiaExplicitChoice = "unknown" | "yes" | "no";

export type NclAnaemiaFormState = {
  age: string;
  hb: string;
  mcv: string;
  ferritin: string;
  serumIron: string;
  tibc: string;
  transferrinSaturation: string;
  crp: string;
  reticulocytes: string;
  b12: string;
  folate: string;
  verySymptomatic: boolean;
  leukoerythroblasticBloodFilm: boolean;
  unexplainedProgressiveSymptomaticAnaemia: boolean;
  splenomegalyLymphadenopathyOtherCytopenias: boolean;
  suspectedHaematologicalMalignancyOrBloodDisorder: boolean;
  acuteGiBleeding: boolean;
  rectalBleeding: boolean;
  pancytopenia: NclAnaemiaExplicitChoice;
  mcvBranch: NclAnaemiaMcvBranch;
  noKnownInflammatoryStates: NclAnaemiaExplicitChoice;
  symptomsOfB12OrFolateDeficiency: NclAnaemiaExplicitChoice;
  strongClinicalSuspicionForB12Deficiency: NclAnaemiaExplicitChoice;
  reticulocyteBranch: NclAnaemiaReticBranch;
};

export const NCL_ANAEMIA_SOURCE_META: PathwaySourceMeta = {
  organisation: "NCL ICB",
  title: "Abnormal Full Blood Count (FBC) in Adults Primary Care Clinical Pathway - Anaemia",
  version: "Final Version January 2023",
  sourcePageUrl: "https://gps.northcentrallondon.icb.nhs.uk/topics/haematology",
  sourcePdfUrl: "https://gps.northcentrallondon.icb.nhs.uk/clinical-pathways/abnormal-fbc-results-1",
};

export const NCL_ANAEMIA_PRIMARY_CARE_ASSESSMENT = [
  "Symptoms of anaemia such as fatigue, SOBOE, headache, dizziness, cognitive dysfunction, restless leg syndrome.",
  "Any symptoms of bleeding including menstrual history.",
  "PMH including gastritis, IBD, cirrhosis.",
  "Diet, medication-NSAIDs/steroids, alcohol, family history, recent transfusion, travel history, ethnic origin.",
  "Examine for pallor, jaundice, in Fe deficiency – koilonychia, angular cheilosis, glossitis and diffuse and moderate alopecia.",
  "Monitor FBC for trend/evidence of progression over time (depends on severity, but if >100, usually over 3 months).",
  "Rpt FBC, blood film, Reticulocytes, U+Es, Creatinine, LFT, Ferritin*, B12*, Folate*, CRP. *assess in all cases of anaemia irrespective of MCV.",
];

export const DEFAULT_NCL_ANAEMIA_FORM: NclAnaemiaFormState = {
  age: "",
  hb: "",
  mcv: "",
  ferritin: "",
  serumIron: "",
  tibc: "",
  transferrinSaturation: "",
  crp: "",
  reticulocytes: "",
  b12: "",
  folate: "",
  verySymptomatic: false,
  leukoerythroblasticBloodFilm: false,
  unexplainedProgressiveSymptomaticAnaemia: false,
  splenomegalyLymphadenopathyOtherCytopenias: false,
  suspectedHaematologicalMalignancyOrBloodDisorder: false,
  acuteGiBleeding: false,
  rectalBleeding: false,
  pancytopenia: "unknown",
  mcvBranch: "unknown",
  noKnownInflammatoryStates: "unknown",
  symptomsOfB12OrFolateDeficiency: "unknown",
  strongClinicalSuspicionForB12Deficiency: "unknown",
  reticulocyteBranch: "unknown",
};

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveMcvBranch(value: number | null): NclAnaemiaMcvBranch {
  if (value === null) {
    return "unknown";
  }

  if (value < 80) {
    return "microcytic";
  }

  if (value <= 100) {
    return "normocytic";
  }

  return "macrocytic";
}

function deriveReticulocyteBranch(value: number | null): NclAnaemiaReticBranch {
  if (value === null) {
    return "unknown";
  }

  return value < 80 ? "low" : "high";
}

export function computeNclAnaemiaResult(
  form: NclAnaemiaFormState
): ExactPathwayResult {
  const hb = parseNumber(form.hb);
  const mcv = parseNumber(form.mcv);
  const ferritin = parseNumber(form.ferritin);
  const serumIron = parseNumber(form.serumIron);
  const tibc = parseNumber(form.tibc);
  const tsat = parseNumber(form.transferrinSaturation);
  const crp = parseNumber(form.crp);
  const reticulocytes = parseNumber(form.reticulocytes);
  const b12 = parseNumber(form.b12);
  const folate = parseNumber(form.folate);
  const age = parseNumber(form.age);
  const mcvBranch =
    form.mcvBranch !== "unknown" ? form.mcvBranch : deriveMcvBranch(mcv);
  const reticulocyteBranch =
    form.reticulocyteBranch !== "unknown"
      ? form.reticulocyteBranch
      : deriveReticulocyteBranch(reticulocytes);

  if (hb === null) {
    return {
      headline: "Need haemoglobin value",
      boxes: ["1.0 (R)"],
      outcomeCode: "request_more_tests",
      actions: [
        "This pathway applies to Hb <110g/L in men and non-pregnant women (over 15 years of age).",
      ],
      notes: [
        "The PDF does not provide a separate pregnancy pathway here; this tool is for the adult non-pregnant pathway only.",
      ],
    };
  }

  if (hb >= 110) {
    return {
      headline: "Outside the anaemia pathway entry threshold",
      boxes: ["1.0 (R)"],
      outcomeCode: "indeterminate",
      actions: [
        "The anaemia flowchart entry threshold is Hb <110g/L in men and non-pregnant women (over 15 years of age).",
      ],
      notes: [],
    };
  }

  if (
    hb < 50 ||
    form.verySymptomatic ||
    form.leukoerythroblasticBloodFilm ||
    form.unexplainedProgressiveSymptomaticAnaemia ||
    form.splenomegalyLymphadenopathyOtherCytopenias ||
    form.suspectedHaematologicalMalignancyOrBloodDisorder ||
    form.acuteGiBleeding
  ) {
    return {
      headline: "Urgent / admission branch",
      boxes: ["1.0 (R)"],
      outcomeCode: "urgent_admission",
      actions: [
        "If Hb <50g/l or very symptomatic - consider admission.",
        "Urgently/2ww refer to haematology for: Leukoerythroblastic anaemia on blood film; Unexplained progressive symptomatic anaemia; Associated splenomegaly, lymphodenopathy and other cytopenias; Suspected haemotological malignancy or other blood disorders (2WW).",
        "Urgently/2ww refer to GI/Colorectal for: Acute GI bleeding; >60yrs with IDA; <50yrs with IDA and rectal bleeding.",
      ],
      notes: [
        "The GI/colorectal urgent criteria are listed in the same red urgent area of the PDF page.",
      ],
    };
  }

  if (mcvBranch === "unknown") {
    return {
      headline: "Choose the MCV branch from the PDF",
      boxes: ["2.0 (B)", "3.0 (B)", "4.0 (B)"],
      outcomeCode: "request_more_tests",
      actions: [
        "Mean Corpuscular Volume (MCV): MCV <80fl = Microcytic anaemia; MCV 80-100fl = Normocytic anaemia; MCV >100fl = Macrocytic anaemia.",
      ],
      notes: [
        "If you enter an MCV value, the calculator can derive this branch directly from the PDF thresholds.",
      ],
    };
  }

  if (mcvBranch === "microcytic") {
    if (ferritin === null) {
      return {
        headline: "Need ferritin to continue",
        boxes: ["5.0 (B)", "6.0 (B)"],
        outcomeCode: "request_more_tests",
        actions: [
          "Check iron studies and CRP.",
          "Note: Ferritin can be raised in the presence of acute or chronic inflammation, infection, malignant disease or liver disease.",
        ],
        notes: [],
      };
    }

    if (ferritin < 30) {
      const actions = [
        "Iron deficiency anaemia-IDA. See Iron deficiency pathway [1].",
        "Ensure Coeliac screen done if unexplained iron deficiency.",
        "Commence appropriate treatment and monitor response.",
      ];
      const notes = [
        "Other RBC changes that may be seen include reduced mean cell HB (hypochromia), anisocytosis and poikilocytosis.",
      ];

      if (age !== null && age > 60) {
        actions.push("Urgently/2ww refer to GI/Colorectal: >60yrs with IDA.");
        notes.push(
          "The urgent GI/colorectal wording appears in the red urgent area on the PDF page rather than as a separate downstream IDA box."
        );
      }

      if (age !== null && age < 50 && form.rectalBleeding) {
        actions.push("Urgently/2ww refer to GI/Colorectal: <50yrs with IDA and rectal bleeding.");
        notes.push(
          "The urgent GI/colorectal wording appears in the red urgent area on the PDF page rather than as a separate downstream IDA box."
        );
      }

      return {
        headline: "Iron deficiency anaemia",
        boxes: ["6.0 (B)", "7.0 (B)", "40.0 (B)"],
        outcomeCode:
          (age !== null && age > 60) || (age !== null && age < 50 && form.rectalBleeding)
            ? "urgent_referral"
            : "start_treatment",
        actions,
        notes,
      };
    }

    if (ferritin > 150) {
      return {
        headline: "High ferritin >150 mcg/L",
        boxes: ["8.0 (B)", "14.0 (B)"],
        outcomeCode: "primary_care_investigation",
        actions: [
          "High ferritin >150 mcg/L. Interpret with other iron study indices eg transferrin saturation but unlikely iron deficiency.",
          "Non-iron deficient microcytic anaemia or functional iron deficiency.",
          "Consider non-haemotological causes: acute/chronic inflammation, chronic infection, malignancy, liver disease, renal failure, anaemia of chronic disease.",
          "Consider haemotological causes: haemoglobinopathy (eg thalassaemia trait). Screen if no previous Hb electrophoresis and ongoing microcytic parameters with replete Fe stores. Sideroblastic anaemia.",
          "Investigate and manage where appropriate.",
          "Refer to appropriate specialist in secondary care 2ww, urgent, routine where clinically indicated or if remains unexplained.",
          "Consider A&G/ Consultant Connect.",
        ],
        notes: [],
      };
    }

    if (form.noKnownInflammatoryStates === "unknown") {
      return {
        headline: "Need to confirm inflammatory-state branch",
        boxes: ["8.0 (B)", "9.0 (B)"],
        outcomeCode: "request_more_tests",
        actions: [
          "Indeterminate ferritin 30-150 mcg/L with no known inflammatory states.",
        ],
        notes: [
          "The PDF only labels this ferritin 30-150 branch explicitly for patients with no known inflammatory states.",
        ],
      };
    }

    if (form.noKnownInflammatoryStates === "no") {
      return {
        headline: "Indeterminate ferritin branch needs clinical interpretation",
        boxes: ["8.0 (B)", "9.0 (B)"],
        outcomeCode: "indeterminate",
        actions: [
          "Indeterminate ferritin 30-150 mcg/L is described in the PDF specifically for patients with no known inflammatory states.",
        ],
        notes: [
          "The PDF does not provide a separate explicit machine branch for ferritin 30-150 with known inflammatory states.",
        ],
        ambiguity:
          "Ferritin 30-150 with inflammation is not fully specified in the shared anaemia PDF.",
      };
    }

    if (
      crp !== null &&
      serumIron !== null &&
      tsat !== null &&
      tibc !== null &&
      crp <= 30 &&
      serumIron > 7 &&
      tsat > 20 &&
      tibc > 45
    ) {
      return {
        headline: "Iron replete",
        boxes: ["8.0 (B)", "9.0 (B)", "10.0 (B)"],
        outcomeCode: "primary_care_investigation",
        actions: [
          "If CRP normal, Iron >7 umol/L, Iron saturation >20%, TIBC >45 umol/L: Iron replete.",
          "Investigate and manage where appropriate.",
          "Refer to appropriate specialist in secondary care 2ww, urgent, routine where clinically indicated or if remains unexplained.",
          "Consider A&G/ Consultant Connect.",
        ],
        notes: [],
      };
    }

    if (
      crp !== null &&
      serumIron !== null &&
      tsat !== null &&
      tibc !== null &&
      crp > 30 &&
      serumIron < 7 &&
      tsat < 20 &&
      tibc < 45
    ) {
      return {
        headline: "Functional iron deficiency",
        boxes: ["8.0 (B)", "9.0 (B)", "11.0 (B)"],
        outcomeCode: "start_treatment",
        actions: [
          "If CRP >30mg/L, Iron <7 umol/L, Iron saturation <20%, TIBC <45 umol/L: Functional iron deficiency.",
          "Refer to Iron deficiency pathway [1].",
        ],
        notes: [],
      };
    }

    return {
      headline: "Need full iron studies and CRP to complete the indeterminate ferritin branch",
      boxes: ["8.0 (B)", "9.0 (B)"],
      outcomeCode: "request_more_tests",
      actions: [
        "Indeterminate ferritin 30-150 mcg/L with no known inflammatory states.",
        "Need CRP, Iron, Iron saturation and TIBC to decide between iron replete and functional iron deficiency.",
      ],
      notes: [],
    };
  }

  if (mcvBranch === "normocytic") {
    if (form.pancytopenia === "unknown") {
      return {
        headline: "Need to confirm whether pancytopenia is present",
        boxes: ["12.0 (B)", "13.0 (R)", "15.0 (B)"],
        outcomeCode: "request_more_tests",
        actions: [
          "Refer urgently if pancytopenia.",
          "Isolated anaemia.",
        ],
        notes: [
          "The PDF uses the syndrome label 'pancytopenia'. The app does not derive it from a surrogate count.",
        ],
      };
    }

    if (form.pancytopenia === "yes") {
      return {
        headline: "Refer urgently if pancytopenia",
        boxes: ["12.0 (B)", "13.0 (R)"],
        outcomeCode: "urgent_referral",
        actions: [
          "Refer urgently if pancytopenia.",
        ],
        notes: [
          "The PDF uses the syndrome label 'pancytopenia'. It does not define that syndrome numerically inside the anaemia page.",
        ],
      };
    }

    if (reticulocyteBranch === "unknown") {
      return {
        headline: "Need reticulocyte branch",
        boxes: ["12.0 (B)", "15.0 (B)", "16.0 (B)"],
        outcomeCode: "request_more_tests",
        actions: [
          "Isolated anaemia.",
          "Reticulocyte count <80x10^9/l / <2% or Reticulocyte count >80x10^9/l / >2%.",
        ],
        notes: [
          "If you enter a reticulocyte value, the calculator can derive this branch directly from the PDF threshold.",
        ],
      };
    }

    if (reticulocyteBranch === "low") {
      return {
        headline: "Isolated normocytic anaemia with low reticulocyte count",
        boxes: ["15.0 (B)", "16.0 (B)", "17.0 (B)", "18.0 (B)"],
        outcomeCode: "primary_care_investigation",
        actions: [
          "Consider: Iron deficiency; Mixed haematinic deficiency; Non-haematological cause/anaemia of chronic disease; Haematological disorder- eg leukaemia, aplastic anaemia, red cell aplasia, other marrow failure syndromes.",
          "Investigate and manage where appropriate.",
          "Refer to secondary care 2ww, Urgent, routine where clinically indicated or if remains unexplained.",
          "Consider A&G/ Consultant Connect.",
        ],
        notes: [],
      };
    }

    return {
      headline: "Isolated normocytic anaemia with high reticulocyte count",
      boxes: ["15.0 (B)", "19.0 (B)", "20.0 (B)", "21.0 (B)"],
      outcomeCode: "primary_care_investigation",
      actions: [
        "Consider haemorrhage.",
        "Consider haemolysis (bilirubin elevated).",
        "Investigate and manage where appropriate.",
        "Refer to secondary care 2ww, Urgent, routine where clinically indicated or if remains unexplained.",
      ],
      notes: [
        "The PDF text groups haemorrhage and haemolysis as considerations for the raised reticulocyte branch.",
      ],
    };
  }

  if (reticulocyteBranch === "unknown") {
    return {
      headline: "Need reticulocyte branch",
      boxes: ["22.0 (B)", "23.0 (B)", "24.0 (B)", "25.0 (B)"],
      outcomeCode: "request_more_tests",
      actions: [
        "Isolated anaemia.",
        "Reticulocyte count <80x10^9/l / <2% or Reticulocyte count >80x10^9/l / >2%.",
      ],
      notes: [
        "If you enter a reticulocyte value, the calculator can derive this branch directly from the PDF threshold.",
      ],
    };
  }

  if (reticulocyteBranch === "high") {
    return {
      headline: "Macrocytic anaemia with reticulocytosis",
      boxes: ["22.0 (B)", "23.0 (B)", "24.0 (B)"],
      outcomeCode: "primary_care_investigation",
      actions: [
        "Reticulocyte count >80x10^9/l / >2%.",
        "Consider haemorrhage.",
        "Consider haemolysis (bilirubin elevated).",
        "Investigate and manage where appropriate.",
        "Refer to secondary care 2ww, Urgent, routine where clinically indicated or if remains unexplained.",
      ],
      notes: [
        "The reticulocytosis branch indicates macrocytosis may reflect haemolysis or haemorrhage rather than isolated haematinic deficiency.",
      ],
    };
  }

  if (b12 === null || folate === null) {
    return {
      headline: "Need B12 and folate to continue the macrocytic branch",
      boxes: ["25.0 (B)", "27.0 (B)", "29.0 (B)", "33.0 (B)"],
      outcomeCode: "request_more_tests",
      actions: [
        "This branch now depends on B12 and folate results exactly as shown on the PDF.",
      ],
      notes: [],
    };
  }

  if (b12 < 170) {
    if (form.symptomsOfB12OrFolateDeficiency === "unknown") {
      return {
        headline: "Need symptom status for the low B12 branch",
        boxes: ["29.0 (B)", "30.0 (B)", "31.0 (B)", "32.0 (B)"],
        outcomeCode: "request_more_tests",
        actions: [
          "B12 <170ng/l and asymptomatic.",
          "B12 <170ng/l and symptomatic.",
        ],
        notes: [
          "The PDF splits low B12 by whether the patient is symptomatic.",
        ],
      };
    }

    if (form.symptomsOfB12OrFolateDeficiency === "yes") {
      return {
        headline: "B12 <170 ng/L and symptomatic",
        boxes: ["31.0 (B)", "32.0 (B)"],
        outcomeCode: "start_treatment",
        actions: [
          "B12 <170ng/l and symptomatic.",
          "Commence B12 replacement.",
          "See Treatment for Vitamin B12, folate or Iron deficiency [2].",
        ],
        notes: [],
      };
    }

    return {
      headline: "B12 <170 ng/L and asymptomatic",
      boxes: ["29.0 (B)", "30.0 (B)"],
      outcomeCode: "start_treatment",
      actions: [
        "B12 <170ng/l and asymptomatic.",
        "Recheck 2 months. If still low check Intrinsic factor antibody and treat.",
        "Aetiology consider: Gastro-intestinal/malabsorption; Dietary; Medication – colchicine, anticonvulsants, PPIs/H2RA; Pernicious anaemia.",
        "Commence B12 replacement.",
        "See Treatment for Vitamin B12, folate or Iron deficiency [2].",
      ],
      notes: [],
    };
  }

  if (b12 > 170 && form.strongClinicalSuspicionForB12Deficiency === "unknown") {
    return {
      headline: "Need to confirm whether there is strong clinical suspicion for B12 deficiency",
      boxes: ["27.0 (B)", "28.0 (B)"],
      outcomeCode: "request_more_tests",
      actions: [
        "B12 >170ng/l but strong index clinical suspicion check Intrinsic factor antibody.",
        "If positive lifelong B12 replacement.",
      ],
      notes: [
        "This branch only applies if the clinician judges there is strong index clinical suspicion.",
      ],
    };
  }

  if (b12 > 170 && form.strongClinicalSuspicionForB12Deficiency === "yes") {
    return {
      headline: "Strong clinical suspicion despite B12 >170 ng/L",
      boxes: ["27.0 (B)", "28.0 (B)"],
      outcomeCode: "start_treatment",
      actions: [
        "B12 >170ng/l but strong index clinical suspicion check Intrinsic factor antibody.",
        "If positive lifelong B12 replacement.",
      ],
      notes: [],
    };
  }

  if (
    folate < 3 ||
    (folate >= 3 &&
      folate <= 4.5 &&
      form.symptomsOfB12OrFolateDeficiency === "yes")
  ) {
    return {
      headline: "Folate deficiency branch",
      boxes: ["33.0 (B)", "34.0 (B)", "35.0 (B)", "36.0 (B)"],
      outcomeCode: "start_treatment",
      actions: [
        "Serum folate <3ug/l or 3-4.5ug/l and symptomatic.",
        "Aetiology consider: Deficient diet, excess alcohol, malabsorption, medication, metabolic, excess urinary excretion, CHF, chronic dialysis, liver disease.",
        "Ensure B12 normal / Coeliac screen.",
        "If clinical suspicion folate deficiency but normal serum levels, a red cell folate level below 340 nmol/L (150 micrograms/L) is consistent with clinical folate deficiency in the absence of vitamin B12 deficiency.",
        "Folate replacement. Monitor response.",
        "See Treatment for Vitamin B12, folate or Iron deficiency [2].",
      ],
      notes: [],
    };
  }

  if (
    folate >= 3 &&
    folate <= 4.5 &&
    form.symptomsOfB12OrFolateDeficiency === "unknown"
  ) {
    return {
      headline: "Need symptom status for the borderline folate branch",
      boxes: ["33.0 (B)", "34.0 (B)"],
      outcomeCode: "request_more_tests",
      actions: [
        "Serum folate <3ug/l or 3-4.5ug/l and symptomatic.",
      ],
      notes: [
        "The PDF only sends folate 3-4.5ug/L down this branch if the patient is symptomatic.",
      ],
    };
  }

  if (form.symptomsOfB12OrFolateDeficiency === "unknown") {
    return {
      headline: "Need to confirm whether the patient is symptomatic of B12/folate deficiency",
      boxes: ["25.0 (B)", "26.0 (B)", "33.0 (B)", "34.0 (B)"],
      outcomeCode: "request_more_tests",
      actions: [
        "Normal B12/folate and asymptomatic of B12/folate deficiency.",
        "Serum folate <3ug/l or 3-4.5ug/l and symptomatic.",
      ],
      notes: [],
    };
  }

  if (form.symptomsOfB12OrFolateDeficiency === "yes") {
    return {
      headline: "Symptomatic macrocytosis with B12 >170 ng/L and folate not in the folate-deficiency branch",
      boxes: ["27.0 (B)", "33.0 (B)", "34.0 (B)"],
      outcomeCode: "indeterminate",
      actions: [
        "B12 >170ng/l but strong index clinical suspicion check Intrinsic factor antibody. If positive lifelong B12 replacement.",
        "If clinical suspicion folate deficiency but normal serum levels, a red cell folate level below 340 nmol/L (150 micrograms/L) is consistent with clinical folate deficiency in the absence of vitamin B12 deficiency.",
      ],
      notes: [
        "The shared PDF does not provide a separate final destination box for symptomatic patients whose B12 is >170ng/L and whose folate does not meet the explicit folate branch threshold.",
      ],
      ambiguity:
        "Macrocytic symptoms with B12 >170 ng/L and folate outside the explicit folate-deficiency branch are not fully resolved by the supplied anaemia page alone.",
    };
  }

  return {
    headline: "Normal B12/folate and asymptomatic of B12/folate deficiency",
    boxes: ["25.0 (B)", "26.0 (B)", "37.0 (B)", "38.0 (B)"],
    outcomeCode: "primary_care_investigation",
    actions: [
      "Normal B12/folate and asymptomatic of B12/folate deficiency.",
      "Consider Alcohol, Hypothyroidism, drugs, liver disease, pregnancy.",
      "Haematological disorder e.g. MDS, Myeloma.",
      "Investigate and manage where appropriate.",
      "Refer to secondary care 2ww, Urgent, routine where clinically indicated or if remains unexplained.",
      "Consider A&G/ Consultant Connect.",
    ],
    notes: [],
  };
}
