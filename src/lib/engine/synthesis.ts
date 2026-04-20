/**
 * ResultDoctor — Synthesis Engine
 *
 * Takes the results from multiple individual pathways and produces
 * one consolidated, deduplicated, prioritised output.
 *
 * This is the core intelligence of ResultDoctor — the thing that
 * makes it more than a digital version of a paper flowsheet.
 *
 * Responsibilities:
 * 1. Run the router — identify which pathways are triggered by entered results
 * 2. Run each pathway — traverse the decision tree
 * 3. Apply cross-pathway rules — fire rules for combinations
 * 4. Synthesise output — deduplicate, resolve urgency, consolidate referrals
 * 5. Generate gap analysis — what results are missing and why they matter
 * 6. Generate challenge questions — what to ask the user for next
 */

import type {
  ResultsMap,
  PathwayResult,
  SynthesisResult,
  UrgencyLevel,
  ReferralRecommendation,
  InvestigationItem,
  EnteredResult,
  PathwayDefinition,
  OutcomeNode,
  BranchNode,
  QuestionNode,
  CrossPathwayRule,
  Sex,
} from "../../types";

import { catalogueById, classifyResult, getChallengeTests } from "../catalogue/results-catalogue";
import { getApplicableRules } from "../catalogue/cross-pathway-rules";

// ─────────────────────────────────────────────────────────────
// URGENCY ORDERING
// ─────────────────────────────────────────────────────────────

const URGENCY_ORDER: UrgencyLevel[] = [
  "emergency",
  "urgent_2ww",
  "urgent",
  "routine_referral",
  "primary_care",
  "monitor",
  "reassure",
];

export function resolveHighestUrgency(levels: UrgencyLevel[]): UrgencyLevel {
  if (levels.length === 0) return "primary_care";
  return levels.reduce((highest, current) => {
    const highestIndex = URGENCY_ORDER.indexOf(highest);
    const currentIndex = URGENCY_ORDER.indexOf(current);
    return currentIndex < highestIndex ? current : highest;
  });
}

export function urgencyLabel(level: UrgencyLevel): string {
  const labels: Record<UrgencyLevel, string> = {
    emergency: "EMERGENCY — Same-day admission",
    urgent_2ww: "URGENT — Two-week wait referral",
    urgent: "URGENT",
    routine_referral: "ROUTINE REFERRAL",
    primary_care: "PRIMARY CARE — No referral needed yet",
    monitor: "MONITOR — Watch and wait",
    reassure: "NORMAL — No action needed",
  };
  return labels[level];
}

export function urgencyColour(level: UrgencyLevel): "red" | "amber" | "green" {
  if (level === "emergency" || level === "urgent_2ww" || level === "urgent") return "red";
  if (level === "routine_referral" || level === "primary_care") return "amber";
  return "green";
}

// ─────────────────────────────────────────────────────────────
// PATHWAY ROUTER
// Identifies which pathways are triggered by the entered results
// ─────────────────────────────────────────────────────────────

export function routeToPathways(
  results: ResultsMap,
  sex: Sex | undefined,
  allPathways: PathwayDefinition[]
): PathwayDefinition[] {
  const triggered: PathwayDefinition[] = [];

  for (const pathway of allPathways) {
    if (!pathway.available) continue;

    // Check if any trigger test is abnormal in the direction that triggers this pathway
    for (const testId of pathway.triggerTests) {
      const state = results[testId];
      if (!state || state.status !== "known") continue;

      const test = catalogueById[testId];
      if (!test) continue;

      const direction = classifyResult(test, state.value, sex);
      if (direction === "normal") continue;

      // Check if this direction triggers this pathway
      const pathwayTriggeredByLow = test.feedsPathways.low?.includes(pathway.id);
      const pathwayTriggeredByHigh = test.feedsPathways.high?.includes(pathway.id);
      const pathwayTriggeredByAny = test.feedsPathways.any?.includes(pathway.id);

      if (
        (direction === "low" && pathwayTriggeredByLow) ||
        (direction === "high" && pathwayTriggeredByHigh) ||
        pathwayTriggeredByAny
      ) {
        if (!triggered.includes(pathway)) {
          triggered.push(pathway);
        }
      }
    }
  }

  return triggered;
}

// ─────────────────────────────────────────────────────────────
// DECISION TREE TRAVERSAL
// Runs a single pathway and returns its outcome
// ─────────────────────────────────────────────────────────────

export function runPathway(
  pathway: PathwayDefinition,
  results: ResultsMap,
  sex: Sex | undefined
): PathwayResult {
  const nodesTraversed: string[] = [];
  const missingTests: string[] = [];

  let currentNodeId = pathway.entryNode;
  let outcomeNode: OutcomeNode | null = null;
  let safetyCounter = 0;

  while (!outcomeNode && safetyCounter < 50) {
    safetyCounter++;
    const node = pathway.nodes.find((n) => n.id === currentNodeId);

    if (!node) break;
    nodesTraversed.push(node.id);

    if (node.type === "outcome") {
      outcomeNode = node;
      break;
    }

    if (node.type === "branch") {
      const branchNode = node as BranchNode;
      const state = results[branchNode.requiresTest];

      // If the required test is missing
      if (!state || state.status === "unknown") {
        missingTests.push(branchNode.requiresTest);

        // Find the most conservative (highest urgency) outcome reachable
        // from any branch — return that as a partial outcome
        if (branchNode.missingTestAction === "partial_outcome") {
          const partialOutcome = findMostUrgentReachableOutcome(pathway, branchNode);
          if (partialOutcome) {
            outcomeNode = {
              ...partialOutcome,
              notes: [
                ...(partialOutcome.notes ?? []),
                `Note: ${catalogueById[branchNode.requiresTest]?.label ?? branchNode.requiresTest} was not available. This outcome reflects the most cautious interpretation.`,
              ],
            };
          }
          break;
        }

        // Default: use the first/default branch
        const defaultBranch = branchNode.branches.find((b) => !b.condition);
        if (defaultBranch) {
          currentNodeId = defaultBranch.next;
        } else {
          break;
        }
        continue;
      }

      if (state.status === "not_done") {
        missingTests.push(branchNode.requiresTest);
      }

      const value = state.status === "known" ? state.value : undefined;

      // Find matching branch
      let matchedBranch = null;
      for (const branch of branchNode.branches) {
        if (!branch.condition) {
          // Default branch — use if nothing else matches
          if (!matchedBranch) matchedBranch = branch;
          continue;
        }

        if (value !== undefined && evaluateCondition(branch.condition, value, sex)) {
          matchedBranch = branch;
          break;
        }
      }

      if (matchedBranch) {
        currentNodeId = matchedBranch.next;
      } else {
        break;
      }
    }

    if (node.type === "question") {
      // Questions require user input — handled by the UI
      // The engine stops here and the UI resumes traversal
      break;
    }

    if (node.type === "info") {
      currentNodeId = node.next;
    }
  }

  // Determine tests the guideline requires that aren't in the results
  const notDoneTests = pathway.requiredTests.filter((testId) => {
    const state = results[testId];
    return !state || state.status === "not_done";
  });

  return {
    pathwayId: pathway.id,
    pathwayTitle: pathway.title,
    source: pathway.source,
    outcome: outcomeNode ?? createDefaultOutcome(pathway),
    nodesTraversed,
    missingTests,
    notDoneTests,
  };
}

function evaluateCondition(
  condition: { test: string; operator: string; value?: number; valueHigh?: number; sexSpecific?: { male?: number; female?: number } },
  value: number,
  sex?: Sex
): boolean {
  let threshold = condition.value;

  // Use sex-specific threshold if available
  if (condition.sexSpecific && sex) {
    threshold = condition.sexSpecific[sex] ?? threshold;
  }

  if (threshold === undefined) return false;

  switch (condition.operator) {
    case "<": return value < threshold;
    case "<=": return value <= threshold;
    case ">": return value > threshold;
    case ">=": return value >= threshold;
    case "==": return value === threshold;
    case "!=": return value !== threshold;
    case "between":
      return condition.valueHigh !== undefined
        ? value >= threshold && value <= condition.valueHigh
        : false;
    default: return false;
  }
}

function findMostUrgentReachableOutcome(
  pathway: PathwayDefinition,
  _branchNode: BranchNode
): OutcomeNode | null {
  const outcomes = pathway.nodes.filter(
    (n): n is OutcomeNode => n.type === "outcome"
  );
  if (outcomes.length === 0) return null;

  return outcomes.reduce((mostUrgent, current) => {
    const currentIndex = URGENCY_ORDER.indexOf(current.urgency);
    const mostUrgentIndex = URGENCY_ORDER.indexOf(mostUrgent.urgency);
    return currentIndex < mostUrgentIndex ? current : mostUrgent;
  });
}

function createDefaultOutcome(pathway: PathwayDefinition): OutcomeNode {
  return {
    id: "default",
    type: "outcome",
    urgency: "primary_care",
    verbatim: "Further assessment required in primary care. Please discuss with your GP.",
    referrals: [],
    investigations: pathway.requiredTests.map((testId) => ({
      testId,
      label: catalogueById[testId]?.label ?? testId,
      source: pathway.id,
      priority: "essential" as const,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// SYNTHESIS ENGINE
// Combines multiple pathway results into one consolidated output
// ─────────────────────────────────────────────────────────────

export function synthesise(
  pathwayResults: PathwayResult[],
  crossPathwayRules: CrossPathwayRule[],
  results: ResultsMap,
  sex: Sex | undefined,
  enteredResults: EnteredResult[]
): SynthesisResult {
  const activePathwayIds = pathwayResults.map((r) => r.pathwayId);

  // Build numeric results map for rule evaluation
  const numericResults: Record<string, number> = {};
  for (const [testId, state] of Object.entries(results)) {
    if (state.status === "known") numericResults[testId] = state.value;
  }

  // Apply cross-pathway rules
  const applicableRules = getApplicableRules(activePathwayIds, numericResults);

  // Collect all urgency levels
  const allUrgencies: UrgencyLevel[] = [
    ...pathwayResults.map((r) => r.outcome.urgency),
    ...applicableRules
      .map((r) => r.effects.upgradeUrgencyTo)
      .filter((u): u is UrgencyLevel => u !== undefined),
  ];

  const overallUrgency = resolveHighestUrgency(allUrgencies);
  const baseUrgency = resolveHighestUrgency(
    pathwayResults.map((r) => r.outcome.urgency)
  );
  const urgencyEscalated = overallUrgency !== baseUrgency;
  const escalatingRule = applicableRules.find(
    (r) => r.effects.upgradeUrgencyTo === overallUrgency
  );

  // Consolidate referrals
  const consolidatedReferrals = consolidateReferrals(
    pathwayResults,
    applicableRules
  );

  // Consolidate investigations
  const consolidatedInvestigations = consolidateInvestigations(
    pathwayResults,
    applicableRules
  );

  // Generate gap analysis
  const gaps = generateGapAnalysis(pathwayResults, results);

  return {
    overallUrgency,
    urgencyEscalated,
    urgencyEscalationReason: urgencyEscalated && escalatingRule
      ? escalatingRule.verbatim ?? escalatingRule.description
      : undefined,
    pathwayResults,
    crossPathwayRulesApplied: applicableRules,
    consolidatedReferrals,
    consolidatedInvestigations,
    gaps,
    resultsEntered: enteredResults,
    generatedAt: Date.now(),
    sessionId: crypto.randomUUID(),
  };
}

function consolidateReferrals(
  pathwayResults: PathwayResult[],
  rules: CrossPathwayRule[]
): SynthesisResult["consolidatedReferrals"] {
  // Collect all referrals with their sources
  const allReferrals: Array<ReferralRecommendation & { sources: string[]; crossPathwayRule?: string }> = [];

  for (const result of pathwayResults) {
    for (const referral of result.outcome.referrals) {
      const existing = allReferrals.find(
        (r) => r.specialty === referral.specialty
      );
      if (existing) {
        existing.sources.push(result.pathwayId);
        // Upgrade urgency if this referral is more urgent
        const existingIndex = URGENCY_ORDER.indexOf(existing.urgency);
        const newIndex = URGENCY_ORDER.indexOf(referral.urgency);
        if (newIndex < existingIndex) {
          existing.urgency = referral.urgency;
          existing.verbatim = referral.verbatim;
        }
      } else {
        allReferrals.push({ ...referral, sources: [result.pathwayId] });
      }
    }
  }

  // Add referrals from cross-pathway rules
  for (const rule of rules) {
    if (rule.effects.addReferral) {
      const referral = {
        ...rule.effects.addReferral,
        source: "cross-pathway",
      };
      const existing = allReferrals.find(
        (r) => r.specialty === referral.specialty
      );
      if (existing) {
        existing.crossPathwayRule = rule.id;
        const existingIndex = URGENCY_ORDER.indexOf(existing.urgency);
        const newIndex = URGENCY_ORDER.indexOf(referral.urgency);
        if (newIndex < existingIndex) {
          existing.urgency = referral.urgency;
          existing.verbatim = referral.verbatim;
        }
      } else {
        allReferrals.push({
          ...referral,
          sources: [],
          crossPathwayRule: rule.id,
        });
      }
    }
  }

  // Sort by urgency
  return allReferrals.sort((a, b) => {
    return URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency);
  });
}

function consolidateInvestigations(
  pathwayResults: PathwayResult[],
  rules: CrossPathwayRule[]
): SynthesisResult["consolidatedInvestigations"] {
  const seen = new Map<string, SynthesisResult["consolidatedInvestigations"][0]>();

  const addInvestigation = (
    item: InvestigationItem,
    source: string
  ) => {
    // Use testId as key if available, otherwise label
    const key = item.testId ?? item.label.toLowerCase().replace(/\s+/g, "_");

    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
      // Upgrade priority if needed
      const priorityOrder = ["essential", "recommended", "consider"];
      const existingPriorityIndex = priorityOrder.indexOf(existing.priority);
      const newPriorityIndex = priorityOrder.indexOf(item.priority ?? "consider");
      if (newPriorityIndex < existingPriorityIndex) {
        existing.priority = item.priority ?? "consider";
      }
    } else {
      seen.set(key, {
        ...item,
        priority: item.priority ?? "consider",
        sources: [source],
      });
    }
  };

  // Collect from pathway outcomes
  for (const result of pathwayResults) {
    for (const inv of result.outcome.investigations) {
      addInvestigation(inv, result.pathwayId);
    }
  }

  // Collect from cross-pathway rules
  for (const rule of rules) {
    for (const inv of rule.effects.addInvestigations ?? []) {
      addInvestigation(inv, `cross-pathway:${rule.id}`);
    }
  }

  // Sort: essential first, then recommended, then consider
  const priorityOrder = ["essential", "recommended", "consider"];
  return [...seen.values()].sort((a, b) => {
    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
  });
}

function generateGapAnalysis(
  pathwayResults: PathwayResult[],
  results: ResultsMap
): SynthesisResult["gaps"] {
  const gapMap = new Map<string, SynthesisResult["gaps"][0]>();

  for (const result of pathwayResults) {
    // Missing tests (unknown — might have been done)
    for (const testId of result.missingTests) {
      const state = results[testId];
      const status = state?.status === "not_done" ? "not_done" : "unknown";

      if (gapMap.has(testId)) {
        gapMap.get(testId)!.requestedBy.push(result.pathwayId);
      } else {
        gapMap.set(testId, {
          testId,
          testLabel: catalogueById[testId]?.label ?? testId,
          status,
          wouldChangeUrgency: true,   // Conservative: assume missing tests could change urgency
          wouldChangeReferral: true,
          wouldChangeInvestigations: false,
          requestedBy: [result.pathwayId],
        });
      }
    }

    // Not done tests (guideline recommends but weren't ordered)
    for (const testId of result.notDoneTests) {
      if (gapMap.has(testId)) {
        const existing = gapMap.get(testId)!;
        existing.status = "not_done";
        existing.requestedBy.push(result.pathwayId);
      } else {
        gapMap.set(testId, {
          testId,
          testLabel: catalogueById[testId]?.label ?? testId,
          status: "not_done",
          wouldChangeUrgency: false,
          wouldChangeReferral: false,
          wouldChangeInvestigations: true,
          requestedBy: [result.pathwayId],
        });
      }
    }
  }

  return [...gapMap.values()];
}

// ─────────────────────────────────────────────────────────────
// CHALLENGE SYSTEM
// Determines what to ask the user for next
// ─────────────────────────────────────────────────────────────

export interface ChallengeQuestion {
  testId: string;
  testLabel: string;
  patientExplanation: string;
  unit: string;
  reason: string;           // why we're asking
  couldChangeUrgency: boolean;
  couldChangeReferral: boolean;
  groupLabel?: string;      // e.g. "These all come on your FBC report"
}

/**
 * Round 1: Based on entered results, what grouped tests should we ask for?
 * (Tests that likely appear on the same report)
 */
export function getChallengeRound1(
  enteredTestIds: string[],
  results: ResultsMap
): ChallengeQuestion[] {
  const toAsk = new Set<string>();

  for (const testId of enteredTestIds) {
    const challengeTests = getChallengeTests(testId, "low"); // direction doesn't matter for grouping
    for (const id of challengeTests) {
      const state = results[id];
      if (!state || state.status === "unknown") {
        toAsk.add(id);
      }
    }
  }

  return [...toAsk]
    .map((testId) => {
      const test = catalogueById[testId];
      if (!test) return null;
      return {
        testId,
        testLabel: test.label,
        patientExplanation: test.patientExplanation,
        unit: test.unit,
        reason: `This test usually appears on the same report as ${enteredTestIds
          .map((id) => catalogueById[id]?.abbreviation)
          .filter(Boolean)
          .join(", ")}.`,
        couldChangeUrgency: true,
        couldChangeReferral: true,
        groupLabel: test.groupLabel,
      };
    })
    .filter((q): q is ChallengeQuestion => q !== null);
}

/**
 * Round 2: After initial output, what tests would specifically change the result?
 */
export function getChallengeRound2(
  synthesis: SynthesisResult,
  results: ResultsMap
): ChallengeQuestion[] {
  return synthesis.gaps
    .filter((gap) => gap.status === "unknown")
    .filter((gap) => gap.wouldChangeUrgency || gap.wouldChangeReferral)
    .map((gap) => {
      const test = catalogueById[gap.testId];
      if (!test) return null;
      return {
        testId: gap.testId,
        testLabel: test.label,
        patientExplanation: test.patientExplanation,
        unit: test.unit,
        reason: gap.wouldChangeUrgency
          ? "Having this result could change the urgency of the recommendation."
          : "Having this result could change which specialist you should see.",
        couldChangeUrgency: gap.wouldChangeUrgency,
        couldChangeReferral: gap.wouldChangeReferral,
        groupLabel: test.groupLabel,
      };
    })
    .filter((q): q is ChallengeQuestion => q !== null);
}
