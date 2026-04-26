import type { ExactPathwayResult, PathwaySourceMeta } from "../types";

export type NclLftEntryBranch =
  | "unsure"
  | "isolated_bilirubin"
  | "hepatitic"
  | "cholestatic";

export type NclLftRepeatStatus = "not_done" | "still_abnormal" | "resolved";
export type NclLftUltrasoundStatus =
  | "not_done"
  | "normal"
  | "fatty_liver"
  | "abnormal";
export type NclLftPanelStatus = "not_done" | "normal" | "abnormal";

export type NclLftFormState = {
  bilirubin: string;
  alt: string;
  alp: string;
  ast: string;
  ggt: string;
  jaundice: boolean;
  significantlyAbnormalLfts: boolean;
  concernLowAlbuminOrProlongedInr: boolean;
  suspectedMalignancy: boolean;
  branch: NclLftEntryBranch;
  alcoholOver14Units: boolean;
  ggtRaisedByLab: boolean;
  repeatStatus: NclLftRepeatStatus;
  ultrasoundStatus: NclLftUltrasoundStatus;
  panelStatus: NclLftPanelStatus;
};

export const NCL_LFT_SOURCE_META: PathwaySourceMeta = {
  title: "Adult Abnormal Liver Function Tests Primary Care Clinical Pathway",
  organisation: "NCL ICB",
  version: "Final version February 2023",
  sourcePageUrl: "https://gps.northcentrallondon.icb.nhs.uk/topics/hepatology",
  sourcePdfUrl:
    "https://gps.northcentrallondon.icb.nhs.uk/clinical-pathways/ncl-adult-abnormal-liver-function-tests-primary-care-clinical-pathway",
};

export const DEFAULT_NCL_LFT_FORM: NclLftFormState = {
  bilirubin: "",
  alt: "",
  alp: "",
  ast: "",
  ggt: "",
  jaundice: false,
  significantlyAbnormalLfts: false,
  concernLowAlbuminOrProlongedInr: false,
  suspectedMalignancy: false,
  branch: "unsure",
  alcoholOver14Units: false,
  ggtRaisedByLab: false,
  repeatStatus: "not_done",
  ultrasoundStatus: "not_done",
  panelStatus: "not_done",
};

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isNormal(value: number | null, upperLimit: number) {
  return value === null || value <= upperLimit;
}

export function deriveNclLftBranch(form: NclLftFormState): NclLftEntryBranch {
  const bilirubin = parseNumber(form.bilirubin);
  const alt = parseNumber(form.alt);
  const alp = parseNumber(form.alp);

  if (bilirubin !== null && bilirubin > 21 && isNormal(alt, 40) && isNormal(alp, 130)) {
    return "isolated_bilirubin";
  }

  if (bilirubin !== null && bilirubin <= 21 && alt !== null && alp !== null) {
    if (alt > alp) {
      return "hepatitic";
    }

    if (alp > alt) {
      return "cholestatic";
    }
  }

  return "unsure";
}

export function computeNclLftResult(
  form: NclLftFormState
): ExactPathwayResult {
  const bilirubin = parseNumber(form.bilirubin);
  const alt = parseNumber(form.alt);
  const branch = deriveNclLftBranch(form);

  if (
    form.jaundice ||
    form.significantlyAbnormalLfts ||
    form.concernLowAlbuminOrProlongedInr ||
    form.suspectedMalignancy ||
    (bilirubin !== null && bilirubin > 40)
  ) {
    return {
      headline: "Red flag / urgent branch",
      boxes: ["2.0 (R)", "6.0 (R)"],
      outcomeCode: "urgent_referral",
      actions: [
        "Jaundice (Bil>40) and/or significantly abnormal LFTs and/or concerns re low albumin or prolonged INR (if done) / suspected malignancy.",
        "Urgent Ultrasound and/or Urgent 2 week referral or admission to appropriate specialty.",
      ],
      notes: [
        "The PDF does not define 'significantly abnormal LFTs'.",
        "The PDF does not define a specific albumin or INR threshold for this branch.",
      ],
      ambiguity:
        "This branch is clinician-declared where the PDF does not provide a numeric trigger beyond bilirubin >40.",
    };
  }

  if (branch === "isolated_bilirubin") {
    return {
      headline: "Isolated raised bilirubin with other normal LFTs",
      boxes: ["3.0 (B)", "7.0 (B)", "8.0 (B)", "8.1 (G)"],
      outcomeCode: "repeat_and_reassess",
      actions: [
        "Most commonly due to Gilbert's syndrome (unconjugated hyperbilirubinaemia - affects 5% of the population and is benign).",
        "Less commonly due to haemolysis.",
        "Repeat LFTs fasting sample with split bilirubin and FBC.",
        "Consider reticulocytes and LDH if haemolysis suspected.",
        "If Gilbert's confirmed then inform patient and provide information.",
        "Consider Advice and Guidance if in doubt.",
      ],
      notes: [
        "The supplied PDF does not provide a numeric bilirubin threshold for the isolated bilirubin branch.",
      ],
    };
  }

  if (branch === "hepatitic") {
    if (alt === null) {
      return {
        headline: "Need ALT value to continue",
        boxes: ["4.0 (B)"],
        outcomeCode: "request_more_tests",
        actions: [
          "This branch is: Normal Bilirubin with Hepatitic LFTs (ALT>ALP).",
          "ALT is required because the next split is ALT <300 IU/L versus ALT >300 IU/L.",
        ],
        notes: [],
      };
    }

    if (alt > 300) {
      return {
        headline: "ALT >300 IU/L",
        boxes: ["4.0 (B)", "10.0 (R)", "12.0 (B)", "18.0 (R)"],
        outcomeCode: "urgent_specialist_advice",
        actions: [
          "ALT >300 IU/L.",
          "Seek telephone advice with on-call medical team or hepatology team depending on availability.",
          "Consider urgent referral pathway as clinically appropriate.",
        ],
        notes: [],
      };
    }

    const actions = [
      "ALT <300 IU/L.",
      "Repeat within one month with AST, GGT, FBC to confirm still elevated.",
      "Consider HCV and HBV.",
    ];

    if (form.alcoholOver14Units) {
      actions.push(
        "If alcohol consumption >14U/week advice and review NCL Alcohol Pathway [2]."
      );
    }

    if (form.repeatStatus !== "still_abnormal") {
      return {
        headline: "Hepatitic LFTs — ALT <300 IU/L",
        boxes: ["4.0 (B)", "9.0 (B)"],
        outcomeCode: "repeat_and_reassess",
        actions,
        notes: [
          "The pathway only progresses to Ultrasound and Extended Liver Test Panel if the repeat bloods remain abnormal.",
        ],
      };
    }

    return computePostRepeatActions(
      form,
      ["4.0 (B)", "9.0 (B)", "14.0 (Pi)"],
      actions,
      "Hepatitic LFTs still elevated on repeat"
    );
  }

  if (branch === "cholestatic") {
    const actions = ["Normal Bilirubin with Cholestatic LFTs (ALP>ALT)."];

    if (!form.ggtRaisedByLab) {
      return {
        headline: "Cholestatic pattern without raised GGT",
        boxes: ["5.0 (B)"],
        outcomeCode: "primary_care_investigation",
        actions: [...actions, "Otherwise organise bone aetiology and check Vitamin D."],
        notes: [],
      };
    }

    actions.push("Liver aetiology suggested by raised GGT.");

    if (form.ultrasoundStatus === "not_done") {
      return {
        headline: "Cholestatic LFTs with raised GGT",
        boxes: ["5.0 (B)", "13.0 (Pi)"],
        outcomeCode: "arrange_ultrasound",
        actions: [...actions, "Ultrasound."],
        notes: [],
      };
    }

    return computePostUltrasoundActions(
      form,
      ["5.0 (B)", "13.0 (Pi)"],
      actions
    );
  }

  return {
    headline: "Need more information to determine the route",
    boxes: ["1.0 (B)"],
    outcomeCode: "request_more_tests",
    actions: [
      "Patient has abnormal LFTs: take history and examination with attention to alcohol consumption, metabolic syndrome / BMI, and hepatotoxic drugs.",
      "Test for HBsAg and HCV Ab at this stage.",
      "Then determine whether the pattern is isolated bilirubin, hepatitic (ALT>ALP with normal bilirubin), or cholestatic (ALP>ALT with normal bilirubin).",
    ],
    notes: [
      "The PDF does not give a machine-readable definition of normal versus abnormal ranges for every analyte.",
    ],
  };
}

function computePostRepeatActions(
  form: NclLftFormState,
  boxes: string[],
  existingActions: string[],
  headline: string
): ExactPathwayResult {
  const nextActions = [
    "If abnormal: Ultrasound & request Extended Liver Test Panel.",
    "Extended Liver Test Panel includes: Hepatitis B & C; Autoantibodies (ANA, AMA, smooth muscle Ab, LKM*); Ferritin / Transferrin satn; Caeruloplasmin; Immunoglobulins; A1 antitrypsin; also HBA1c.",
  ];

  if (form.ultrasoundStatus === "abnormal") {
    return liverSpecialistResult([...boxes, "11.0 (Pi)", "17.1 (O)"], [
      ...existingActions,
      ...nextActions,
      "USS abnormal.",
    ]);
  }

  if (form.ultrasoundStatus === "fatty_liver" && form.panelStatus === "normal") {
    return {
      headline: "Fatty liver route",
      boxes: [...boxes, "16.0 (B)"],
      outcomeCode: "primary_care_investigation",
      actions: [
        ...existingActions,
        ...nextActions,
        "Fatty Liver Suggested by USS and Extended Liver Test Panel Negative for other Pathology Page 2 (Fatty Liver).",
      ],
      notes: [
        "The supplied source references a second fatty liver page that is not available in the shared PDF bundle.",
      ],
      ambiguity:
        "Exact downstream fatty liver management cannot be completed from the provided file alone.",
    };
  }

  if (form.ultrasoundStatus === "normal" && form.panelStatus === "normal") {
    return {
      headline: "Isolated raised LFTs with normal USS and panel",
      boxes: [...boxes, "15.0 (B)", "15.1 (G)"],
      outcomeCode: "repeat_and_reassess",
      actions: [
        ...existingActions,
        ...nextActions,
        "Manage in Primary Care: Lifestyle advice and repeat LFTs in 1 year.",
        "If remains abnormal to Advice and Guidance.",
      ],
      notes: [],
    };
  }

  if (form.panelStatus === "abnormal") {
    return liverSpecialistResult([...boxes, "11.0 (Pi)", "17.1 (O)"], [
      ...existingActions,
      ...nextActions,
    ]);
  }

  if (form.ultrasoundStatus === "not_done" || form.panelStatus === "not_done") {
    return {
      headline,
      boxes,
      outcomeCode: "request_more_tests",
      actions: [...existingActions, ...nextActions],
      notes: [],
    };
  }

  return computeAfterPanel(form, [...boxes], [...existingActions, ...nextActions]);
}

function computePostUltrasoundActions(
  form: NclLftFormState,
  boxes: string[],
  existingActions: string[]
): ExactPathwayResult {
  if (form.ultrasoundStatus === "abnormal") {
    return liverSpecialistResult([...boxes, "11.0 (Pi)", "17.1 (O)"], [
      ...existingActions,
      "USS abnormal.",
    ]);
  }

  if (form.ultrasoundStatus === "normal") {
    return computeAfterPanel(form, [...boxes, "14.0 (Pi)"], [
      ...existingActions,
      "USS normal.",
      "Ultrasound & request Extended Liver Test Panel.",
      "Extended Liver Test Panel includes: Hepatitis B & C; Autoantibodies (ANA, AMA, smooth muscle Ab, LKM*); Ferritin / Transferrin satn; Caeruloplasmin; Immunoglobulins; A1 antitrypsin; also HBA1c.",
    ]);
  }

  if (form.ultrasoundStatus === "fatty_liver") {
    return {
      headline: "Fatty liver route",
      boxes: [...boxes, "16.0 (B)"],
      outcomeCode: "primary_care_investigation",
      actions: [
        ...existingActions,
        "Fatty Liver Suggested by USS and Extended Liver Test Panel Negative for other Pathology Page 2 (Fatty Liver).",
      ],
      notes: [
        "The supplied PDF references a Fatty Liver page 2 route, but that downstream page content was not provided in the source file shared for this build.",
      ],
      ambiguity:
        "Downstream fatty liver management cannot be expanded further from the supplied PDF alone.",
    };
  }

  return {
    headline: "Need ultrasound result",
    boxes,
    outcomeCode: "arrange_ultrasound",
    actions: [...existingActions, "Ultrasound is the next explicit step in the pathway."],
    notes: [],
  };
}

function computeAfterPanel(
  form: NclLftFormState,
  boxes: string[],
  existingActions: string[]
): ExactPathwayResult {
  if (form.panelStatus === "abnormal") {
    return liverSpecialistResult([...boxes, "11.0 (Pi)", "17.1 (O)"], existingActions);
  }

  if (form.panelStatus === "normal" && form.ultrasoundStatus === "fatty_liver") {
    return {
      headline: "Fatty liver route",
      boxes: [...boxes, "16.0 (B)"],
      outcomeCode: "primary_care_investigation",
      actions: [
        ...existingActions,
        "Fatty Liver Suggested by USS and Extended Liver Test Panel Negative for other Pathology Page 2 (Fatty Liver).",
      ],
      notes: [
        "The supplied source references a second fatty liver page that is not available in the shared PDF bundle.",
      ],
      ambiguity:
        "Exact downstream fatty liver management cannot be completed from the provided file alone.",
    };
  }

  if (form.panelStatus === "normal" && form.ultrasoundStatus === "normal") {
    return {
      headline: "Isolated raised LFTs with normal USS and panel",
      boxes: [...boxes, "15.0 (B)", "15.1 (G)"],
      outcomeCode: "repeat_and_reassess",
      actions: [
        ...existingActions,
        "Manage in Primary Care: Lifestyle advice and repeat LFTs in 1 year.",
        "If remains abnormal to Advice and Guidance.",
      ],
      notes: [],
    };
  }

  return {
    headline: "Need extended liver panel result",
    boxes,
    outcomeCode: "request_more_tests",
    actions: [
      ...existingActions,
      "The next explicit branch depends on whether the extended liver panel is normal or abnormal.",
    ],
    notes: [],
  };
}

function liverSpecialistResult(
  boxes: string[],
  existingActions: string[]
): ExactPathwayResult {
  return {
    headline: "Abnormal USS appearances and/or abnormal liver test panel",
    boxes,
    outcomeCode: "request_more_tests",
    actions: [
      ...existingActions,
      "If clinically appropriate, seek Advice and Guidance before formal referral.",
      "Refer to Liver Specialist for possible:",
      "Viral Hepatitis.",
      "ALD with Advanced Fibrosis.",
      "PSC, PBC, Autoimmune Hepatitis.",
      "Gallstone disease.",
      "Hepatic Vascular Disorders.",
      "Hepatic Metabolic Disorders.",
    ],
    notes: [
      "Investigations should be within 6 months of date of referral.",
    ],
  };
}
