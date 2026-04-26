import type { ExactPathwayResult } from "./pathways/types";
import type { LivePathwayInput, ReferenceRange } from "./live-pathway-inputs";

export type ReferenceSex = "female" | "male";

export type ReferenceAssessment = {
  status: "normal" | "low" | "high" | "unknown" | "needs_sex_context";
  label: string;
  detail: string;
};

export type InterpretationSummary = {
  tone: "neutral" | "success" | "warning" | "danger";
  badge: string;
  actionTitle: string;
  actionDetail: string;
  summary: string;
};

export type PatientGuidance = {
  title: string;
  summary: string;
  nextStep: string;
};

export function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRange(range: ReferenceRange, sex?: ReferenceSex) {
  if (range.type === "range") {
    return `${range.low}-${range.high} ${range.unit}`;
  }

  if (range.type === "lower-bound") {
    return `>=${range.low} ${range.unit}`;
  }

  if (range.type === "upper-bound") {
    return `<=${range.high} ${range.unit}`;
  }

  if (!sex) {
    return `sex-specific ${range.unit}`;
  }

  const selected = range[sex];
  return `${selected.low}-${selected.high} ${range.unit}`;
}

export function assessReference(
  input: LivePathwayInput,
  value: string,
  sex?: ReferenceSex
): ReferenceAssessment {
  const numeric = parseNumber(value);

  if (numeric === null) {
    return {
      status: "unknown",
      label: "Not entered",
      detail: `Reference ${formatRange(input.normalReference, sex)}`,
    };
  }

  if (input.normalReference.type === "sex-specific-range" && !sex) {
    return {
      status: "needs_sex_context",
      label: "Needs sex",
      detail: `Reference depends on sex: ${formatRange(input.normalReference)}`,
    };
  }

  if (input.normalReference.type === "range") {
    if (numeric < input.normalReference.low) {
      return {
        status: "low",
        label: "Low",
        detail: `${numeric} ${input.unit} is below ${input.normalReference.low} ${input.unit}.`,
      };
    }

    if (numeric > input.normalReference.high) {
      return {
        status: "high",
        label: "High",
        detail: `${numeric} ${input.unit} is above ${input.normalReference.high} ${input.unit}.`,
      };
    }
  }

  if (input.normalReference.type === "lower-bound" && numeric < input.normalReference.low) {
    return {
      status: "low",
      label: "Low",
      detail: `${numeric} ${input.unit} is below ${input.normalReference.low} ${input.unit}.`,
    };
  }

  if (input.normalReference.type === "upper-bound" && numeric > input.normalReference.high) {
    return {
      status: "high",
      label: "High",
      detail: `${numeric} ${input.unit} is above ${input.normalReference.high} ${input.unit}.`,
    };
  }

  if (input.normalReference.type === "sex-specific-range" && sex) {
    const selected = input.normalReference[sex];
    if (numeric < selected.low) {
      return {
        status: "low",
        label: "Low",
        detail: `${numeric} ${input.unit} is below the ${sex} reference of ${selected.low} ${input.unit}.`,
      };
    }

    if (numeric > selected.high) {
      return {
        status: "high",
        label: "High",
        detail: `${numeric} ${input.unit} is above the ${sex} reference of ${selected.high} ${input.unit}.`,
      };
    }
  }

  return {
    status: "normal",
    label: "Normal",
    detail: `${numeric} ${input.unit} is within the reference range ${formatRange(
      input.normalReference,
      sex
    )}.`,
  };
}

export function buildInterpretationSummary(result: ExactPathwayResult): InterpretationSummary {
  switch (result.outcomeCode) {
    case "urgent_admission":
      return {
        tone: "danger",
        badge: "Urgent admission / urgent referral",
        actionTitle: "Recommended action",
        actionDetail: "Arrange urgent admission or urgent same-day specialist assessment as directed by the pathway.",
        summary: `Current pathway conclusion: ${result.headline}.`,
      };
    case "urgent_referral":
      return {
        tone: "warning",
        badge: "Urgent pathway action",
        actionTitle: "Recommended action",
        actionDetail: "Arrange urgent referral or urgent imaging as directed by the pathway.",
        summary: `Current pathway conclusion: ${result.headline}.`,
      };
    case "urgent_specialist_advice":
      return {
        tone: "warning",
        badge: "Urgent specialist advice",
        actionTitle: "Recommended action",
        actionDetail: "Seek urgent specialist advice before continuing.",
        summary: `Current pathway conclusion: ${result.headline}.`,
      };
    case "start_treatment":
      return {
        tone: "success",
        badge: "Treatment pathway",
        actionTitle: "Recommended action",
        actionDetail: "Start the treatment named by the pathway and arrange the listed monitoring or follow-up.",
        summary: `Current pathway conclusion: ${result.headline}.`,
      };
    case "repeat_and_reassess":
      return {
        tone: "neutral",
        badge: "Repeat and reassess",
        actionTitle: "Recommended action",
        actionDetail: "Repeat the listed tests in the timeframe stated by the pathway and then reassess.",
        summary: `Current pathway conclusion: ${result.headline}.`,
      };
    case "arrange_ultrasound":
      return {
        tone: "neutral",
        badge: "Arrange ultrasound",
        actionTitle: "Recommended action",
        actionDetail: "Arrange the ultrasound named by the pathway and continue once the result is available.",
        summary: `Current pathway conclusion: ${result.headline}.`,
      };
    case "request_more_tests":
      return {
        tone: "neutral",
        badge: "More tests needed",
        actionTitle: "Recommended action",
        actionDetail: "Add the missing tests or clinician confirmations needed to complete this branch.",
        summary: `Current pathway conclusion: ${result.headline}.`,
      };
    case "primary_care_investigation":
      return {
        tone: "success",
        badge: "Primary care investigation",
        actionTitle: "Recommended action",
        actionDetail: "Continue primary care investigation and follow the pathway's next listed actions.",
        summary: `Current pathway conclusion: ${result.headline}.`,
      };
  }

  return {
    tone: "neutral",
    badge: result.headline,
    actionTitle: "Recommended action",
    actionDetail: result.actions[0] ?? "Follow the current pathway output.",
    summary: `Current pathway conclusion: ${result.headline}.`,
  };
}

export function buildPatientGuidance(
  result: ExactPathwayResult,
  nextNeeds: Array<{ title: string; detail: string }>
): PatientGuidance {
  const nextNeed = nextNeeds[0];

  switch (result.outcomeCode) {
    case "urgent_admission":
      return {
        title: "Needs urgent medical review",
        summary: "This result pattern needs urgent same-day clinical attention.",
        nextStep:
          nextNeed?.detail ??
          "Contact the clinical team urgently so they can follow the pathway's urgent next step.",
      };
    case "urgent_referral":
      return {
        title: "Needs urgent specialist action",
        summary: "This result pattern points to an urgent referral or urgent imaging step.",
        nextStep:
          nextNeed?.detail ??
          "The next step is urgent specialist follow-up in line with the pathway.",
      };
    case "urgent_specialist_advice":
      return {
        title: "Needs urgent specialist advice",
        summary: "This result pattern needs same-day specialist advice before the pathway continues.",
        nextStep:
          nextNeed?.detail ??
          "The next step is to ask the clinician to get urgent specialist advice.",
      };
    case "start_treatment":
      return {
        title: "Treatment branch reached",
        summary: "This branch points to treatment and follow-up rather than simple observation.",
        nextStep:
          nextNeed?.detail ??
          "The next step is to follow the treatment and monitoring plan named by the pathway.",
      };
    case "repeat_and_reassess":
      return {
        title: "Repeat testing is needed",
        summary: "This branch usually means the blood tests should be repeated before moving further.",
        nextStep:
          nextNeed?.detail ??
          "The next step is to repeat the tests in the timeframe given by the pathway.",
      };
    case "arrange_ultrasound":
      return {
        title: "Imaging is the next step",
        summary: "This branch points to an ultrasound before the pathway can continue.",
        nextStep:
          nextNeed?.detail ??
          "The next step is to arrange the ultrasound requested by the pathway.",
      };
    case "request_more_tests":
      return {
        title: "More information is needed",
        summary: "There is not enough information yet to finish this pathway branch safely.",
        nextStep:
          nextNeed?.detail ??
          "The next step is to add the missing blood tests or clinician checks.",
      };
    case "primary_care_investigation":
      return {
        title: "Routine follow-up is likely",
        summary: "This branch points to further investigation or management rather than immediate emergency action.",
        nextStep:
          nextNeed?.detail ??
          "The next step is to continue the routine investigations listed by the pathway.",
      };
    default:
      return {
        title: "Clinical review is needed",
        summary: "This result needs clinician review because the pathway cannot finish this branch from the current information alone.",
        nextStep:
          nextNeed?.detail ??
          "The next step is to review the missing details and continue the pathway carefully.",
      };
  }
}
