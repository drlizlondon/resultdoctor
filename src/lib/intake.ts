import { LIVE_PATHWAY_INPUTS } from "./live-pathway-inputs";
import { assessReference, type ReferenceSex } from "./pathway-interpretation";

export type IntakeTestKey = "hb" | "ferritin" | "mcv" | "bilirubin" | "alt" | "alp";

export type IntakeFieldState = {
  value: string;
  flaggedAbnormal: boolean;
};

export type IntakeState = Record<IntakeTestKey, IntakeFieldState>;

export type IntakeMatch = {
  id: "anaemia" | "lft";
  title: string;
  subtitle: string;
  to: string;
  search: Record<string, string>;
  whyMatched: string[];
  nextSteps: string[];
};

export const DEFAULT_INTAKE_STATE: IntakeState = {
  hb: { value: "", flaggedAbnormal: false },
  ferritin: { value: "", flaggedAbnormal: false },
  mcv: { value: "", flaggedAbnormal: false },
  bilirubin: { value: "", flaggedAbnormal: false },
  alt: { value: "", flaggedAbnormal: false },
  alp: { value: "", flaggedAbnormal: false },
};

export const INTAKE_TESTS: Array<{
  key: IntakeTestKey;
  label: string;
  unit: string;
  helper: string;
}> = [
  {
    key: "hb",
    label: "Haemoglobin",
    unit: "g/L",
    helper: "Below 110 g/L enters the adult anaemia pathway.",
  },
  {
    key: "ferritin",
    label: "Ferritin",
    unit: "mcg/L",
    helper: "Useful when iron deficiency is suspected or ferritin has been reported as abnormal.",
  },
  {
    key: "mcv",
    label: "MCV",
    unit: "fL",
    helper: "Used inside the anaemia pathway to split microcytic, normocytic, and macrocytic branches.",
  },
  {
    key: "bilirubin",
    label: "Bilirubin",
    unit: "umol/L",
    helper: "Above 40 umol/L enters the urgent LFT branch.",
  },
  {
    key: "alt",
    label: "ALT",
    unit: "IU/L",
    helper: "Useful when ALT has been reported abnormal or when the hepatitic branch is suspected.",
  },
  {
    key: "alp",
    label: "ALP",
    unit: "IU/L",
    helper: "Useful when ALP has been reported abnormal or when the cholestatic branch is suspected.",
  },
];

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const DEFAULT_REFERENCE_SEX: ReferenceSex = "female";

function getInput(id: string) {
  return LIVE_PATHWAY_INPUTS.find((entry) => entry.id === id);
}

function isReferenceAbnormal(id: string, value: string) {
  const input = getInput(id);
  if (!input) {
    return false;
  }

  const assessment = assessReference(input, value, DEFAULT_REFERENCE_SEX);
  return assessment.status === "low" || assessment.status === "high";
}

export function getIntakeMatches(state: IntakeState): IntakeMatch[] {
  const matches: IntakeMatch[] = [];
  const hb = parseNumber(state.hb.value);
  const ferritin = parseNumber(state.ferritin.value);
  const mcv = parseNumber(state.mcv.value);
  const bilirubin = parseNumber(state.bilirubin.value);
  const alt = parseNumber(state.alt.value);
  const alp = parseNumber(state.alp.value);

  const anaemiaReasons: string[] = [];
  const anaemiaNext: string[] = [];

  if (hb !== null && hb < 110) {
    anaemiaReasons.push("Haemoglobin is below 110 g/L, which enters the adult anaemia pathway.");
  }

  if (state.ferritin.flaggedAbnormal) {
    anaemiaReasons.push("Ferritin has been reported as abnormal, which can be relevant to iron deficiency and anaemia assessment.");
  } else if (ferritin !== null && (ferritin < 30 || isReferenceAbnormal("ferritin", state.ferritin.value))) {
    anaemiaReasons.push("Ferritin is below 30 mcg/L, which is an explicit low ferritin branch inside the microcytic anaemia pathway.");
  }

  if ((state.mcv.flaggedAbnormal || isReferenceAbnormal("mcv", state.mcv.value)) && hb !== null && hb < 110) {
    anaemiaReasons.push("MCV is abnormal and helps split the anaemia pathway branch once low haemoglobin is confirmed.");
  }

  if (anaemiaReasons.length > 0) {
    if (!state.hb.value.trim()) {
      anaemiaNext.push("Add haemoglobin to confirm whether this enters the anaemia pathway.");
    }
    if (!state.mcv.value.trim()) {
      anaemiaNext.push("Add MCV to split the anaemia pathway into microcytic, normocytic, or macrocytic branches.");
    }
    if (!state.ferritin.value.trim()) {
      anaemiaNext.push("Add ferritin because it is assessed in all anaemia cases.");
    }
    if (state.ferritin.flaggedAbnormal && !state.hb.value.trim()) {
      anaemiaNext.unshift("If ferritin is the only abnormal result you know, the next most useful tests are haemoglobin and MCV.");
    }

    matches.push({
      id: "anaemia",
      title: "Anaemia",
      subtitle: "Low haemoglobin and iron-deficiency workup",
      to: "/pathway/anaemia",
      search: {
        hb: state.hb.value,
        ferritin: state.ferritin.value,
        mcv: state.mcv.value,
      },
      whyMatched: anaemiaReasons,
      nextSteps: anaemiaNext.length > 0 ? anaemiaNext : ["Open the pathway to continue with the live anaemia workup."],
    });
  }

  const lftReasons: string[] = [];
  const lftNext: string[] = [];

  if (bilirubin !== null && bilirubin > 40) {
    lftReasons.push("Bilirubin is above 40 umol/L, which enters the urgent LFT branch.");
  } else if (state.bilirubin.flaggedAbnormal) {
    lftReasons.push("Bilirubin has been reported as abnormal, which may be relevant to the LFT pathway.");
  }

  if (state.alt.flaggedAbnormal || isReferenceAbnormal("alt", state.alt.value)) {
    lftReasons.push("ALT is abnormal, which may be relevant to the hepatitic branch.");
  }

  if (state.alp.flaggedAbnormal || isReferenceAbnormal("alp", state.alp.value)) {
    lftReasons.push("ALP is abnormal, which may be relevant to the cholestatic branch.");
  }

  if (lftReasons.length > 0) {
    if (!state.bilirubin.value.trim()) {
      lftNext.push("Add bilirubin because bilirubin above 40 umol/L changes the pathway immediately.");
    }
    if (!state.alt.value.trim()) {
      lftNext.push("Add ALT to help identify whether the hepatitic branch may apply.");
    }
    if (!state.alp.value.trim()) {
      lftNext.push("Add ALP to help identify whether the cholestatic branch may apply.");
    }
    if (!state.alt.value.trim() || !state.alp.value.trim()) {
      lftNext.push("If the report only says a liver test is abnormal, the next most useful values are bilirubin, ALT, and ALP.");
    }

    matches.push({
      id: "lft",
      title: "Abnormal LFTs",
      subtitle: "Abnormal liver blood test workup",
      to: "/pathway/lft",
      search: {
        bilirubin: state.bilirubin.value,
        alt: state.alt.value,
        alp: state.alp.value,
      },
      whyMatched: lftReasons,
      nextSteps: lftNext.length > 0 ? lftNext : ["Open the pathway to continue with the live liver pathway workup."],
    });
  }

  return matches;
}
