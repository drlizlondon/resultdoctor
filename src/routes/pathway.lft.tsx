import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMode } from "@/lib/mode";
import { z } from "zod";
import { LIVE_PATHWAY_INPUTS } from "@/lib/live-pathway-inputs";
import { assessReference } from "@/lib/pathway-interpretation";
import {
  extractPathwayPriorityCodes,
  PATHWAY_PRIORITY_LABELS,
} from "@/lib/pathway-priority";
import {
  computeNclLftResult,
  DEFAULT_NCL_LFT_FORM,
  deriveNclLftBranch,
  type NclLftFormState,
  type NclLftPanelStatus,
  type NclLftRepeatStatus,
  NCL_LFT_SOURCE_META,
  type NclLftUltrasoundStatus,
} from "@/lib/pathways/ncl/lft";

const lftSearchSchema = z.object({
  bilirubin: z.string().optional(),
  alt: z.string().optional(),
  alp: z.string().optional(),
});

export const Route = createFileRoute("/pathway/lft")({
  validateSearch: lftSearchSchema,
  component: LFTPathwayPage,
});

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type NextNeed = {
  title: string;
  detail: string;
};

type ResultStatusCard = {
  label: string;
  statusLabel: string;
  detail: string;
};

function getLftNextNeeds(form: NclLftFormState): NextNeed[] {
  const needs: NextNeed[] = [];
  const bilirubin = parseNumber(form.bilirubin);
  const alt = parseNumber(form.alt);
  const alp = parseNumber(form.alp);
  const branch = deriveNclLftBranch(form);

  if (
    !form.jaundice &&
    !form.significantlyAbnormalLfts &&
    !form.concernLowAlbuminOrProlongedInr &&
    !form.suspectedMalignancy &&
    bilirubin === null &&
    alt === null &&
    alp === null
  ) {
    needs.push({
      title: "Start with bilirubin, ALT, or ALP",
      detail: "If you only know one abnormal liver result, enter it first.",
    });
    return needs;
  }

  if (branch === "unsure" && bilirubin === null) {
    needs.push({
      title: "Add bilirubin",
      detail: "Bilirubin is needed before the route can be determined safely.",
    });
  }

  if (branch === "unsure" && alt === null) {
    needs.push({
      title: "Add ALT",
      detail: "ALT is needed before the route can be determined safely.",
    });
  }

  if (branch === "unsure" && alp === null) {
    needs.push({
      title: "Add ALP",
      detail: "ALP is needed before the route can be determined safely.",
    });
  }

  if (branch === "hepatitic" && alt !== null && alt <= 300 && form.repeatStatus === "not_done") {
    needs.push({
      title: "Repeat blood tests within one month",
      detail: "Repeat with AST, GGT, and FBC to confirm the abnormality is still present.",
    });
  }

  if ((branch === "hepatitic" && form.repeatStatus === "still_abnormal") || (branch === "cholestatic" && form.ggtRaisedByLab)) {
    if (form.ultrasoundStatus === "not_done") {
      needs.push({
        title: "Arrange ultrasound",
        detail: "Ultrasound is the next explicit step in this branch.",
      });
    }
  }

  if (
    ((branch === "hepatitic" && form.repeatStatus === "still_abnormal") ||
      (branch === "cholestatic" &&
        form.ggtRaisedByLab &&
        (form.ultrasoundStatus === "normal" || form.ultrasoundStatus === "fatty_liver"))) &&
    form.panelStatus === "not_done"
  ) {
    needs.push({
      title: "Request extended liver test panel",
      detail:
        "Request Hepatitis B and C, autoantibodies, ferritin/transferrin saturation, caeruloplasmin, immunoglobulins, A1 antitrypsin, and HBA1c.",
    });
  }

  return needs;
}

function getLftSuggestion(
  branch: ReturnType<typeof deriveNclLftBranch>,
  resultHeadline: string,
  mode: "patient" | "clinician"
) {
  if (resultHeadline === "Red flag / urgent branch") {
    return mode === "patient"
      ? "These results suggest a pattern that needs urgent medical review."
      : "Possible picture: red-flag abnormal LFTs requiring urgent review.";
  }

  if (branch === "hepatitic") {
    return mode === "patient"
      ? "These results suggest a liver inflammation pattern."
      : "Possible picture: hepatitic LFT pattern with normal bilirubin and ALT higher than ALP.";
  }

  if (branch === "cholestatic") {
    return mode === "patient"
      ? "These results suggest a bile-flow or cholestatic pattern."
      : "Possible picture: cholestatic LFT pattern with normal bilirubin and ALP higher than ALT.";
  }

  if (branch === "isolated_bilirubin") {
    return mode === "patient"
      ? "These results suggest an isolated bilirubin pattern."
      : "Possible picture: isolated raised bilirubin with other liver tests not driving a hepatitic or cholestatic route.";
  }

  return mode === "patient"
    ? "More results are needed before the pathway can suggest what this pattern may represent."
    : "More results are needed before a likely LFT picture can be confirmed.";
}

function getPatientDiscussionPrompt(result: ReturnType<typeof computeNclLftResult>) {
  switch (result.outcomeCode) {
    case "urgent_referral":
    case "urgent_admission":
    case "urgent_specialist_advice":
      return "The pathway suggests urgent review. Is this something I should discuss with my doctor today?";
    case "repeat_and_reassess":
      return "The pathway suggests repeat blood tests. Which tests need repeating, and when should they be done?";
    case "arrange_ultrasound":
      return "The pathway suggests an ultrasound. Should that be arranged now?";
    case "request_more_tests":
      return "The pathway needs more results before it can go further. Which tests or checks are needed next?";
    default:
      return "What is the next step from this pathway for me to discuss with my doctor?";
  }
}

function getLftManagementIntro(mode: "patient" | "clinician") {
  return mode === "patient"
    ? "This is the current plan suggested by the pathway from the results entered so far."
    : "This is the current management plan from the pathway based on the results entered so far.";
}

function getLftFollowUpIntro(mode: "patient" | "clinician") {
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
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
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
    </label>
  );
}

export default function LFTPathwayPage() {
  const { mode } = useMode();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [form, setForm] = useState<NclLftFormState>(DEFAULT_NCL_LFT_FORM);
  const [hasAnalysed, setHasAnalysed] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      bilirubin: search.bilirubin ?? current.bilirubin,
      alt: search.alt ?? current.alt,
      alp: search.alp ?? current.alp,
    }));
    setHasAnalysed(false);
  }, [search.alp, search.alt, search.bilirubin]);

  const result = useMemo(() => computeNclLftResult(form), [form]);
  const derivedBranch = useMemo(() => deriveNclLftBranch(form), [form]);
  const nextNeeds = getLftNextNeeds(form);
  const priorityCodes = extractPathwayPriorityCodes(result.boxes);
  const resultStatusCards = (
    [
      ["bilirubin", form.bilirubin],
      ["alt", form.alt],
      ["alp", form.alp],
      ["ast", form.ast],
      ["ggt", form.ggt],
    ] as const
  )
    .filter(([, value]) => value.trim())
    .map(([id, value]) => {
      const input = LIVE_PATHWAY_INPUTS.find((entry) => entry.id === id);
      if (!input) return null;
      const assessment = assessReference(input, value);
      return {
        label: input.label,
        statusLabel: assessment.label,
        detail: assessment.detail,
      } satisfies ResultStatusCard;
    })
    .filter(Boolean) as ResultStatusCard[];

  const updateForm = (updater: (current: NclLftFormState) => NclLftFormState) => {
    setHasAnalysed(false);
    setForm((current) => updater(current));
  };

  const resetCalculator = () => {
    setForm(DEFAULT_NCL_LFT_FORM);
    setHasAnalysed(false);
    navigate({ to: "/pathway/lft", search: {} });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6">
          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            {mode === "patient" ? "Patient view" : "Clinician view"}
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Adult Abnormal LFT Pathway
          </h1>
          <p className="mt-3 max-w-4xl text-sm sm:text-base text-slate-600 leading-relaxed">
            {mode === "patient"
              ? "Enter one or more liver blood results, then click Enter / Analyse to see what this may mean, what the current plan is, and what to discuss with your doctor."
              : "Enter one or more liver blood results, then click Enter / Analyse to see the likely picture, the management plan, and the follow-up needed."}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            {NCL_LFT_SOURCE_META.organisation} · {NCL_LFT_SOURCE_META.title} ·{" "}
            {NCL_LFT_SOURCE_META.version}
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
              Start with the liver results you already have from the report.
            </p>
            <div className="grid gap-4 md:grid-cols-2 mt-5">
              {[
                ["bilirubin", "Bilirubin (umol/L)"],
                ["alt", "ALT (IU/L)"],
                ["alp", "ALP (IU/L)"],
                ["ast", "AST (IU/L)"],
                ["ggt", "GGT (IU/L)"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="block text-sm font-semibold text-slate-700 mb-2">{label}</span>
                  <input
                    type="number"
                    value={form[key as keyof NclLftFormState] as string}
                    onChange={(e) =>
                      updateForm((current) => ({
                        ...current,
                        [key]: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
                  />
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
                Urgent clinician checks
              </summary>
              <p className="mt-2 text-sm text-slate-600">
                Open this section only if you need to add the red-flag context from the pathway.
              </p>
              <div className="grid gap-3 mt-5">
                <ToggleRow
                  checked={form.jaundice}
                  onChange={(next) => updateForm((current) => ({ ...current, jaundice: next }))}
                  label="Jaundice."
                />
                <ToggleRow
                  checked={form.significantlyAbnormalLfts}
                  onChange={(next) =>
                    updateForm((current) => ({ ...current, significantlyAbnormalLfts: next }))
                  }
                  label="Clinician judges the LFTs to be significantly abnormal."
                />
                <ToggleRow
                  checked={form.concernLowAlbuminOrProlongedInr}
                  onChange={(next) =>
                    updateForm((current) => ({
                      ...current,
                      concernLowAlbuminOrProlongedInr: next,
                    }))
                  }
                  label="There are concerns regarding low albumin or prolonged INR (if done)."
                />
                <ToggleRow
                  checked={form.suspectedMalignancy}
                  onChange={(next) =>
                    updateForm((current) => ({ ...current, suspectedMalignancy: next }))
                  }
                  label="Suspected malignancy."
                />
              </div>
            </details>
          )}

          {mode === "clinician" && (
            <details className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
              <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Clinician-only branch details
              </summary>
              <p className="mt-2 text-sm text-slate-600">
                These extra fields are only needed when the pathway progresses to the next stage.
              </p>

              {derivedBranch === "hepatitic" && (
                <>
                  <ToggleRow
                    checked={form.alcoholOver14Units}
                    onChange={(next) =>
                      updateForm((current) => ({ ...current, alcoholOver14Units: next }))
                    }
                    label="Alcohol consumption is >14 units/week."
                  />
                  <SelectField
                    label="Repeat within one month still elevated?"
                    value={form.repeatStatus}
                    onChange={(next) =>
                      updateForm((current) => ({
                        ...current,
                        repeatStatus: next as NclLftRepeatStatus,
                      }))
                    }
                    options={[
                      { value: "not_done", label: "Repeat not yet done" },
                      { value: "still_abnormal", label: "Yes, still abnormal" },
                      { value: "resolved", label: "No, it resolved" },
                    ]}
                  />
                </>
              )}

              {derivedBranch === "cholestatic" && (
                <ToggleRow
                  checked={form.ggtRaisedByLab}
                  onChange={(next) =>
                    updateForm((current) => ({ ...current, ggtRaisedByLab: next }))
                  }
                  label="GGT is reported as raised by the laboratory."
                />
              )}

              {((derivedBranch === "hepatitic" && form.repeatStatus === "still_abnormal") ||
                (derivedBranch === "cholestatic" && form.ggtRaisedByLab)) && (
                <>
                  <SelectField
                    label="Ultrasound result"
                    value={form.ultrasoundStatus}
                    onChange={(next) =>
                      updateForm((current) => ({
                        ...current,
                        ultrasoundStatus: next as NclLftUltrasoundStatus,
                      }))
                    }
                    options={[
                      { value: "not_done", label: "Ultrasound not yet done" },
                      { value: "normal", label: "USS normal" },
                      { value: "fatty_liver", label: "Fatty liver suggested by USS" },
                      { value: "abnormal", label: "USS abnormal" },
                    ]}
                  />

                  {(form.ultrasoundStatus === "normal" ||
                    form.ultrasoundStatus === "fatty_liver") && (
                    <SelectField
                      label="Extended liver test panel result"
                      value={form.panelStatus}
                      onChange={(next) =>
                        updateForm((current) => ({
                          ...current,
                          panelStatus: next as NclLftPanelStatus,
                        }))
                      }
                      options={[
                        { value: "not_done", label: "Panel not yet done" },
                        { value: "normal", label: "Panel normal / negative for other pathology" },
                        { value: "abnormal", label: "Panel abnormal" },
                      ]}
                    />
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
                  {getLftSuggestion(derivedBranch, result.headline, mode)}
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
                  {getLftManagementIntro(mode)}
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
                  {getLftFollowUpIntro(mode)}
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
                  {NCL_LFT_SOURCE_META.sourcePageUrl ? (
                    <a
                      href={NCL_LFT_SOURCE_META.sourcePageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Official hepatology page
                    </a>
                  ) : null}
                  {NCL_LFT_SOURCE_META.sourcePdfUrl ? (
                    <a
                      href={NCL_LFT_SOURCE_META.sourcePdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Official pathway page
                    </a>
                  ) : null}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  {NCL_LFT_SOURCE_META.organisation} · {NCL_LFT_SOURCE_META.title} · {NCL_LFT_SOURCE_META.version}
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
