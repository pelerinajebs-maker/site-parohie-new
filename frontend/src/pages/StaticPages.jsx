import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/i18n";
import { PageHero } from "@/components/Layout";
import { Reveal, Cross } from "@/components/motion";

const INTERIOR = "https://images.pexels.com/photos/19474821/pexels-photo-19474821.jpeg";

export function About() {
  const { t } = useLang();
  const p = t.pages.about;
  return (
    <div data-testid="about-page">
      <PageHero kicker={t.nav.about} title={p.title} intro={p.intro} />
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 grid md:grid-cols-2 gap-8">
          <Reveal>
            <Link to="/despre/istoric" data-testid="about-history-link" className="group block bg-creamalt border border-byzgold/30 p-10 rounded-sm hover:border-byzgold transition-colors h-full">
              <Cross className="w-4 h-7 mb-5" />
              <h3 className="font-serif text-3xl text-inkbrown mb-3">{p.exploreHistory}</h3>
              <span className="inline-flex items-center gap-2 text-burgundy group-hover:gap-3 transition-all">{t.common.readMore} <ArrowRight className="w-4 h-4" /></span>
            </Link>
          </Reveal>
          <Reveal delay={0.12}>
            <Link to="/despre/comunitate" data-testid="about-community-link" className="group block bg-creamalt border border-byzgold/30 p-10 rounded-sm hover:border-byzgold transition-colors h-full">
              <Cross className="w-4 h-7 mb-5" />
              <h3 className="font-serif text-3xl text-inkbrown mb-3">{p.exploreCommunity}</h3>
              <span className="inline-flex items-center gap-2 text-burgundy group-hover:gap-3 transition-all">{t.common.readMore} <ArrowRight className="w-4 h-4" /></span>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export function History() {
  const { t } = useLang();
  const p = t.pages.history;
  return (
    <div data-testid="history-page">
      <PageHero kicker={t.nav.about} title={p.title} intro={p.intro} />
      <section className="py-16 bg-cream">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 space-y-6 text-lg text-inkbrown/80 leading-relaxed">
          <Reveal><img src={INTERIOR} alt="" className="w-full h-[420px] object-cover rounded-sm mb-8" /></Reveal>
          <Reveal><p>{p.p1}</p></Reveal>
          <Reveal delay={0.1}><p>{p.p2}</p></Reveal>
        </div>
      </section>
    </div>
  );
}

export function Community() {
  const { t } = useLang();
  const p = t.pages.community;
  return (
    <div data-testid="community-page">
      <PageHero kicker={t.nav.about} title={p.title} intro={p.intro} />
      <section className="py-16 bg-cream">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 grid md:grid-cols-2 gap-12">
          <Reveal>
            <h3 className="font-serif text-3xl text-inkbrown mb-6">{p.groups}</h3>
            <ul className="space-y-4 text-lg text-inkbrown/80">
              {[p.g1, p.g2, p.g3].map((g, i) => (
                <li key={i} className="flex items-center gap-3"><Cross className="w-3 h-6" /> {g}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <h3 className="font-serif text-3xl text-inkbrown mb-6">{p.activities}</h3>
            <ul className="space-y-4 text-lg text-inkbrown/80">
              {[p.a1, p.a2, p.a3].map((a, i) => (
                <li key={i} className="flex items-center gap-3"><Cross className="w-3 h-6" /> {a}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export function ResourcesHub() {
  const { t } = useLang();
  const p = t.pages.resources;
  const cards = [
    { to: "/resurse/calendar", label: t.nav.calendar },
    { to: "/resurse/hram", label: t.nav.patron },
    { to: "/resurse/cuvantul-preotului", label: t.nav.priest },
    { to: "/resurse/catehizare", label: t.nav.catechesis },
    { to: "/resurse/rugaciuni", label: t.nav.prayers },
  ];
  return (
    <div data-testid="resources-page">
      <PageHero kicker={t.nav.resources} title={p.title} intro={p.intro} />
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <Reveal key={c.to} delay={(i % 3) * 0.08}>
              <Link to={c.to} data-testid={`res-${c.to}`} className="group block bg-creamalt border border-byzgold/30 p-8 rounded-sm hover:border-byzgold transition-colors h-full">
                <Cross className="w-4 h-7 mb-4" />
                <h3 className="font-serif text-2xl text-inkbrown mb-2">{c.label}</h3>
                <span className="inline-flex items-center gap-2 text-burgundy text-sm group-hover:gap-3 transition-all">{t.common.readMore} <ArrowRight className="w-4 h-4" /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
