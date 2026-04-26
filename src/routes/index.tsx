import { createFileRoute, Link } from "@tanstack/react-router";
import { useMode } from "@/lib/mode";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResultDoctor — NHS Clinical Pathways, Interactively" },
      {
        name: "description",
        content:
          "Clinician-focused interactive pathways built from published NHS guidance, organised by location and pathway.",
      },
      { property: "og:title", content: "ResultDoctor — NHS Clinical Pathways, Interactively" },
      {
        property: "og:description",
        content: "Interactive clinician pathways built from published NHS guidance.",
      },
    ],
  }),
  component: HomePage,
});

// ─── Animated counter ────────────────────────────────────────
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(ease * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{value}{suffix}</span>;
}

// ─── Trust logo pill ──────────────────────────────────────────
function TrustPill({ code, name }: { code: string; name: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-card ring-1 ring-border">
      <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[9px]">
        {code}
      </div>
      <span className="text-xs font-medium text-foreground whitespace-nowrap">{name}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
function HomePage() {
  const { mode } = useMode();

  return (
    <div className="w-full overflow-x-hidden">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(0,164,153,0.25); }
          70%  { box-shadow: 0 0 0 10px rgba(0,164,153,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,164,153,0); }
        }
        .live-dot { animation: pulse-ring 2s infinite; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative w-full max-w-[1280px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-20 sm:pb-28">
        {/* Background grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Live badge */}
            <div
              style={{ animation: "fadeSlideUp 0.5s ease forwards" }}
              className="inline-flex items-center gap-2 self-start text-xs font-semibold text-primary bg-primary/10 px-3.5 py-1.5 rounded-full ring-1 ring-primary/20"
            >
              <span className="size-2 rounded-full bg-primary live-dot" />
                Built from published NHS guidance
            </div>

            {/* Headline */}
            <div style={{ animation: "fadeSlideUp 0.55s ease forwards 80ms", opacity: 0 }}>
              <h1
                className="text-[2.6rem] sm:text-5xl lg:text-[3.6rem] font-semibold tracking-tight leading-[1.04] text-foreground"
                style={{ fontFeatureSettings: '"cv02", "cv03"' }}
              >
                {mode === "patient" ? (
                  <>
                    Blood test results<br />
                    <span className="text-primary">made clear.</span>
                  </>
                ) : (
                  <>
                    NHS pathways,<br />
                    <span className="text-primary">without the friction.</span>
                  </>
                )}
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-[52ch]">
                {mode === "patient"
                  ? "Enter your blood test results. Get the exact next steps your NHS guideline recommends — in plain English."
                  : "Interactive clinician pathways built from published NHS guidance. Search by test name or open the relevant pathway and work through the decision logic clearly."}
              </p>
            </div>

            {/* CTA row */}
            <div
              style={{ animation: "fadeSlideUp 0.55s ease forwards 160ms", opacity: 0 }}
              className="flex flex-wrap items-center gap-4 mt-1"
            >
              <Link
                to="/pathways"
                className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-7 py-3.5 rounded-[12px] font-semibold text-base hover:-translate-y-0.5 hover:bg-primary/90 transition-all shadow-sm"
              >
                Explore pathways
                <span aria-hidden className="text-primary-foreground/70">→</span>
              </Link>
              <Link
                to="/pathways"
                className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/20 transition-all"
              >
                Search by test name
              </Link>
              <Link
                to="/about"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How it works ↗
              </Link>
            </div>

            {/* Social proof strip */}
            <div
              style={{ animation: "fadeSlideUp 0.55s ease forwards 240ms", opacity: 0 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-primary font-bold">✓</span>
                Structured directly from published NHS and clinical pathways
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-primary font-bold">✓</span>
                Search or open a pathway directly
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-primary font-bold">✓</span>
                Clear scope without implying NHS commissioning
              </span>
            </div>
          </div>

          {/* Right column — pathway preview cards */}
          <div
            style={{ animation: "fadeSlideUp 0.6s ease forwards 120ms", opacity: 0 }}
            className="lg:col-span-5 flex flex-col gap-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
              Live now
            </p>
            <div
              style={{ animationDelay: "360ms", opacity: 0, animation: "fadeSlideUp 0.6s ease forwards 360ms" }}
              className="rounded-[14px] border-2 border-dashed border-border/60 p-5 text-center"
            >
              <p className="text-sm font-semibold text-foreground">Explore pathways</p>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Search by test name or browse the pathway catalogue to open the live tools.
              </p>
            </div>

            {/* Source badge */}
            <div className="flex items-center gap-2 mt-1">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card ring-1 ring-border text-[10px] font-semibold text-muted-foreground"
                style={{ animation: "fadeSlideUp 0.6s ease forwards 500ms", opacity: 0 }}
              >
                <span className="size-4 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[8px]">NCL</span>
                Adult anaemia + adult LFTs live
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/40">
        <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x divide-border">
          {[
            { value: 20, suffix: "", label: "Haematology pathways", sub: "NW London ICB" },
            { value: 9, suffix: "", label: "More pathways mapped", sub: "NCL ICB" },
            { value: 8, suffix: "", label: "Cross-pathway rules", sub: "Combination logic" },
            { value: 2, suffix: " ICBs", label: "NHS bodies live", sub: "Expanding quarterly" },
          ].map((s, i) => (
            <div key={i} className="sm:px-8 flex flex-col">
              <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm font-medium text-foreground mt-1">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[520px] mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Guidelines as engines,<br />not PDFs
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Every NHS clinical pathway is a decision tree. We turn those trees into interactive tools — driven by the exact guideline text, not an interpretation of it.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              step: "01",
              title: "Enter your results",
              body: "Type in the numbers from your blood test report. The system knows which tests belong together and asks only what it needs.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="size-5">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7 9h10M7 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              step: "02",
              title: "Engine runs the pathway",
              body: "The decision tree executes against NHS guideline logic — considering combinations of results, not just single values.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="size-5">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M12 5v2M12 17v2M5 12H3M21 12h-2M7.05 7.05 5.64 5.64M18.36 18.36l-1.41-1.41M7.05 16.95l-1.41 1.41M18.36 5.64l-1.41 1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              step: "03",
              title: "Guideline-exact output",
              body: "You receive the exact text from the NHS guideline — urgency, referral pathway, investigations — attributed to source and version.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="size-5">
                  <path d="M9 12.5l2.2 2.2L15.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.step} className="bg-card rounded-[14px] p-6 ring-1 ring-border relative overflow-hidden">
              <span className="absolute top-4 right-5 text-[3rem] font-black text-border/40 leading-none select-none">
                {item.step}
              </span>
              <div className="size-10 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary mb-4 relative z-10">
                {item.icon}
              </div>
              <h3 className="font-semibold text-base text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GUIDELINE SOURCES ─────────────────────────────────── */}
      <section className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
        <div className="bg-card rounded-[20px] ring-1 ring-border p-8 sm:p-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary mb-3">Guideline sources</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-4">
                Select your NHS body
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                ResultDoctor is built on the published guidelines of NHS Integrated Care Boards and Trusts. Select your ICB to access the pathways that apply to your population.
              </p>
              <Link
                to="/pathways"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-[12px] font-semibold text-sm hover:-translate-y-0.5 hover:bg-primary/90 transition-all shadow-sm"
              >
                View all pathways →
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              {/* NW London — live */}
              <Link
                to="/pathways"
                className="flex items-center justify-between gap-4 bg-background rounded-[14px] p-5 ring-2 ring-primary hover:shadow-card hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-1 ring-inset ring-primary/20">
                    NW
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground">NW London ICB</h3>
                    <p className="text-sm text-muted-foreground">Haematology · 20 pathways</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">Live</span>
                  <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:translate-x-0.5 transition-transform text-sm">→</div>
                </div>
              </Link>

              {/* NCL — coming */}
              <div className="flex items-center justify-between gap-4 bg-background rounded-[14px] p-5 ring-1 ring-border opacity-70 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                    NC
                  </div>
                  <div>
                    <h3 className="font-medium text-base text-foreground">NCL ICB</h3>
                    <p className="text-sm text-muted-foreground">9 pathways mapped · In development</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2.5 py-1 rounded-md ring-1 ring-border">Soon</span>
              </div>

              {/* Custom */}
              <div className="flex items-center justify-between gap-4 bg-background rounded-[14px] p-5 ring-1 ring-dashed ring-border opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                    ＋
                  </div>
                  <div>
                    <h3 className="font-medium text-base text-foreground">Your ICB or Trust</h3>
                    <p className="text-sm text-muted-foreground">Upload your own guidelines</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2.5 py-1 rounded-md ring-1 ring-border">Contact us</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── B2B / FOR ORGANISATIONS ──────────────────────────── */}
      <section className="border-t border-border bg-foreground text-background">
        <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary mb-4">For ICBs &amp; Trusts</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-5">
              Turn your guidelines into<br />
              <span className="text-primary">interactive tools.</span>
            </h2>
            <p className="text-base text-background/70 leading-relaxed mb-8 max-w-[46ch]">
              Any ICB or Trust can upload their PDF guidelines and receive a branded, interactive decision engine — deployed in days, not months. Clinical leads approve. No developers needed.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "AI-assisted extraction of pathway logic from your PDFs",
                "Clinical lead review and approval workflow",
                "Branded portal for your patient and clinician populations",
                "Review date tracking — flags overdue guidelines automatically",
                "Marginal cost of adding a pathway approaches zero",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm text-background/80">
                  <span className="text-primary font-bold mt-0.5 shrink-0">✓</span>
                  {point}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <a
                href="mailto:partner@resultdoctor.com"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-[12px] font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                partner@resultdoctor.com →
              </a>
            </div>
          </div>

          {/* Right: pricing/value table */}
          <div className="bg-background/5 rounded-[20px] ring-1 ring-background/10 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary mb-6">The model</p>
            <div className="space-y-6">
              {[
                {
                  phase: "Upload",
                  desc: "Your clinical team uploads guideline PDFs",
                  icon: "📄",
                },
                {
                  phase: "Extract",
                  desc: "AI maps the decision logic into structured data",
                  icon: "⚙️",
                },
                {
                  phase: "Approve",
                  desc: "Clinical lead reviews and signs off each pathway",
                  icon: "✅",
                },
                {
                  phase: "Deploy",
                  desc: "Your branded tool goes live — for patients and clinicians",
                  icon: "🚀",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="size-10 rounded-[10px] bg-background/10 flex items-center justify-center text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-background">{item.phase}</p>
                    <p className="text-sm text-background/60 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-background/10 text-xs text-background/40 leading-relaxed">
              Currently covering NW London ICB (20 pathways live) and NCL ICB (9 pathways mapped).
              LFTs, TFTs, CKD, PSA, raised ferritin in development.
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ────────────────────────────────────── */}
      <section className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground text-center mb-6">
          Built on guidelines from
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <TrustPill code="NW" name="NW London ICB" />
          <TrustPill code="NC" name="North Central London ICB" />
          <TrustPill code="NH" name="NHS England" />
          <TrustPill code="GP" name="Primary Care Networks" />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8 max-w-[56ch] mx-auto leading-relaxed">
          ResultDoctor reproduces NHS clinical guidelines verbatim and does not generate, modify, or interpret clinical recommendations. All pathway outputs are attributed to source documents, versions and dates.
        </p>
      </section>
    </div>
  );
}
