import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMode } from "@/lib/mode";
import type { MvpResult, UrgencyLevel, SynthesisFlag, MissingValueCaveat } from "@/routes/results";

export const Route = createFileRoute("/pathway/anaemia")({
  head: () => ({
    meta: [
      { title: "Anaemia Pathway — NW London ICB | ResultDoctor" },
      {
        name: "description",
        content:
          "Enter any combination of Hb, MCV and ferritin results to get the exact NHS NW London anaemia pathway recommendation.",
      },
      { property: "og:title", content: "Anaemia Pathway · ResultDoctor" },
    ],
  }),
  component: AnaemiaCalculator,
});

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type Sex = "male" | "female";
type YN = "yes" | "no";

// A field can be: a number (entered), "na" (user said Not Available), or undefined (not yet touched)
type FieldValue = number | "na" | undefined;

interface EnteredValues {
  sex?: Sex;
  hb?: FieldValue;
  mcv?: FieldValue;
  ferritin?: FieldValue;
  preMeno?: YN;
  giSymptoms?: YN;
}

type Outcome = "A" | "B" | "C" | "INCOMPLETE";

interface SynthesisResult {
  outcome: Outcome;
  flags: SynthesisFlag[];
  caveats: MissingValueCaveat[];   // warnings about values marked N/A that could change outcome
  reasoning: string;               // plain-English sentence-form reasoning
  missingForDefinitive: string[];  // what's still needed if INCOMPLETE
}

/* ─────────────────────────────────────────────────────────────
   THRESHOLDS
───────────────────────────────────────────────────────────── */

const HB_THRESHOLD: Record<Sex, number> = { male: 130, female: 114 };
const FERRITIN_THRESHOLD: Record<Sex, number> = { male: 20, female: 10 };
const MCV_THRESHOLD = 83.5;

const FLOWSHEET_URL =
  "https://www.nwlondonicb.nhs.uk/application/files/7316/5832/2895/Outpatient_Pathways_NWL_Anaemia_v1_9_7_20.pdf";

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function num(v: FieldValue): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function isNA(v: FieldValue): boolean {
  return v === "na";
}
function hasNum(v: FieldValue): boolean {
  return typeof v === "number";
}

/* ─────────────────────────────────────────────────────────────
   SYNTHESIS ENGINE
   - Accepts any subset of values (number | "na" | undefined)
   - Returns a sentence-form reasoning string
   - Generates caveats for "na" values that could change outcome
───────────────────────────────────────────────────────────── */

function synthesise(v: EnteredValues): SynthesisResult {
  const flags: SynthesisFlag[] = [];
  const caveats: MissingValueCaveat[] = [];
  const missing: string[] = [];
  const sex = v.sex;

  const hb = num(v.hb);
  const mcv = num(v.mcv);
  const ferritin = num(v.ferritin);

  // ── Build interpretation flags ──────────────────────────

  if (hasNum(v.hb) && hb !== undefined) {
    const thresh = sex ? HB_THRESHOLD[sex] : 114;
    const low = hb < thresh;
    flags.push({
      label: "Hb", value: hb, unit: "g/L",
      isAbnormal: low,
      status: "entered",
      interpretation: sex
        ? (low ? `Low at ${hb} g/L — below the anaemia threshold of ${thresh} g/L for ${sex}s` : `Normal at ${hb} g/L — above the anaemia threshold of ${thresh} g/L for ${sex}s`)
        : `${hb} g/L — sex required for threshold`,
    });
  } else if (isNA(v.hb)) {
    flags.push({ label: "Hb", value: null, unit: "g/L", isAbnormal: false, status: "na", interpretation: "Not available" });
  }

  if (hasNum(v.mcv) && mcv !== undefined) {
    const low = mcv < MCV_THRESHOLD;
    const high = mcv > 100;
    flags.push({
      label: "MCV", value: mcv, unit: "fL",
      isAbnormal: low || high,
      status: "entered",
      interpretation: low
        ? `Low at ${mcv} fL — microcytic, consistent with iron deficiency`
        : high
        ? `High at ${mcv} fL — macrocytic, separate pathway applies`
        : `Normal at ${mcv} fL`,
    });
  } else if (isNA(v.mcv)) {
    flags.push({ label: "MCV", value: null, unit: "fL", isAbnormal: false, status: "na", interpretation: "Not available" });
  }

  if (hasNum(v.ferritin) && ferritin !== undefined) {
    const thresh = sex ? FERRITIN_THRESHOLD[sex] : 10;
    const low = ferritin < thresh;
    flags.push({
      label: "Ferritin", value: ferritin, unit: "µg/L",
      isAbnormal: low,
      status: "entered",
      interpretation: sex
        ? (low ? `Low at ${ferritin} µg/L — below the iron deficiency threshold of ${thresh} µg/L for ${sex}s` : `Normal at ${ferritin} µg/L — above the iron deficiency threshold of ${thresh} µg/L for ${sex}s`)
        : `${ferritin} µg/L — sex required for threshold`,
    });
  } else if (isNA(v.ferritin)) {
    flags.push({ label: "Ferritin", value: null, unit: "µg/L", isAbnormal: false, status: "na", interpretation: "Not available" });
  }

  // ── Need sex ─────────────────────────────────────────────

  if (!sex) {
    missing.push("Sex assigned at birth — required to apply correct Hb and ferritin thresholds");
    return { outcome: "INCOMPLETE", flags, caveats, reasoning: "Sex assigned at birth is required before any threshold can be applied. Please select male or female above.", missingForDefinitive: missing };
  }

  const hbThresh = HB_THRESHOLD[sex];
  const ferThresh = FERRITIN_THRESHOLD[sex];

  // ── No values at all (all undefined or all NA) ────────────

  const anyNumericValue = hb !== undefined || mcv !== undefined || ferritin !== undefined;
  if (!anyNumericValue) {
    if (isNA(v.hb) && isNA(v.mcv) && isNA(v.ferritin)) {
      return { outcome: "INCOMPLETE", flags, caveats, reasoning: "All three values have been marked as not available. At least one numeric result is needed to run the pathway.", missingForDefinitive: ["At least one numeric test result"] };
    }
    missing.push("At least one test result — Hb, MCV, or ferritin");
    return { outcome: "INCOMPLETE", flags, caveats, reasoning: "Enter at least one test result to begin.", missingForDefinitive: missing };
  }

  // ── Ferritin only (no Hb, no MCV) ────────────────────────

  if (hb === undefined && mcv === undefined && ferritin !== undefined) {
    if (ferritin >= ferThresh) {
      // Normal ferritin — iron deficiency not confirmed regardless of Hb
      const caveat = isNA(v.hb)
        ? { field: "Hb", message: `Hb was not available. If Hb is below ${hbThresh} g/L, anaemia would be confirmed and further investigation would be warranted even with a normal ferritin.` }
        : null;
      if (caveat) caveats.push(caveat);
      return {
        outcome: "C",
        flags, caveats,
        reasoning: `Ferritin is ${ferritin} µg/L, which is above the iron deficiency threshold of ${ferThresh} µg/L for ${sex}s. Iron deficiency is not confirmed on ferritin alone. Primary care investigation is appropriate. ${isNA(v.hb) ? `Note: Hb was not available — if it is below ${hbThresh} g/L, further assessment would be needed.` : "Adding Hb and MCV would allow a fuller assessment."}`,
        missingForDefinitive: [],
      };
    }
    // Low ferritin — iron deficiency possible but can't confirm anaemia without Hb
    if (!isNA(v.hb)) {
      missing.push(`Hb — to confirm whether anaemia (Hb <${hbThresh} g/L) is present alongside the low ferritin`);
    }
    const caveatMsg = isNA(v.hb)
      ? `Hb was marked as not available. If Hb is below ${hbThresh} g/L, this would confirm iron deficiency anaemia and a specialist referral would be indicated.`
      : `Hb is not yet entered. If Hb is below ${hbThresh} g/L, this would confirm iron deficiency anaemia and a specialist referral would be indicated.`;
    caveats.push({ field: "Hb", message: caveatMsg });

    return {
      outcome: isNA(v.hb) ? "C" : "INCOMPLETE",
      flags, caveats,
      reasoning: `Ferritin is low at ${ferritin} µg/L (threshold: ${ferThresh} µg/L for ${sex}s), suggesting possible iron deficiency. However, Hb${isNA(v.hb) ? " was not available" : " has not been entered"}, so it is not possible to confirm anaemia or determine the appropriate referral pathway. ${isNA(v.hb) ? "A partial result is shown below, but this should be interpreted cautiously." : ""}`,
      missingForDefinitive: missing,
    };
  }

  // ── Hb present ────────────────────────────────────────────

  if (hb !== undefined) {

    if (hb >= hbThresh) {
      // Normal Hb — no anaemia
      const caveatFer = isNA(v.ferritin)
        ? { field: "Ferritin", message: `Ferritin was not available. Even with a normal Hb, a low ferritin (<${ferThresh} µg/L) can indicate iron deficiency requiring monitoring.` }
        : null;
      if (caveatFer) caveats.push(caveatFer);
      return {
        outcome: "C", flags, caveats,
        reasoning: `Hb is ${hb} g/L, which is above the anaemia threshold of ${hbThresh} g/L for ${sex}s. Anaemia is not confirmed. Primary care investigation is appropriate.${caveatFer ? " Note: ferritin was not available — if iron deficiency is suspected clinically, this should be checked." : ""}`,
        missingForDefinitive: [],
      };
    }

    // Low Hb — anaemia confirmed. Now need MCV.
    const hbStatement = `Hb is ${hb} g/L, which is below the anaemia threshold of ${hbThresh} g/L for ${sex}s, confirming anaemia.`;

    if (mcv === undefined) {
      if (!isNA(v.mcv)) {
        missing.push(`MCV — to determine whether the anaemia is microcytic (<${MCV_THRESHOLD} fL), which is the iron deficiency branch`);
      }
      if (isNA(v.mcv)) {
        caveats.push({ field: "MCV", message: `MCV was not available. If MCV is below ${MCV_THRESHOLD} fL (microcytic), this would place the patient on the iron deficiency pathway and ferritin would then be needed to confirm.` });
        return {
          outcome: "INCOMPLETE", flags, caveats,
          reasoning: `${hbStatement} MCV was not available, so the type of anaemia cannot be determined. Without MCV, the appropriate investigation pathway cannot be identified. MCV should be requested.`,
          missingForDefinitive: [`MCV — to classify the anaemia (microcytic <${MCV_THRESHOLD} fL = iron deficiency branch)`],
        };
      }
      return {
        outcome: "INCOMPLETE", flags, caveats,
        reasoning: `${hbStatement} MCV has not been entered — this is needed to determine whether the anaemia is microcytic (iron deficiency pathway) or normocytic/macrocytic (different investigation).`,
        missingForDefinitive: missing,
      };
    }

    // MCV ≥ threshold — not microcytic
    if (mcv >= MCV_THRESHOLD) {
      return {
        outcome: "C", flags, caveats,
        reasoning: `${hbStatement} MCV is ${mcv} fL, which is at or above ${MCV_THRESHOLD} fL — this is not a microcytic anaemia, so the iron deficiency branch does not apply. Primary care investigation including B12, folate, and blood film is appropriate. If MCV is elevated above 100 fL, consider the macrocytosis pathway.`,
        missingForDefinitive: [],
      };
    }

    // Low Hb + microcytic MCV — need ferritin
    const mcvStatement = `MCV is ${mcv} fL (below ${MCV_THRESHOLD} fL), indicating microcytic anaemia consistent with iron deficiency.`;

    if (ferritin === undefined) {
      if (isNA(v.ferritin)) {
        caveats.push({ field: "Ferritin", message: `Ferritin was not available. If ferritin is below ${ferThresh} µg/L, iron deficiency anaemia would be confirmed and a specialist referral would be indicated per the NWL guideline.` });
        return {
          outcome: "INCOMPLETE", flags, caveats,
          reasoning: `${hbStatement} ${mcvStatement} Ferritin was not available. Without ferritin, iron deficiency cannot be confirmed. Ferritin should be requested urgently — if it is below ${ferThresh} µg/L, a specialist referral will be required.`,
          missingForDefinitive: [`Ferritin — to confirm iron deficiency (threshold <${ferThresh} µg/L for ${sex}s)`],
        };
      }
      missing.push(`Ferritin — to confirm iron deficiency (threshold <${ferThresh} µg/L for ${sex}s)`);
      return {
        outcome: "INCOMPLETE", flags, caveats,
        reasoning: `${hbStatement} ${mcvStatement} Ferritin has not been entered — this is needed to confirm iron deficiency before a referral decision can be made.`,
        missingForDefinitive: missing,
      };
    }

    // Ferritin normal despite low Hb + low MCV
    if (ferritin >= ferThresh) {
      return {
        outcome: "C", flags, caveats,
        reasoning: `${hbStatement} ${mcvStatement} However, ferritin is ${ferritin} µg/L, which is above the iron deficiency threshold of ${ferThresh} µg/L for ${sex}s — iron deficiency is not confirmed. Primary care investigation is appropriate.`,
        missingForDefinitive: [],
      };
    }

    // ── IRON DEFICIENCY ANAEMIA CONFIRMED ──────────────────
    const ferStatement = `Ferritin is ${ferritin} µg/L, which is below the iron deficiency threshold of ${ferThresh} µg/L for ${sex}s, confirming iron deficiency.`;
    const confirmed = `${hbStatement} ${mcvStatement} ${ferStatement} Iron deficiency anaemia is therefore confirmed.`;

    if (sex === "male") {
      return {
        outcome: "B", flags, caveats,
        reasoning: `${confirmed} Per the NWL guideline, all men with iron deficiency anaemia require upper and lower GI investigation and referral to the appropriate speciality (gastroenterology, urology).`,
        missingForDefinitive: [],
      };
    }

    // Female — menopausal status
    if (!v.preMeno) {
      missing.push("Menopausal status — the NWL guideline specifies different referral pathways for pre- and post-menopausal women");
      return {
        outcome: "INCOMPLETE", flags, caveats,
        reasoning: `${confirmed} Per the NWL guideline, the referral pathway for women depends on menopausal status. Please answer the question below.`,
        missingForDefinitive: missing,
      };
    }

    if (v.preMeno === "no") {
      return {
        outcome: "B", flags, caveats,
        reasoning: `${confirmed} As a post-menopausal woman, the NWL guideline requires upper and lower GI investigation and referral to the appropriate speciality (gastroenterology, gynaecology, urology).`,
        missingForDefinitive: [],
      };
    }

    // Pre-menopausal — GI symptoms
    if (!v.giSymptoms) {
      missing.push("Whether upper GI symptoms or a family history of colorectal cancer are present");
      return {
        outcome: "INCOMPLETE", flags, caveats,
        reasoning: `${confirmed} As a pre-menopausal woman, the NWL guideline requires one further question to determine whether targeted GI investigation is needed.`,
        missingForDefinitive: missing,
      };
    }

    if (v.giSymptoms === "yes") {
      return {
        outcome: "B", flags, caveats,
        reasoning: `${confirmed} As a pre-menopausal woman with upper GI symptoms or a family history of colorectal cancer, targeted GI investigation and referral to the appropriate speciality is indicated per the NWL guideline.`,
        missingForDefinitive: [],
      };
    }

    // Pre-menopausal, no GI symptoms — haematology
    return {
      outcome: "A", flags, caveats,
      reasoning: `${confirmed} As a pre-menopausal woman without upper GI symptoms or family history of colorectal cancer, the NWL guideline indicates a routine referral to haematology to investigate the cause of the iron deficiency.`,
      missingForDefinitive: [],
    };
  }

  return {
    outcome: "INCOMPLETE", flags, caveats,
    reasoning: "Enter at least one test value to begin.",
    missingForDefinitive: ["At least one test result — Hb, MCV, or ferritin"],
  };
}

/* ─────────────────────────────────────────────────────────────
   OUTCOME CONFIG
───────────────────────────────────────────────────────────── */

const OUTCOME_CONFIG = {
  A: {
    urgency: "routine_referral" as UrgencyLevel,
    clinicianHeadline: "Routine referral to haematology indicated",
    patientHeadline: "Your results suggest iron deficiency anaemia",
    patientSummary: "Your blood results show a pattern consistent with iron deficiency anaemia. Based on the NHS NW London guideline, your doctor should consider referring you to a blood specialist (haematologist) for further investigation.",
    patientAsk: "Based on my results and the NW London ICB Anaemia Pathway guideline, please could you consider a routine referral to haematology?",
    verbatimTitle: "Routine referral to haematology — NWL guideline V1 9/7/20",
    verbatim: [
      "Persistent unexplained Fe deficiency",
      "Anaemia persisting despite adequate treatment of iron deficiency",
      "Patient intolerant of oral iron / requiring parenteral iron",
    ],
    referrals: [{ specialty: "Haematology", timeframe: "Routine", note: "Unexplained iron deficiency" }],
  },
  B: {
    urgency: "urgent_referral" as UrgencyLevel,
    clinicianHeadline: "Refer to appropriate speciality (gastro, gynae, and urology)",
    patientHeadline: "A specialist referral is recommended",
    patientSummary: "Your blood results show iron deficiency anaemia. The NHS NW London guideline recommends finding the source of the iron loss — this usually means being referred to a gut specialist (gastroenterologist) and possibly a urologist or gynaecologist.",
    patientAsk: "Based on my results and the NW London ICB Anaemia Pathway guideline, would you be able to refer me for GI investigation and to the appropriate specialist?",
    verbatimTitle: "Investigation required — NWL guideline V1 9/7/20",
    verbatim: [
      "Upper and lower GI investigation in: all men and post-menopausal women",
      "Targeted GI investigation in pre-menopausal women with upper GI symptoms or FH of colorectal cancer",
      "Refer to appropriate speciality (gastro, gynae, and urology)",
      "Coeliac screen, Urinalysis for occult blood loss",
    ],
    referrals: [
      { specialty: "Gastroenterology", timeframe: "Soon", note: "Upper and lower GI investigation" },
      { specialty: "Urology", timeframe: "Soon", note: "Occult urinary blood loss" },
    ],
  },
  C: {
    urgency: "primary_care" as UrgencyLevel,
    clinicianHeadline: "Appropriate investigation in primary care",
    patientHeadline: "Your GP should run some further tests first",
    patientSummary: "Based on the NHS NW London guideline, your results don't currently meet the threshold for a specialist referral. Your GP should carry out some further background blood tests to get a clearer picture.",
    patientAsk: "Based on my results and the NW London ICB Anaemia Pathway guideline, could we discuss which of the background investigations I still need?",
    verbatimTitle: "Appropriate investigation in primary care — NWL guideline V1 9/7/20",
    verbatim: [
      "Careful history focussing on duration, symptoms, bleeding, diet, drug and family history",
      "Blood film and reticulocyte count",
      "Ferritin, B12, folate (formal iron studies may be more useful than ferritin if there is an inflammatory component)",
      "Immunoglobulins, serum protein electrophoresis, serum free light chains",
      "Renal and liver function",
      "ESR and CRP",
      "Autoimmune screen to exclude chronic inflammation",
    ],
    referrals: [],
  },
};

/* ─────────────────────────────────────────────────────────────
   CONDITIONAL HELPERS
───────────────────────────────────────────────────────────── */

function needsPreMeno(v: EnteredValues): boolean {
  if (v.sex !== "female") return false;
  const hb = num(v.hb); const mcv = num(v.mcv); const ferritin = num(v.ferritin);
  if (hb === undefined || mcv === undefined || ferritin === undefined) return false;
  return hb < HB_THRESHOLD["female"] && mcv < MCV_THRESHOLD && ferritin < FERRITIN_THRESHOLD["female"];
}

function needsGiSymptoms(v: EnteredValues): boolean {
  return needsPreMeno(v) && v.preMeno === "yes";
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */

function AnaemiaCalculator() {
  const { mode } = useMode();
  const navigate = useNavigate();
  const [values, setValues] = useState<EnteredValues>({});

  const synthesis = useMemo(() => synthesise(values), [values]);
  const isComplete = synthesis.outcome !== "INCOMPLETE";

  function patch(update: Partial<EnteredValues>) {
    setValues((prev) => {
      if ("sex" in update) {
        return { sex: update.sex, hb: prev.hb, mcv: prev.mcv, ferritin: prev.ferritin };
      }
      if ("preMeno" in update) {
        return { ...prev, preMeno: update.preMeno, giSymptoms: undefined };
      }
      return { ...prev, ...update };
    });
  }

  function handleSubmit() {
    if (!isComplete) return;
    const cfg = OUTCOME_CONFIG[synthesis.outcome as "A" | "B" | "C"];

    const result: MvpResult = {
      urgency: cfg.urgency,
      clinicianHeadline: cfg.clinicianHeadline,
      patientHeadline: cfg.patientHeadline,
      patientSummary: cfg.patientSummary,
      patientAsk: cfg.patientAsk,
      verbatim: [...cfg.verbatim],
      verbatimTitle: cfg.verbatimTitle,
      referrals: [...cfg.referrals],
      reasoning: synthesis.reasoning,
      caveats: synthesis.caveats,
      source: {
        organisation: "NW London ICB",
        document: "Anaemia Pathway",
        version: "V1 9/7/20",
        flowsheetUrl: FLOWSHEET_URL,
      },
      pathwayId: "nwl-anaemia-v1",
      pathwayTitle: "NWL Anaemia Pathway",
      resultsEntered: synthesis.flags,
    };

    sessionStorage.setItem("rd_result", JSON.stringify(result));
    navigate({ to: "/results" });
  }

  const hasAnyValue = num(values.hb) !== undefined || num(values.mcv) !== undefined || num(values.ferritin) !== undefined || isNA(values.hb) || isNA(values.mcv) || isNA(values.ferritin);

  return (
    <div className="w-full max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-12">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link to="/pathways" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          ← All pathways
        </Link>
        <div className="flex items-center gap-3">
          <a href={FLOWSHEET_URL} target="_blank" rel="noopener noreferrer"
            className="text-[11px] font-semibold text-primary underline underline-offset-2 hover:opacity-70 transition-opacity">
            View flowsheet ↗
          </a>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            NW London ICB
          </span>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mb-1">Anaemia Pathway</h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-lg">
        Enter whichever results you have. If a result wasn't tested, mark it <span className="font-medium text-foreground">N/A</span> — the engine will flag how it affects the result.
      </p>

      {/* SEX */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Sex assigned at birth <span className="text-primary">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {(["male", "female"] as Sex[]).map((s) => (
            <button key={s} onClick={() => patch({ sex: s })}
              className={`px-5 py-3 rounded-[12px] text-sm font-medium capitalize ring-1 transition-all ${
                values.sex === s ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:ring-primary/40"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* TEST VALUES */}
      <div className="bg-card rounded-[16px] ring-1 ring-border p-6 sm:p-7 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Test results</p>
        <p className="text-xs text-muted-foreground mb-5">
          Enter values you have. Use <span className="font-semibold">N/A</span> for results that were not tested — this will generate a caveat on the result page.
        </p>
        <div className="grid grid-cols-3 gap-4 sm:gap-5">
          <FieldInput
            label="Hb"
            unit="g/L"
            min={40} max={220}
            placeholder="e.g. 95"
            hint={mode === "patient" ? "Haemoglobin" : `Anaemia <${values.sex ? HB_THRESHOLD[values.sex] : "130/114"} g/L`}
            value={values.hb}
            onChange={(v) => patch({ hb: v })}
          />
          <FieldInput
            label="MCV"
            unit="fL"
            min={40} max={150}
            placeholder="e.g. 72"
            hint={mode === "patient" ? "Red cell size" : "Microcytic <83.5 fL"}
            value={values.mcv}
            onChange={(v) => patch({ mcv: v })}
          />
          <FieldInput
            label="Ferritin"
            unit="µg/L"
            min={1} max={2000}
            placeholder="e.g. 8"
            hint={mode === "patient" ? "Iron stores" : `Iron def <${values.sex ? FERRITIN_THRESHOLD[values.sex] : "10/20"} µg/L`}
            value={values.ferritin}
            onChange={(v) => patch({ ferritin: v })}
          />
        </div>
      </div>

      {/* CONDITIONAL: Menopausal status */}
      {needsPreMeno(values) && (
        <div className="bg-card rounded-[16px] ring-1 ring-border p-6 mb-4">
          <p className="text-sm font-semibold mb-1">
            {mode === "patient" ? "Are you still having periods (pre-menopausal)?" : "Is the patient pre-menopausal?"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {mode === "patient" ? "Pre-menopausal means you are still having regular periods." : "Determines GI investigation pathway per NWL guideline."}
          </p>
          <ChoicePills value={values.preMeno}
            onChange={(v) => patch({ preMeno: v as YN })}
            options={[{ v: "yes", label: "Yes — pre-menopausal" }, { v: "no", label: "No — post-menopausal" }]} />
        </div>
      )}

      {/* CONDITIONAL: GI symptoms */}
      {needsGiSymptoms(values) && (
        <div className="bg-card rounded-[16px] ring-1 ring-border p-6 mb-4">
          <p className="text-sm font-semibold mb-1">
            {mode === "patient" ? "Upper digestive symptoms or family history of bowel cancer?" : "Upper GI symptoms or family history of colorectal cancer?"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {mode === "patient"
              ? "Upper digestive symptoms: heartburn, indigestion, difficulty swallowing, or persistent nausea."
              : "Per NWL guideline: targeted GI investigation indicated with upper GI symptoms OR FH colorectal cancer."}
          </p>
          <ChoicePills value={values.giSymptoms}
            onChange={(v) => patch({ giSymptoms: v as YN })}
            options={[{ v: "yes", label: "Yes" }, { v: "no", label: "No" }]} />
        </div>
      )}

      {/* LIVE SYNTHESIS */}
      {(hasAnyValue || values.sex) && (
        <div className={`rounded-[14px] p-5 ring-1 mb-6 transition-all ${isComplete ? "bg-primary/5 ring-primary/30" : "bg-muted/30 ring-border"}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            {isComplete ? "✓ Result ready" : "Partial interpretation"}
          </p>
          <p className="text-sm leading-relaxed text-foreground">{synthesis.reasoning}</p>
          {synthesis.missingForDefinitive.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Still needed:</p>
              <ul className="space-y-1.5">
                {synthesis.missingForDefinitive.map((m) => (
                  <li key={m} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5 shrink-0">→</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setValues({})} className="px-5 py-2.5 rounded-[12px] text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Clear all
        </button>
        <button onClick={handleSubmit} disabled={!isComplete}
          className="px-8 py-3 rounded-[12px] text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all shadow-sm">
          {isComplete ? "See full result →" : "Enter values to continue"}
        </button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground text-center leading-relaxed border-t border-border pt-6">
        Anaemia defined as Hb &lt;130 g/L (male) or &lt;114 g/L (female).{" "}
        <a href={FLOWSHEET_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          NW London Outpatient Pathways · V1 / 9/7/20
        </a>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FIELD INPUT — number input + N/A toggle
───────────────────────────────────────────────────────────── */

function FieldInput({
  label, unit, min, max, placeholder, hint, value, onChange,
}: {
  label: string; unit: string; min: number; max: number;
  placeholder: string; hint: string;
  value: FieldValue; onChange: (v: FieldValue) => void;
}) {
  const isNotAvail = value === "na";
  const numVal = typeof value === "number" ? value : undefined;
  const invalid = numVal !== undefined && (Number.isNaN(numVal) || numVal < min || numVal > max);
  const hasValidNum = numVal !== undefined && !invalid;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold text-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground leading-tight min-h-[2.5em]">{hint}</span>

      {!isNotAvail ? (
        <div className={`flex items-center rounded-[10px] ring-1 px-2.5 py-1 mt-1 transition-all ${
          invalid ? "ring-red-400 bg-red-50/30" : hasValidNum ? "ring-primary bg-primary/5" : "ring-border focus-within:ring-primary"
        }`}>
          <input type="number" inputMode="decimal" min={min} max={max} step="0.1"
            value={numVal ?? ""} placeholder={placeholder}
            onChange={(e) => { const r = e.target.value; onChange(r === "" ? undefined : Number(r)); }}
            className="w-0 flex-1 bg-transparent py-2 text-lg font-bold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/25 min-w-0" />
          <span className="text-[10px] font-medium text-muted-foreground shrink-0 ml-1">{unit}</span>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-[10px] ring-1 ring-amber-300 bg-amber-50/60 py-2 mt-1 min-h-[42px]">
          <span className="text-xs font-semibold text-amber-700">Not available</span>
        </div>
      )}

      {invalid && <span className="text-[10px] text-red-500">Valid: {min}–{max}</span>}

      {/* N/A toggle */}
      <button
        onClick={() => onChange(isNotAvail ? undefined : "na")}
        className={`text-[11px] font-medium mt-0.5 text-left transition-colors ${
          isNotAvail ? "text-amber-600 underline underline-offset-2" : "text-muted-foreground hover:text-foreground"
        }`}>
        {isNotAvail ? "↩ Enter value" : "Not available →"}
      </button>
    </div>
  );
}

function ChoicePills<T extends string>({
  value, onChange, options,
}: { value: T | undefined; onChange: (v: T) => void; options: Array<{ v: T; label: string }> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`px-5 py-3 rounded-[12px] text-sm font-medium ring-1 transition-all text-left ${
            value === o.v ? "bg-primary text-primary-foreground ring-primary" : "bg-background ring-border hover:ring-primary/40"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
