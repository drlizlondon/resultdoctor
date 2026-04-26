import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMode } from "@/lib/mode";
import { z } from "zod";
import { LIVE_PATHWAY_INPUTS } from "@/lib/live-pathway-inputs";
import { assessReference, type ReferenceSex } from "@/lib/pathway-interpretation";
import {
  extractPathwayPriorityCodes,
  PATHWAY_PRIORITY_LABELS,
} from "@/lib/pathway-priority";
import {
  computeNclAnaemiaResult,
  DEFAULT_NCL_ANAEMIA_FORM,
  type NclAnaemiaExplicitChoice,
  type NclAnaemiaFormState,
  type NclAnaemiaMcvBranch,
  NCL_ANAEMIA_PRIMARY_CARE_ASSESSMENT,
  NCL_ANAEMIA_SOURCE_META,
  type NclAnaemiaReticBranch,
} from "@/lib/pathways/ncl/anaemia";

const anaemiaSearchSchema = z.object({
  age: z.string().optional(),
  hb: z.string().optional(),
  mcv: z.string().optional(),
  ferritin: z.string().optional(),
});

export const Route = createFileRoute("/pathway/anaemia")({
  validateSearch: anaemiaSearchSchema,
  component: AnaemiaPathwayPage,
});

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveMcvBranch(form: NclAnaemiaFormState): NclAnaemiaMcvBranch {
  if (form.mcvBranch !== "unknown") {
    return form.mcvBranch;
  }

  const mcv = parseNumber(form.mcv);
  if (mcv === null) {
    return "unknown";
  }

  if (mcv < 80) return "microcytic";
  if (mcv <= 100) return "normocytic";
  return "macrocytic";
}

function resolveReticulocyteBranch(form: NclAnaemiaFormState): NclAnaemiaReticBranch {
  if (form.reticulocyteBranch !== "unknown") {
    return form.reticulocyteBranch;
  }

  const reticulocytes = parseNumber(form.reticulocytes);
  if (reticulocytes === null) {
    return "unknown";
  }

  return reticulocytes < 80 ? "low" : "high";
}

type InputFieldConfig = {
  key: keyof NclAnaemiaFormState;
  label: string;
  helper: string;
};

type NextNeed = {
  title: string;
  detail: string;
};

type ResultStatusCard = {
  label: string;
  statusLabel: string;
  detail: string;
};

const ANAEMIA_BASE_FIELDS: InputFieldConfig[] = [
  { key: "hb", label: "Hb (g/L)", helper: "Needed to know whether this enters the anaemia pathway." },
  { key: "ferritin", label: "Ferritin (mcg/L)", helper: "Useful if iron deficiency is suspected." },
  { key: "mcv", label: "MCV (fL)", helper: "MCV splits the pathway into microcytic, normocytic, and macrocytic anaemia." },
  { key: "age", label: "Age", helper: "Needed for the urgent GI wording in iron deficiency anaemia." },
];

const ANAEMIA_MICROCYTIC_FIELDS: InputFieldConfig[] = [
  { key: "crp", label: "CRP (mg/L)", helper: "Needed if ferritin is 30-150 mcg/L." },
  { key: "serumIron", label: "Iron (umol/L)", helper: "Needed if ferritin is 30-150 mcg/L." },
  { key: "transferrinSaturation", label: "Iron saturation (%)", helper: "Needed if ferritin is 30-150 mcg/L." },
  { key: "tibc", label: "TIBC (umol/L)", helper: "Needed if ferritin is 30-150 mcg/L." },
];

const ANAEMIA_RETIC_FIELD: InputFieldConfig = {
  key: "reticulocytes",
  label: "Reticulocytes (x10^9/L)",
  helper: "Needed in normocytic and macrocytic branches.",
};

const ANAEMIA_MACRO_FIELDS: InputFieldConfig[] = [
  { key: "b12", label: "B12 (ng/L)", helper: "Needed in the macrocytic pathway." },
  { key: "folate", label: "Folate (ug/L)", helper: "Needed in the macrocytic pathway." },
];

const ANAEMIA_REFERENCE_INPUTS: Partial<Record<keyof NclAnaemiaFormState, string>> = {
  hb: "hb",
  mcv: "mcv",
  ferritin: "ferritin",
  serumIron: "serum_iron",
  tibc: "tibc",
  transferrinSaturation: "transferrin_saturation",
  crp: "crp",
  reticulocytes: "reticulocytes",
  b12: "b12",
  folate: "folate",
};

function getVisibleAnaemiaFields(
  resolvedMcvBranch: NclAnaemiaMcvBranch,
  resolvedReticulocyteBranch: NclAnaemiaReticBranch
) {
  const fields = [...ANAEMIA_BASE_FIELDS];

  if (resolvedMcvBranch === "microcytic") {
    fields.push(...ANAEMIA_MICROCYTIC_FIELDS);
  }

  if (resolvedMcvBranch === "normocytic" || resolvedMcvBranch === "macrocytic") {
    fields.push(ANAEMIA_RETIC_FIELD);
  }

  if (resolvedMcvBranch === "macrocytic" && resolvedReticulocyteBranch !== "high") {
    fields.push(...ANAEMIA_MACRO_FIELDS);
  }

  return fields;
}

function getAnaemiaNextNeeds(
  form: NclAnaemiaFormState,
  resolvedMcvBranch: NclAnaemiaMcvBranch,
  resolvedReticulocyteBranch: NclAnaemiaReticBranch
): NextNeed[] {
  const needs: NextNeed[] = [];
  const hb = parseNumber(form.hb);
  const ferritin = parseNumber(form.ferritin);

  if (hb === null) {
    needs.push({
      title: "Add haemoglobin",
      detail: "This pathway only starts if Hb is below 110 g/L.",
    });
    return needs;
  }

  if (hb >= 110) {
    needs.push({
      title: "Anaemia threshold not met",
      detail: "With Hb 110 g/L or above, this anaemia pathway does not open.",
    });
    return needs;
  }

  if (resolvedMcvBranch === "unknown") {
    needs.push({
      title: "Add MCV",
      detail: "MCV is needed to split the route into microcytic, normocytic, or macrocytic anaemia.",
    });
  }

  if (ferritin === null) {
    needs.push({
      title: "Add ferritin",
      detail: "Ferritin is assessed in all anaemia cases in this pathway.",
    });
  }

  if (resolvedMcvBranch === "microcytic" && ferritin !== null && ferritin >= 30 && ferritin <= 150) {
    if (form.noKnownInflammatoryStates === "unknown") {
      needs.push({
        title: "Confirm inflammatory-state status",
        detail: "This ferritin 30-150 branch is specifically for patients with no known inflammatory states.",
      });
    }

    for (const field of ANAEMIA_MICROCYTIC_FIELDS) {
      if (!String(form[field.key] ?? "").trim()) {
        needs.push({
          title: `Add ${field.label}`,
          detail: field.helper,
        });
      }
    }
  }

  if ((resolvedMcvBranch === "normocytic" || resolvedMcvBranch === "macrocytic") && resolvedReticulocyteBranch === "unknown") {
    needs.push({
      title: "Add reticulocytes",
      detail: "The next split uses reticulocyte count below or above 80 x10^9/L / 2%.",
    });
  }

  if (resolvedMcvBranch === "normocytic" && form.pancytopenia === "unknown") {
    needs.push({
      title: "Confirm whether pancytopenia is present",
      detail: "Pancytopenia needs explicit clinician confirmation.",
    });
  }

  if (resolvedMcvBranch === "macrocytic" && resolvedReticulocyteBranch !== "high") {
    if (!form.b12.trim()) {
      needs.push({
        title: "Add B12",
        detail: "The macrocytic pathway next checks whether B12 is below or above 170 ng/L.",
      });
    }

    if (!form.folate.trim()) {
      needs.push({
        title: "Add folate",
        detail: "The macrocytic pathway next checks folate thresholds and symptoms.",
      });
    }
  }

  return needs;
}

function getAnaemiaSuggestion(
  resultHeadline: string,
  resolvedMcvBranch: NclAnaemiaMcvBranch,
  mode: "patient" | "clinician"
) {
  if (resultHeadline === "Urgent / admission branch") {
    return mode === "patient"
      ? "These results suggest anaemia that needs urgent medical review."
      : "Possible picture: urgent anaemia requiring same-day assessment or urgent referral.";
  }

  if (resultHeadline === "Iron deficiency anaemia") {
    return mode === "patient"
      ? "These results suggest iron deficiency anaemia."
      : "Possible diagnosis: iron deficiency anaemia.";
  }

  if (resolvedMcvBranch === "microcytic") {
    return mode === "patient"
      ? "These results suggest a microcytic anaemia pattern."
      : "Possible picture: microcytic anaemia.";
  }

  if (resolvedMcvBranch === "normocytic") {
    return mode === "patient"
      ? "These results suggest a normocytic anaemia pattern."
      : "Possible picture: normocytic anaemia.";
  }

  if (resolvedMcvBranch === "macrocytic") {
    return mode === "patient"
      ? "These results suggest a macrocytic anaemia pattern."
      : "Possible picture: macrocytic anaemia.";
  }

  return mode === "patient"
    ? "More results are needed before the pathway can suggest what this anaemia pattern may represent."
    : "More results are needed before a likely anaemia picture can be confirmed.";
}

function getPatientDiscussionPrompt(result: ReturnType<typeof computeNclAnaemiaResult>) {
  switch (result.outcomeCode) {
    case "urgent_admission":
    case "urgent_referral":
      return "The pathway suggests urgent review. Is this something I should discuss with my doctor today?";
    case "start_treatment":
      return "The pathway suggests treatment may be needed. What treatment or follow-up should I discuss with my doctor?";
    case "request_more_tests":
      return "The pathway needs more information. Which blood tests or checks are needed next?";
    default:
      return "What is the next step from this pathway for me to discuss with my doctor?";
  }
}

function getAnaemiaManagementIntro(mode: "patient" | "clinician") {
  return mode === "patient"
    ? "This is the current plan suggested by the pathway from the results entered so far."
    : "This is the current management plan from the pathway based on the results entered so far.";
}

function getAnaemiaFollowUpIntro(mode: "patient" | "clinician") {
  return mode === "patient"
    ? "These are the next tests, checks, or follow-up steps the pathway still needs."
    : "These are the further tests, checks, or follow-up steps the pathway still requires.";
}

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
        checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <span className="text-sm text-slate-700 leading-relaxed">{label}</span>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}

function ChoiceField({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
  hint,
}: {
  label: string;
  value: NclAnaemiaExplicitChoice;
  onChange: (next: NclAnaemiaExplicitChoice) => void;
  yesLabel: string;
  noLabel: string;
  hint?: string;
}) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={(next) => onChange(next as NclAnaemiaExplicitChoice)}
      hint={hint}
      options={[
        { value: "unknown", label: "Not yet selected" },
        { value: "yes", label: yesLabel },
        { value: "no", label: noLabel },
      ]}
    />
  );
}

export function AnaemiaPathwayPage() {
  const { mode } = useMode();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [form, setForm] = useState<NclAnaemiaFormState>(DEFAULT_NCL_ANAEMIA_FORM);
  const [referenceSex, setReferenceSex] = useState<ReferenceSex>("female");
  const [hasAnalysed, setHasAnalysed] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      age: search.age ?? current.age,
      hb: search.hb ?? current.hb,
      mcv: search.mcv ?? current.mcv,
      ferritin: search.ferritin ?? current.ferritin,
    }));
    setHasAnalysed(false);
  }, [search.age, search.hb, search.mcv, search.ferritin]);

  const result = useMemo(() => computeNclAnaemiaResult(form), [form]);
  const resolvedMcvBranch = resolveMcvBranch(form);
  const resolvedReticulocyteBranch = resolveReticulocyteBranch(form);
  const visibleFields = getVisibleAnaemiaFields(resolvedMcvBranch, resolvedReticulocyteBranch);
  const nextNeeds = getAnaemiaNextNeeds(form, resolvedMcvBranch, resolvedReticulocyteBranch);
  const priorityCodes = extractPathwayPriorityCodes(result.boxes);
  const resultStatusCards = visibleFields
    .filter((field) => String(form[field.key] ?? "").trim())
    .map((field) => {
      const inputId = ANAEMIA_REFERENCE_INPUTS[field.key];
      if (!inputId) return null;
      const input = LIVE_PATHWAY_INPUTS.find((entry) => entry.id === inputId);
      if (!input) return null;
      const assessment = assessReference(input, String(form[field.key] ?? ""), referenceSex);
      return {
        label: input.label,
        statusLabel: assessment.label,
        detail: assessment.detail,
      } satisfies ResultStatusCard;
    })
    .filter(Boolean) as ResultStatusCard[];

  const updateForm = (updater: (current: NclAnaemiaFormState) => NclAnaemiaFormState) => {
    setHasAnalysed(false);
    setForm((current) => updater(current));
  };

  const resetCalculator = () => {
    setForm(DEFAULT_NCL_ANAEMIA_FORM);
    setReferenceSex("female");
    setHasAnalysed(false);
    navigate({ to: "/pathway/anaemia", search: {} });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6">
          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            {mode === "patient" ? "Patient view" : "Clinician view"}
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Adult Anaemia Pathway
          </h1>
          <p className="mt-3 max-w-4xl text-sm sm:text-base text-slate-600 leading-relaxed">
            {mode === "patient"
              ? "Enter one or more blood results, then click Enter / Analyse to see what this may mean, what the current plan is, and what to discuss with your doctor."
              : "Enter one or more blood results, then click Enter / Analyse to see the likely picture, the management plan, and the follow-up needed."}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            {NCL_ANAEMIA_SOURCE_META.organisation} · {NCL_ANAEMIA_SOURCE_META.title} ·{" "}
            {NCL_ANAEMIA_SOURCE_META.version}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/pathways"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <span aria-hidden>←</span>
              Back to pathways
            </Link>
            <button
              type="button"
              onClick={resetCalculator}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Reset calculator
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Enter results
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Start with the blood results you already have from the report.
            </p>
            <div className="mt-4 max-w-xs">
              <SelectField
                label="Reference sex for normal ranges"
                value={referenceSex}
                onChange={(next) => {
                  setHasAnalysed(false);
                  setReferenceSex(next as ReferenceSex);
                }}
                options={[
                  { value: "female", label: "Female reference ranges" },
                  { value: "male", label: "Male reference ranges" },
                ]}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-5">
              {visibleFields.map(({ key, label, helper }) => (
                <label key={key} className="block">
                  <span className="block text-sm font-semibold text-slate-700 mb-2">{label}</span>
                  <input
                    type="number"
                    value={form[key] as string}
                    onChange={(e) =>
                      updateForm((current) => ({
                        ...current,
                        [key]: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{helper}</p>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setHasAnalysed(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enter / Analyse
            </button>
          </div>

          {mode === "clinician" && (
            <details className="bg-white rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Primary care checklist
              </summary>
              <ul className="mt-4 space-y-3 text-sm text-slate-700 leading-relaxed">
                {NCL_ANAEMIA_PRIMARY_CARE_ASSESSMENT.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-blue-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {mode === "clinician" && (
            <details className="bg-white rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Urgent clinician checks
              </summary>
              <div className="grid gap-3 mt-5">
                <ToggleRow
                  checked={form.verySymptomatic}
                  onChange={(next) => updateForm((current) => ({ ...current, verySymptomatic: next }))}
                  label="Very symptomatic."
                />
                <ToggleRow
                  checked={form.leukoerythroblasticBloodFilm}
                  onChange={(next) =>
                    updateForm((current) => ({ ...current, leukoerythroblasticBloodFilm: next }))
                  }
                  label="Leukoerythroblastic anaemia on blood film."
                />
                <ToggleRow
                  checked={form.unexplainedProgressiveSymptomaticAnaemia}
                  onChange={(next) =>
                    updateForm((current) => ({
                      ...current,
                      unexplainedProgressiveSymptomaticAnaemia: next,
                    }))
                  }
                  label="Unexplained progressive symptomatic anaemia."
                />
                <ToggleRow
                  checked={form.splenomegalyLymphadenopathyOtherCytopenias}
                  onChange={(next) =>
                    updateForm((current) => ({
                      ...current,
                      splenomegalyLymphadenopathyOtherCytopenias: next,
                    }))
                  }
                  label="Associated splenomegaly, lymphadenopathy and other cytopenias."
                />
                <ToggleRow
                  checked={form.suspectedHaematologicalMalignancyOrBloodDisorder}
                  onChange={(next) =>
                    updateForm((current) => ({
                      ...current,
                      suspectedHaematologicalMalignancyOrBloodDisorder: next,
                    }))
                  }
                  label="Suspected haematological malignancy or other blood disorder."
                />
                <ToggleRow
                  checked={form.acuteGiBleeding}
                  onChange={(next) => updateForm((current) => ({ ...current, acuteGiBleeding: next }))}
                  label="Acute GI bleeding."
                />
                <ToggleRow
                  checked={form.rectalBleeding}
                  onChange={(next) => updateForm((current) => ({ ...current, rectalBleeding: next }))}
                  label="Rectal bleeding."
                />
              </div>
            </details>
          )}

          {mode === "clinician" && (
            <details className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
              <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Clinician-only branch details
              </summary>

              <SelectField
                label="MCV branch"
                value={form.mcvBranch}
                onChange={(next) =>
                  updateForm((current) => ({
                    ...current,
                    mcvBranch: next as NclAnaemiaMcvBranch,
                  }))
                }
                hint="Leave this as not selected to derive the branch from the MCV threshold."
                options={[
                  { value: "unknown", label: "Not yet selected" },
                  { value: "microcytic", label: "MCV <80fl - Microcytic anaemia" },
                  { value: "normocytic", label: "MCV 80-100fl - Normocytic anaemia" },
                  { value: "macrocytic", label: "MCV >100fl - Macrocytic anaemia" },
                ]}
              />

              {resolvedMcvBranch === "microcytic" && (
                <ChoiceField
                  label="Inflammatory-state branch"
                  value={form.noKnownInflammatoryStates}
                  onChange={(next) =>
                    updateForm((current) => ({ ...current, noKnownInflammatoryStates: next }))
                  }
                  yesLabel="No known inflammatory states"
                  noLabel="Known inflammatory state present"
                />
              )}

              {resolvedMcvBranch === "normocytic" && (
                <>
                  <ChoiceField
                    label="Pancytopenia"
                    value={form.pancytopenia}
                    onChange={(next) =>
                      updateForm((current) => ({ ...current, pancytopenia: next }))
                    }
                    yesLabel="Pancytopenia present"
                    noLabel="No pancytopenia"
                  />
                  {form.pancytopenia !== "yes" && (
                    <SelectField
                      label="Reticulocyte branch"
                      value={form.reticulocyteBranch}
                      onChange={(next) =>
                        updateForm((current) => ({
                          ...current,
                          reticulocyteBranch: next as NclAnaemiaReticBranch,
                        }))
                      }
                      options={[
                        { value: "unknown", label: "Not yet selected" },
                        { value: "low", label: "Reticulocyte count <80x10^9/L / <2%" },
                        { value: "high", label: "Reticulocyte count >80x10^9/L / >2%" },
                      ]}
                    />
                  )}
                </>
              )}

              {resolvedMcvBranch === "macrocytic" && (
                <>
                  <SelectField
                    label="Reticulocyte branch"
                    value={form.reticulocyteBranch}
                    onChange={(next) =>
                      updateForm((current) => ({
                        ...current,
                        reticulocyteBranch: next as NclAnaemiaReticBranch,
                      }))
                    }
                    options={[
                      { value: "unknown", label: "Not yet selected" },
                      { value: "low", label: "Reticulocyte count <80x10^9/L / <2%" },
                      { value: "high", label: "Reticulocyte count >80x10^9/L / >2%" },
                    ]}
                  />
                  {resolvedReticulocyteBranch === "low" && (
                    <>
                      <ChoiceField
                        label="Symptoms of B12 / folate deficiency"
                        value={form.symptomsOfB12OrFolateDeficiency}
                        onChange={(next) =>
                          updateForm((current) => ({
                            ...current,
                            symptomsOfB12OrFolateDeficiency: next,
                          }))
                        }
                        yesLabel="Symptoms present"
                        noLabel="Asymptomatic"
                      />
                      <ChoiceField
                        label="Strong clinical suspicion for B12 deficiency"
                        value={form.strongClinicalSuspicionForB12Deficiency}
                        onChange={(next) =>
                          updateForm((current) => ({
                            ...current,
                            strongClinicalSuspicionForB12Deficiency: next,
                          }))
                        }
                        yesLabel="Strong index clinical suspicion present"
                        noLabel="No strong index clinical suspicion"
                      />
                    </>
                  )}
                </>
              )}
            </details>
          )}
        </section>

        <aside className="space-y-6">
          {!hasAnalysed ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Analyse this pathway
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                After clicking <span className="font-semibold text-slate-900">Enter / Analyse</span>, this page will show:
                result status, the likely picture, the management plan, and the follow-up needed.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Result status
                </h2>
                <div className="mt-4 grid gap-3">
                  {resultStatusCards.length === 0 ? (
                    <p className="text-sm leading-relaxed text-slate-600">
                      No results have been entered yet.
                    </p>
                  ) : (
                    resultStatusCards.map((card) => (
                      <div key={`${card.label}-${card.detail}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">{card.label}</p>
                          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                            {card.statusLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.detail}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Possible diagnosis / picture
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {priorityCodes.map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {code} = {PATHWAY_PRIORITY_LABELS[code]}
                    </span>
                  ))}
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                  {result.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {getAnaemiaSuggestion(result.headline, resolvedMcvBranch, mode)}
                </p>
                {mode === "patient" ? (
                  <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">What to ask your clinician:</span>{" "}
                    {getPatientDiscussionPrompt(result)}
                  </p>
                ) : null}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Management plan
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {getAnaemiaManagementIntro(mode)}
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-700 leading-relaxed">
                  {result.actions.map((action) => (
                    <li key={action} className="flex gap-3">
                      <span className="text-blue-600">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Follow-up / further tests
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {getAnaemiaFollowUpIntro(mode)}
                </p>
                {nextNeeds.length === 0 ? (
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    No further tests are needed to show the current pathway plan at this stage.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {nextNeeds.map((need) => (
                      <li key={`${need.title}-${need.detail}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">{need.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{need.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Review the source
                </h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {NCL_ANAEMIA_SOURCE_META.sourcePageUrl ? (
                    <a
                      href={NCL_ANAEMIA_SOURCE_META.sourcePageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Official haematology page
                    </a>
                  ) : null}
                  {NCL_ANAEMIA_SOURCE_META.sourcePdfUrl ? (
                    <a
                      href={NCL_ANAEMIA_SOURCE_META.sourcePdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Official pathway page
                    </a>
                  ) : null}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  {NCL_ANAEMIA_SOURCE_META.organisation} · {NCL_ANAEMIA_SOURCE_META.title} · {NCL_ANAEMIA_SOURCE_META.version}
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
