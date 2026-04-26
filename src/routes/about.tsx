import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ResultDoctor" },
      {
        name: "description",
        content:
          "ResultDoctor turns published NHS clinical guidance into interactive clinician pathways. Learn how the location-first pathway model works.",
      },
      { property: "og:title", content: "About ResultDoctor" },
      {
        property: "og:description",
        content: "Interactive clinician pathways built from published NHS guidance.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
      <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full ring-1 ring-primary/15 mb-5">
        About ResultDoctor
      </div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-foreground">
        Clear pathway structure,
        <br />
        careful product claims.
      </h1>

      <Section title="Mission">
        <p>
          ResultDoctor exists to make published clinical pathways easier for clinicians to
          navigate quickly, while keeping the source location and scope of each pathway obvious.
        </p>
      </Section>

      <Section title="How it works">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose">
          {[
            { n: "01", t: "Published NHS pathway", d: "We start with the source guideline and preserve the location it belongs to." },
            {
              n: "02",
              t: "Structured route model",
              d: "Each route is organised as location, pathway family, then population variant.",
            },
            {
              n: "03",
              t: "Clinician-ready tool",
              d: "The user gets a clearer operational pathway without overstating NHS affiliation.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="bg-card rounded-[14px] p-5 ring-1 ring-border shadow-card"
            >
              <div className="text-xs font-bold text-primary tracking-widest mb-2">
                {s.n}
              </div>
              <h3 className="font-semibold text-foreground tracking-tight">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="For ICBs, Trusts and Clinics">
        <p>
          The long-term model is to support multiple organisations cleanly. Each location can
          hold multiple pathway families, and each family can hold multiple variants such as
          adult and child without duplicate naming collisions.
        </p>
        <a
          href="mailto:partner@resultdoctor.com"
          className="not-prose inline-flex items-center gap-2 mt-4 bg-accent text-accent-foreground px-6 py-3 rounded-[12px] font-semibold text-sm shadow-amber hover:-translate-y-0.5 transition-all"
        >
          Get in touch → partner@resultdoctor.com
        </a>
      </Section>

      <Section title="Current coverage">
        <ul>
          <li>
            <strong>Live now:</strong> NCL adult anaemia and adult abnormal LFT clinician pathways
          </li>
          <li>
            <strong>Next phase:</strong> more locations, more pathway families, and child/adult variants where guidelines differ
          </li>
        </ul>
      </Section>

      <Section title="Built with clinical safety in mind">
        <p>
          ResultDoctor is a navigation aid built from published guidance. It should not be
          described as an NHS service or commissioned product unless that relationship exists
          explicitly for the pathway being shown.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">
        {title}
      </h2>
      <div className="prose prose-sm sm:prose-base max-w-none text-foreground leading-relaxed [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
