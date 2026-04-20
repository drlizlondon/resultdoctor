/**
 * ResultDoctor — Core Type Definitions
 *
 * This file is the single source of truth for all data structures.
 * The engine, catalogue, pathways and UI all derive from these types.
 *
 * Design principles:
 * - Pathway logic lives in DATA (JSON), not in code
 * - The engine is generic — it reads pathway definitions and runs them
 * - Every clinical statement is attributed to a source
 * - Every pathway has a version, effective date and review date
 * - Nothing hard-coded that a clinician might need to update
 */

// ─────────────────────────────────────────────────────────────
// RESULT STATE
// ─────────────────────────────────────────────────────────────

/** Three-state result — distinguishes "not entered yet" from "test not done" */
export type ResultState =
  | { status: "known"; value: number }
  | { status: "unknown" }   // might exist — system should ask
  | { status: "not_done" }; // test was not ordered

export type Sex = "male" | "female";
export type Mode = "patient" | "clinician";

/** The complete set of results a user has entered in a session */
export type ResultsMap = Record<string, ResultState>;

/** A single entered result with metadata */
export interface EnteredResult {
  testId: string;
  value: number;
  enteredAt: number; // timestamp
}

// ─────────────────────────────────────────────────────────────
// RESULTS CATALOGUE
// ─────────────────────────────────────────────────────────────

/** Normal range — can vary by sex and/or age */
export interface NormalRange {
  low?: number;
  high?: number;
  sexSpecific?: {
    male?: { low?: number; high?: number };
    female?: { low?: number; high?: number };
  };
  ageSpecific?: Array<{
    minAge?: number;
    maxAge?: number;
    low?: number;
    high?: number;
  }>;
  unit: string;
  note?: string; // e.g. "Reference range varies by laboratory"
}

/** A test in the results catalogue */
export interface CatalogueTest {
  id: string;                    // e.g. "hb", "mcv", "tsh"
  label: string;                 // clinical label: "Haemoglobin"
  abbreviation: string;          // "Hb"
  patientLabel: string;          // plain English for patient mode
  patientExplanation: string;    // "This measures the amount of red blood cells..."
  unit: string;                  // "g/L"
  inputRange: { min: number; max: number }; // valid entry range for UI validation
  normalRange: NormalRange;

  /**
   * Tests that typically appear on the same report.
   * If the user enters one, the system knows to ask for the others.
   * e.g. Hb → also ask for MCV, WBC, platelets (same FBC report)
   */
  groupedWith: string[];
  groupLabel?: string; // "Full Blood Count (FBC)"

  /**
   * Which pathways this test triggers, depending on direction of abnormality.
   * The engine uses this to identify candidate pathways from entered results.
   */
  feedsPathways: {
    low?: string[];   // pathway IDs triggered when value is below normal
    high?: string[];  // pathway IDs triggered when value is above normal
    any?: string[];   // pathway IDs triggered regardless of direction
  };

  /**
   * When this test is low, which other tests should the system request?
   * These are drawn from the relevant guideline's investigation list.
   */
  whenLow_requestAlso?: string[];
  whenHigh_requestAlso?: string[];
  whenAbnormal_requestAlso?: string[]; // regardless of direction

  /** Whether this test requires sex to interpret */
  requiresSex?: boolean;
}

// ─────────────────────────────────────────────────────────────
// PATHWAY DEFINITION
// ─────────────────────────────────────────────────────────────

export interface PathwaySource {
  organisation: string;       // "NCL ICB"
  document: string;           // "Abnormal FBC in Adults — Primary Care Clinical Pathway"
  version: string;            // "Final Version January 2023"
  effectiveDate: string;      // ISO date: "2023-01-01"
  reviewDate: string;         // ISO date: "2026-01-01"
  reviewOverdue?: boolean;     // computed at runtime
  url?: string;
  contactEmail?: string;
  approvedBy?: string;        // "NCL ICB CAG"
  authors?: string[];
}

export interface PathwayVersion {
  version: string;
  effectiveDate: string;
  changedFields: string[];
  changeNote: string;
  approvedBy?: string;
}

export type UrgencyLevel =
  | "emergency"        // same-day admission / call on-call
  | "urgent_2ww"       // two-week wait referral
  | "urgent"           // urgent but not 2WW
  | "routine_referral" // routine outpatient referral
  | "primary_care"     // manage in primary care, no referral
  | "monitor"          // watch and wait, repeat tests
  | "reassure";        // normal / no action needed

export interface ReferralRecommendation {
  specialty: string;           // "haematology", "gastroenterology", etc.
  urgency: UrgencyLevel;
  verbatim: string;            // exact words from the guideline
  source: string;              // pathway ID this came from
  conditions?: string;         // any conditions on the referral
}

export interface InvestigationItem {
  testId?: string;             // links to catalogue if known
  label: string;               // display label
  verbatim?: string;           // exact wording from guideline
  source: string;              // pathway ID this came from
  rationale?: string;          // why this test is needed
  priority?: "essential" | "recommended" | "consider";
}

/** An outcome node — a terminal node in the decision tree */
export interface OutcomeNode {
  id: string;
  type: "outcome";
  urgency: UrgencyLevel;

  /** Clinical headline — verbatim from guideline */
  verbatim: string;

  /** For patient mode — plain English summary */
  patientSummary?: string;

  referrals: ReferralRecommendation[];
  investigations: InvestigationItem[];

  /** Specific actions (e.g. "admit if unstable", "call on-call haematologist") */
  actions?: Array<{
    label: string;
    urgency: UrgencyLevel;
    verbatim: string;
  }>;

  /** Red flag conditions that escalate this outcome */
  redFlags?: string[];

  /** Free text notes from the guideline */
  notes?: string[];
}

/** A condition used in branching — evaluates against the results map */
export interface Condition {
  test: string;               // test ID
  operator: "<" | "<=" | ">" | ">=" | "==" | "!=" | "between";
  value?: number;
  valueHigh?: number;         // for "between"
  sexSpecific?: {
    male?: number;
    female?: number;
  };
}

/** A branch in a decision node */
export interface Branch {
  condition?: Condition | Condition[]; // undefined = else/default branch
  conditionOperator?: "AND" | "OR";   // how to combine multiple conditions
  label?: string;                     // human-readable branch label
  next: string;                       // ID of next node
}

/** A branching node — routes to different nodes based on test values */
export interface BranchNode {
  id: string;
  type: "branch";
  description?: string;
  requiresTest: string;       // the test this branches on
  missingTestAction?: "ask" | "skip" | "partial_outcome"; // what to do if test not entered
  branches: Branch[];
}

/** A question node — asks the user a non-numeric question */
export interface QuestionNode {
  id: string;
  type: "question";
  clinicianQuestion: string;
  patientQuestion: string;
  patientHelp?: string;
  options: Array<{
    value: string;
    label: string;
    patientLabel?: string;
    next: string;
  }>;
}

/** An information node — shows context before continuing */
export interface InfoNode {
  id: string;
  type: "info";
  title: string;
  content: string[];          // list of bullet points from guideline
  verbatim?: string;
  next: string;
}

export type PathwayNode = OutcomeNode | BranchNode | QuestionNode | InfoNode;

/** The complete pathway definition — lives in a JSON file */
export interface PathwayDefinition {
  id: string;                 // unique: "ncl-fbc-anaemia-v2"
  slug: string;               // URL-friendly: "ncl/fbc-anaemia"
  title: string;              // "Anaemia"
  subtitle?: string;          // "Haemoglobin below normal"
  category: PathwayCategory;
  source: PathwaySource;
  versionHistory: PathwayVersion[];

  /** Tests that can trigger this pathway */
  triggerTests: string[];

  /** Condition that must be true to enter this pathway */
  triggerCondition: Condition | Condition[];
  triggerConditionOperator?: "AND" | "OR";

  /**
   * Tests the guideline says should be done as part of initial workup.
   * The challenge system uses these to ask for missing results.
   */
  requiredTests: string[];       // essential per guideline
  recommendedTests: string[];    // guideline says "consider"

  /** The entry point node ID */
  entryNode: string;

  /** All nodes in this pathway */
  nodes: PathwayNode[];

  /** Background information shown before the pathway starts */
  background?: {
    definition?: string;         // e.g. "Anaemia is defined as Hb <110 g/L..."
    causes?: string[];
    symptoms?: string[];
    primaryCareAssessment?: string[];
  };

  /** Whether this pathway is available in the app */
  available: boolean;
  comingSoon?: boolean;

  /** Plain English label for patient mode */
  patientTitle?: string;
  patientDescription?: string;
  clinicianDescription?: string;
}

export type PathwayCategory =
  | "All"
  | "Anaemia & Iron"
  | "White Cells"
  | "Platelets"
  | "Liver & Metabolic"
  | "Thyroid"
  | "Serious Flags"
  | "Symptoms";

// ─────────────────────────────────────────────────────────────
// CROSS-PATHWAY RULES
// ─────────────────────────────────────────────────────────────

/**
 * Rules that fire when MULTIPLE pathways are triggered simultaneously.
 * These encode the clinical insight that combinations are more significant
 * than individual abnormalities.
 *
 * Source: "Abnormalities affecting more than one cell type are more likely
 * to be due to bone marrow causes rather than reactive."
 * — NCL Abnormal FBC in Adults, January 2023
 */
export interface CrossPathwayRule {
  id: string;
  description: string;
  clinicalRationale: string;   // the "why" — attributed to source
  source: string;              // guideline this is drawn from
  verbatim?: string;           // exact words from guideline if available

  /** Conditions that trigger this rule */
  triggers: {
    /** All of these pathways must be active */
    requireAll?: string[];
    /** At least N of these pathways must be active */
    requireAny?: { pathways: string[]; minCount: number };
    /** Additional result conditions */
    resultConditions?: Condition[];
  };

  /** What this rule does when triggered */
  effects: {
    /** Override the urgency level across all affected pathways */
    upgradeUrgencyTo?: UrgencyLevel;
    /** Add a referral that supersedes individual pathway referrals */
    addReferral?: Omit<ReferralRecommendation, "source">;
    /** Add investigations to the consolidated list */
    addInvestigations?: InvestigationItem[];
    /** Add a warning message to the output */
    addWarning?: string;
    /** Override the primary specialty for referral */
    primarySpecialty?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// CHALLENGE SYSTEM
// ─────────────────────────────────────────────────────────────

export interface ChallengeRound {
  round: number;
  trigger: "pathway_identified" | "initial_output_generated";
  message: {
    clinician: string;
    patient: string;
  };
  /** Which tests to request — can reference pathway.requiredTests */
  requestTests: "pathway.requiredTests" | "tests_that_would_change_urgency" | string[];
  /** Whether to show what impact having the test would have */
  showImpact: boolean;
  /** Label for the "skip" button */
  skipLabel: string;
}

// ─────────────────────────────────────────────────────────────
// ENGINE OUTPUTS
// ─────────────────────────────────────────────────────────────

/** The result of running a single pathway */
export interface PathwayResult {
  pathwayId: string;
  pathwayTitle: string;
  source: PathwaySource;
  outcome: OutcomeNode;
  nodesTraversed: string[];
  missingTests: string[];      // tests that would have changed the outcome
  notDoneTests: string[];      // tests the guideline recommends but weren't ordered
}

/** The synthesised output across all triggered pathways */
export interface SynthesisResult {
  /** Highest urgency across all pathways + cross-pathway rules */
  overallUrgency: UrgencyLevel;

  /** Whether urgency was escalated by a cross-pathway rule */
  urgencyEscalated: boolean;
  urgencyEscalationReason?: string;

  /** Individual pathway results */
  pathwayResults: PathwayResult[];

  /** Cross-pathway rules that fired */
  crossPathwayRulesApplied: CrossPathwayRule[];

  /** Deduplicated, merged referral list */
  consolidatedReferrals: Array<
    ReferralRecommendation & {
      sources: string[];       // which pathways recommended this
      crossPathwayRule?: string; // if added by a cross-pathway rule
    }
  >;

  /** Deduplicated, merged investigation list */
  consolidatedInvestigations: Array<
    InvestigationItem & {
      sources: string[];       // which pathways recommended this
      priority: "essential" | "recommended" | "consider";
    }
  >;

  /** Gap analysis — what's missing and why it matters */
  gaps: Array<{
    testId: string;
    testLabel: string;
    status: "unknown" | "not_done";
    wouldChangeUrgency: boolean;
    wouldChangeReferral: boolean;
    wouldChangeInvestigations: boolean;
    requestedBy: string[];     // pathway IDs that need this test
  }>;

  /** Results entered by the user, for display in the summary */
  resultsEntered: EnteredResult[];

  /** Metadata */
  generatedAt: number;         // timestamp
  sessionId: string;
}

// ─────────────────────────────────────────────────────────────
// SOURCE REGISTRY (Multi-tenant)
// ─────────────────────────────────────────────────────────────

export interface GuidelineSource {
  id: string;                  // "ncl", "nwl", "your-icb"
  name: string;                // "NCL ICB"
  fullName: string;            // "North Central London Integrated Care Board"
  logoUrl?: string;
  primaryColour?: string;
  pathwayIds: string[];        // pathways belonging to this source
  contactEmail?: string;
  websiteUrl?: string;
  available: boolean;
  comingSoon?: boolean;
  tier: "nhs_icb" | "nhs_trust" | "private"; // for pricing/B2B model
}
