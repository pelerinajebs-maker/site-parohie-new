import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Hammer } from "lucide-react";
import { api } from "@/lib/api";
import { useLang, ml } from "@/i18n";
import { PageHero } from "@/components/Layout";
import { Reveal, Cross } from "@/components/motion";

export default function Renovation() {
  const { t, lang } = useLang();
  const p = t.pages.renovation;
  const [gallery, setGallery] = useState([]);
  useEffect(() => { api.get("/renovation").then((r) => setGallery(r.data)).catch(() => {}); }, []);

  return (
    <div data-testid="renovation-page">
      <PageHero kicker={t.nav.renovation} title={p.title} intro={p.intro} />
      <section className="py-16 bg-cream">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 grid md:grid-cols-2 gap-12">
          <Reveal>
            <h3 className="font-serif text-3xl text-inkbrown mb-4">{p.state}</h3>
            <p className="text-lg text-inkbrown/80 leading-relaxed">{p.stateText}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h3 className="font-serif text-3xl text-inkbrown mb-4">{p.goals}</h3>
            <ul className="space-y-3 text-lg text-inkbrown/80">
              {[p.g1, p.g2, p.g3].map((g, i) => <li key={i} className="flex items-center gap-3"><Cross className="w-3 h-6" />{g}</li>)}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="py-16 bg-creamalt relative grain">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 relative z-10">
          <Reveal><h3 className="font-serif text-3xl text-inkbrown mb-8 flex items-center gap-3"><Hammer className="w-6 h-6 text-byzgold" />{p.gallery}</h3></Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((g, i) => (
              <Reveal key={g.id} delay={(i % 3) * 0.08}>
                <figure className="bg-cream border border-byzgold/30 rounded-sm overflow-hidden">
                  <img src={g.image} alt="" className="w-full h-56 object-cover" />
                  {ml(g.caption, lang) && <figcaption className="p-4 text-sm text-inkbrown/70">{ml(g.caption, lang)}</figcaption>}
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-burgundy text-cream relative grain">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 text-center relative z-10">
          <Reveal>
            <div className="flex justify-center mb-5"><HeartHandshake className="w-10 h-10 text-byzgold" /></div>
            <h3 className="font-serif text-4xl mb-4">{p.support}</h3>
            <p className="text-lg text-cream/80 mb-8 leading-relaxed">{p.supportText}</p>
            <Link to="/doneaza" data-testid="renovation-donate-btn" className="inline-flex items-center gap-2 bg-byzgold text-inkbrown px-8 py-4 rounded-sm font-semibold text-lg hover:bg-cream transition-colors">
              <Cross className="w-4 h-6" color="currentColor" /> {t.nav.donate}
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
