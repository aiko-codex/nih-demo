import { Link } from "react-router";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import { homeCopy } from "@/features/home/homeCopy";

function MissionSection() {
  return (
    <section id="mission" className="scroll-mt-28 px-6 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <p className="eyebrow">Our mission</p>
          <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">A place that belongs to everyone.</h2>
        </div>
        <div className="space-y-5 text-[15px] leading-7 text-white/70">
          <p>{homeCopy.mission}</p>
          <p>{homeCopy.missionDetail}</p>
        </div>
      </div>
      <dl className="mx-auto mt-16 grid max-w-6xl grid-cols-3 border-t border-white/10">
        {homeCopy.stats.map((stat) => (
          <div key={stat.label} className="border-white/10 pt-6 not-first:border-l not-first:pl-6">
            <dt className="text-xs text-muted-foreground sm:text-sm">{stat.label}</dt>
            <dd className="mt-2 font-display text-4xl sm:text-6xl">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function BuildingSection() {
  return (
    <section id="building" className="scroll-mt-28 px-6 pb-20 sm:pb-28">
      <div className="mx-auto grid max-w-6xl items-end gap-10 md:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <img
            src={`${import.meta.env.BASE_URL}building/night.jpg`}
            alt="The National India Hub building at night"
            className="aspect-16/10 w-full object-cover object-[50%_42%]"
          />
        </div>
        <div>
          <p className="eyebrow">The building</p>
          <h2 className="mt-4 text-4xl leading-tight">Five floors. One landmark.</h2>
          <p className="mt-5 text-[15px] leading-7 text-white/70">{homeCopy.building}</p>
        </div>
      </div>
    </section>
  );
}

function HowSection() {
  return (
    <section id="how" className="scroll-mt-28 px-6 pb-20 sm:pb-28">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">Light a window in three steps.</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {homeCopy.steps.map((step) => (
            <li key={step.number} className="border-t border-white/10 pt-6">
              <span className="font-mono text-xs text-primary">{step.number}</span>
              <h3 className="mt-4 text-2xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/65">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CalloutSection() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl border
        border-primary/25 bg-primary/6 p-8 sm:flex-row sm:items-center sm:p-12">
        <div>
          <p className="eyebrow">Diwali at the Hub</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">{homeCopy.callout}</h2>
        </div>
        <Link
          to="/"
          className="inline-flex h-12 shrink-0 items-center rounded-full bg-primary px-7 text-sm font-medium
            text-primary-foreground hover:brightness-110"
        >
          Choose a window
        </Link>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="dark min-h-screen bg-[#05060b] text-white">
      <SiteNav />
      <PageHero eyebrow="About us" title="Built by the community, lit by its people.">
        National India Hub brings culture, service and learning under one roof.
      </PageHero>
      <MissionSection />
      <BuildingSection />
      <HowSection />
      <CalloutSection />
      <SiteFooter />
    </div>
  );
}
