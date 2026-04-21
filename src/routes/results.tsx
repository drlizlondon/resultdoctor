import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/results")({
  component: ResultsPage,
});

/* ─────────────────────────────────────────────────────────────
   EXPORTED TYPES  (imported by pathway files)
───────────────────────────────────────────────────────────── */

export type UrgencyLevel =
  | "emergency"
  | "urgent_referral"
  | "urgent"
  | "routine_referral"
  | "primary_care"
  | "reassure"
  | "monitor";

export interface SynthesisFlag {
  label: string;
  value: number | null;   // null when status === "na"
  unit: string;
  isAbnormal: boolean;
  status: "entered" | "na";
  interpretation: string;
}

export interface MissingValueCaveat {
  field: string;
  message: string;
}

export interface ReferralItem {
  specialty: string;
  timeframe: string;
  note?: string;
}

export interface MvpResult {
  urgency: UrgencyLevel;
  clinicianHeadline: string;
  patientHeadline: string;
  patientSummary: string;
  patientAsk: string;
  verbatim: string[];
  verbatimTitle?: string;
  referrals: ReferralItem[];
  reasoning: string;
  caveats: MissingValueCaveat[];
  source: {
    organisation: string;
    document: string;
    version: string;
    flowsheetUrl: string;
  };
  pathwayId: string;
  pathwayTitle: string;
  resultsEntered: SynthesisFlag[];
  reviewDueDate?: string;
}

/* ─────────────────────────────────────────────────────────────
   URGENCY CONFIG
───────────────────────────────────────────────────────────── */

const UC: Record<UrgencyLevel, { label: string; bg: string; border: string; icon: string; labelColor: string }> = {
  emergency:        { label: "EMERGENCY",           bg: "#fef2f2", border: "#dc2626", icon: "🚨", labelColor: "#b91c1c" },
  urgent_referral:  { label: "SPECIALIST REFERRAL", bg: "#fff7ed", border: "#ea580c", icon: "⚡", labelColor: "#c2410c" },
  urgent:           { label: "URGENT",              bg: "#fefce8", border: "#ca8a04", icon: "⚠️", labelColor: "#a16207" },
  routine_referral: { label: "ROUTINE REFERRAL",    bg: "#eff6ff", border: "#3b82f6", icon: "📋", labelColor: "#1d4ed8" },
  primary_care:     { label: "PRIMARY CARE",        bg: "#f0fdf4", border: "#16a34a", icon: "🏥", labelColor: "#15803d" },
  reassure:         { label: "REASSURE",            bg: "#f0fdf4", border: "#22c55e", icon: "✅", labelColor: "#16a34a" },
  monitor:          { label: "MONITOR",             bg: "#f9fafb", border: "#6b7280", icon: "👁",  labelColor: "#4b5563" },
};

type ViewMode = "clinician" | "patient";

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */

export default function ResultsPage() {
  const [result, setResult] = useState<MvpResult | null>(null);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("clinician");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rd_result");
      if (!raw) { setError("No result found. Please run a pathway first."); return; }
      setResult(JSON.parse(raw));
    } catch {
      setError("Could not load result. Please try again.");
    }
  }, []);

  if (error || !result) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f7f6f2", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 17, color: "#666" }}>{error || "Loading…"}</p>
        <Link to="/pathways" style={{ padding: "10px 24px", background: "#1a1a1a", color: "white", borderRadius: 100, textDecoration: "none", fontSize: 14 }}>← Go to pathways</Link>
      </div>
    );
  }

  const uc = UC[result.urgency] ?? UC.monitor;
  const isPatient = viewMode === "patient";

  async function copyAsk() {
    await navigator.clipboard.writeText(result!.patientAsk);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const emailBody = isPatient
    ? `${result.patientSummary}\n\nWhat to say:\n"${result.patientAsk}"\n\nSource: ${result.source.organisation} · ${result.source.document} · ${result.source.version}\nFlowsheet: ${result.source.flowsheetUrl}`
    : `${result.clinicianHeadline}\n\nEngine reasoning:\n${result.reasoning}\n\n${result.verbatimTitle}:\n${result.verbatim.map(l => "• " + l).join("\n")}\n\nSource: ${result.source.organisation} · ${result.source.document} · ${result.source.version}\nFlowsheet: ${result.source.flowsheetUrl}`;

  return (
    <div style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: "#f7f6f2", minHeight: "100vh", color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rp-nav { position: sticky; top: 0; z-index: 100; background: rgba(247,246,242,0.96); backdrop-filter: blur(12px); border-bottom: 1px solid #e8e5de; }
        .rp-nav-inner { max-width: 780px; margin: 0 auto; padding: 0 20px; height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .rp-logo { font-family: 'Instrument Serif', serif; font-size: 20px; font-style: italic; color: #1a1a1a; text-decoration: none; }

        .rp-toggle { display: flex; background: #ede9e0; border-radius: 100px; padding: 3px; gap: 2px; }
        .rp-toggle-btn { padding: 5px 14px; border-radius: 100px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: #777; transition: all 0.15s; white-space: nowrap; }
        .rp-toggle-btn.on { background: white; color: #1a1a1a; box-shadow: 0 1px 4px rgba(0,0,0,0.10); }

        .rp-wrap { max-width: 780px; margin: 0 auto; padding: 32px 20px 80px; }

        /* Results entered row */
        .rp-flags { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
        .rp-flag { border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px; min-width: 100px; }
        .rp-flag-entered-abn { background: #fee2e2; }
        .rp-flag-entered-ok  { background: #e8f5ee; }
        .rp-flag-na          { background: #fef9c3; border: 1.5px dashed #d97706; }
        .rp-flag-lbl  { font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
        .rp-flag-entered-abn .rp-flag-lbl { color: #991b1b; }
        .rp-flag-entered-ok  .rp-flag-lbl { color: #14532d; }
        .rp-flag-na          .rp-flag-lbl { color: #92400e; }
        .rp-flag-val  { font-size: 22px; font-weight: 700; font-family: 'Instrument Serif', serif; line-height: 1.1; }
        .rp-flag-entered-abn .rp-flag-val { color: #991b1b; }
        .rp-flag-entered-ok  .rp-flag-val { color: #14532d; }
        .rp-flag-na          .rp-flag-val { color: #a16207; font-size: 14px; font-style: italic; font-family: inherit; }
        .rp-flag-unit { font-size: 11px; font-weight: 500; color: inherit; opacity: 0.7; }
        .rp-flag-interp { font-size: 11px; line-height: 1.45; margin-top: 3px; max-width: 180px; }
        .rp-flag-entered-abn .rp-flag-interp { color: #b91c1c; }
        .rp-flag-entered-ok  .rp-flag-interp { color: #15803d; }
        .rp-flag-na          .rp-flag-interp { color: #92400e; }

        /* Urgency card */
        .rp-urgency { border-radius: 16px; padding: 26px 30px; margin-bottom: 16px; border-left: 5px solid; }
        .rp-urgency-badge { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .rp-urgency-icon { font-size: 22px; }
        .rp-urgency-lbl { font-size: 11px; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; }

        /* Caveats */
        .rp-caveat { background: #fffbeb; border: 1.5px solid #fbbf24; border-radius: 12px; padding: 14px 18px; margin-bottom: 12px; display: flex; gap: 10px; align-items: flex-start; }
        .rp-caveat-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .rp-caveat-field { font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.05em; }
        .rp-caveat-msg { font-size: 13px; color: #78350f; line-height: 1.55; }

        /* Cards */
        .rp-card { background: white; border-radius: 16px; border: 1px solid #e8e5de; padding: 24px 26px; margin-bottom: 14px; }
        .rp-slabel { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #aaa; margin-bottom: 10px; }

        /* Reasoning block */
        .rp-reasoning { background: #f3f0ea; border-radius: 12px; padding: 16px 20px; }
        .rp-reasoning p { font-size: 14px; color: #333; line-height: 1.75; }

        /* Verbatim */
        .rp-vline { font-size: 14px; color: #444; line-height: 1.7; padding: 7px 0 7px 16px; border-bottom: 1px solid #f3f0ea; position: relative; }
        .rp-vline::before { content: "•"; position: absolute; left: 0; color: #2d5a3e; font-weight: 700; }
        .rp-vline:last-child { border-bottom: none; }

        /* Referrals */
        .rp-ref-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #f3f0ea; gap: 12px; }
        .rp-ref-row:last-child { border-bottom: none; }
        .rp-ref-badge { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #fff7ed; color: #c2410c; white-space: nowrap; }

        /* Patient ask */
        .rp-ask-box { background: #f9f8f5; border-left: 3px solid #2d5a3e; border-radius: 10px; padding: 18px 20px; margin-bottom: 14px; }
        .rp-ask-pre { font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #888; margin-bottom: 8px; }
        .rp-ask-quote { font-size: 15px; color: #1a1a1a; line-height: 1.65; font-style: italic; }

        /* Action buttons */
        .rp-btn { display: inline-block; padding: 8px 18px; border-radius: 100px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1.5px solid #d0cdc4; background: white; color: #555; transition: all 0.15s; text-decoration: none; }
        .rp-btn:hover { border-color: #1a1a1a; color: #1a1a1a; }

        .rp-flowsheet-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 600; color: #2d5a3e; text-decoration: none; border: 1.5px solid #2d5a3e; transition: all 0.15s; }
        .rp-flowsheet-btn:hover { background: #2d5a3e; color: white; }

        @media (max-width: 600px) {
          .rp-urgency { padding: 18px 18px; }
          .rp-card { padding: 18px; }
          .rp-wrap { padding: 20px 14px 60px; }
          .rp-nav-inner { height: auto; padding: 10px 16px; }
        }
        @media print {
          .rp-nav { display: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* NAV */}
      <div className="rp-nav">
        <div className="rp-nav-inner">
          <a href="/" className="rp-logo">Result<span style={{ color: "#2d5a3e" }}>Doctor</span></a>
          <div className="rp-toggle no-print">
            {(["clinician", "patient"] as ViewMode[]).map((m) => (
              <button key={m} onClick={() => setViewMode(m)} className={`rp-toggle-btn ${viewMode === m ? "on" : ""}`}>
                {m === "clinician" ? "👨‍⚕️ Clinician" : "🙋 Patient"}
              </button>
            ))}
          </div>
          <Link to="/pathway/anaemia" className="rp-btn no-print" style={{ fontSize: 12, padding: "6px 14px" }}>← New result</Link>
        </div>
      </div>

      <div className="rp-wrap">

        {/* View mode context strip */}
        <div style={{ marginBottom: 20, padding: "9px 14px", borderRadius: 10, background: isPatient ? "#eff6ff" : "#f0fdf4", border: `1px solid ${isPatient ? "#bfdbfe" : "#bbf7d0"}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>{isPatient ? "🙋" : "👨‍⚕️"}</span>
          <p style={{ fontSize: 12, color: isPatient ? "#1e40af" : "#14532d", fontWeight: 500 }}>
            {isPatient
              ? "Patient view — plain English summary and what to say to your doctor"
              : "Clinician view — sentence-form reasoning, verbatim guideline, and referral actions"}
          </p>
        </div>

        {/* RESULTS ENTERED — flags with full interpretation */}
        <div style={{ marginBottom: 24 }}>
          <p className="rp-slabel">Results entered</p>
          <div className="rp-flags">
            {result.resultsEntered.map((f) => {
              const cls = f.status === "na"
                ? "rp-flag rp-flag-na"
                : f.isAbnormal
                ? "rp-flag rp-flag-entered-abn"
                : "rp-flag rp-flag-entered-ok";
              return (
                <div key={f.label} className={cls}>
                  <span className="rp-flag-lbl">{f.label}</span>
                  <span className="rp-flag-val">
                    {f.status === "na" ? "N/A" : f.value}
                    {f.status !== "na" && <span className="rp-flag-unit"> {f.unit}</span>}
                  </span>
                  <span className="rp-flag-interp">{f.interpretation}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* URGENCY CARD */}
        <div className="rp-urgency" style={{ background: uc.bg, borderLeftColor: uc.border }}>
          <div className="rp-urgency-badge">
            <span className="rp-urgency-icon">{uc.icon}</span>
            <span className="rp-urgency-lbl" style={{ color: uc.labelColor }}>{uc.label}</span>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, lineHeight: 1.25, marginBottom: isPatient ? 10 : 6 }}>
            {isPatient ? result.patientHeadline : result.clinicianHeadline}
          </h1>
          {isPatient && (
            <p style={{ fontSize: 15, color: "#555", lineHeight: 1.65, marginBottom: 12 }}>{result.patientSummary}</p>
          )}
          <p style={{ fontSize: 12, color: "#aaa" }}>{result.pathwayTitle} · {result.source.organisation} · {result.source.version}</p>
        </div>

        {/* CAVEATS — missing or N/A values that could change the outcome */}
        {result.caveats.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            {result.caveats.map((c, i) => (
              <div key={i} className="rp-caveat">
                <span className="rp-caveat-icon">⚠️</span>
                <div>
                  <p className="rp-caveat-field">{c.field} not available</p>
                  <p className="rp-caveat-msg">{c.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLINICIAN: Reasoning */}
        {!isPatient && (
          <div className="rp-card">
            <p className="rp-slabel">How the engine reached this conclusion</p>
            <div className="rp-reasoning">
              <p>{result.reasoning}</p>
            </div>
          </div>
        )}

        {/* CLINICIAN: Referrals */}
        {!isPatient && result.referrals.length > 0 && (
          <div className="rp-card">
            <p className="rp-slabel">Referral actions</p>
            {result.referrals.map((ref, i) => (
              <div key={i} className="rp-ref-row">
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{ref.specialty}</p>
                  {ref.note && <p style={{ fontSize: 13, color: "#888", marginTop: 3 }}>{ref.note}</p>}
                </div>
                <span className="rp-ref-badge">{ref.timeframe}</span>
              </div>
            ))}
          </div>
        )}

        {/* PATIENT: What to say to your doctor */}
        {isPatient && (
          <div className="rp-card">
            <p className="rp-slabel">What to say to your doctor</p>
            <div className="rp-ask-box">
              <p className="rp-ask-pre">You could say:</p>
              <p className="rp-ask-quote">"{result.patientAsk}"</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={copyAsk} className="rp-btn" style={{ fontSize: 12 }}>
                {copied ? "✓ Copied!" : "📋 Copy this text"}
              </button>
              <a href={`mailto:?subject=${encodeURIComponent("My blood test results — ResultDoctor")}&body=${encodeURIComponent(emailBody)}`}
                className="rp-btn" style={{ fontSize: 12 }}>📤 Email to GP</a>
            </div>
          </div>
        )}

        {/* VERBATIM GUIDELINE — both views */}
        <div className="rp-card">
          <p className="rp-slabel">
            {isPatient ? "What the NHS guideline says" : result.verbatimTitle ?? "Guideline extract"}
          </p>
          {isPatient && (
            <p style={{ fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 1.55 }}>
              This is the exact wording your doctor will be following, from the official NHS NW London guideline:
            </p>
          )}
          {result.verbatim.map((line, i) => (
            <div key={i} className="rp-vline">{line}</div>
          ))}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #f3f0ea", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#ccc" }}>
              {result.source.organisation} · {result.source.document} · {result.source.version}
            </span>
            <a href={result.source.flowsheetUrl} target="_blank" rel="noopener noreferrer" className="rp-flowsheet-btn">
              View full flowsheet ↗
            </a>
          </div>
        </div>

        {/* PATIENT: also see full flowsheet prominently */}
        {isPatient && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <a href={result.source.flowsheetUrl} target="_blank" rel="noopener noreferrer" className="rp-flowsheet-btn">
              View full NHS guideline flowsheet ↗
            </a>
            <span style={{ fontSize: 12, color: "#aaa" }}>Official NWL ICB pathway PDF</span>
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #e8e5de", display: "flex", gap: 10, flexWrap: "wrap" }} className="no-print">
          <button onClick={() => window.print()} className="rp-btn">🖨 Print / Save PDF</button>
          <a href={`mailto:?subject=${encodeURIComponent("ResultDoctor — " + result.pathwayTitle)}&body=${encodeURIComponent(emailBody)}`} className="rp-btn">📤 Email result</a>
          <Link to="/pathway/anaemia" className="rp-btn">🔄 New result</Link>
        </div>

        <p style={{ marginTop: 28, fontSize: 11, color: "#ccc", textAlign: "center", lineHeight: 1.6 }}>
          This tool reproduces NHS NW London clinical guidelines verbatim and does not replace clinical judgement or a consultation with a qualified healthcare professional.
        </p>

      </div>
    </div>
  );
}
