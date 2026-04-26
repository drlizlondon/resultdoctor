export type PathwaySourceMeta = {
  organisation: string;
  title: string;
  version: string;
  sourcePageUrl?: string;
  sourcePdfUrl?: string;
};

export type PathwayOutcomeCode =
  | "urgent_admission"
  | "urgent_referral"
  | "urgent_specialist_advice"
  | "repeat_and_reassess"
  | "start_treatment"
  | "arrange_ultrasound"
  | "request_more_tests"
  | "primary_care_investigation"
  | "indeterminate";

export type ExactPathwayResult = {
  headline: string;
  boxes: string[];
  actions: string[];
  notes: string[];
  outcomeCode?: PathwayOutcomeCode;
  ambiguity?: string;
};
