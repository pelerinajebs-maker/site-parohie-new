import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { HeartHandshake, Hammer, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { useLang, ml } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { useSiteContent } from "@/context/SiteContentContext";
import { PageHero } from "@/components/Layout";
import { Reveal, Cross } from "@/components/motion";

function fmt(n) {
  return new Intl.NumberFormat("ro-RO").format(Math.round(n || 0));
}

function RenovationProgress({ gallery }) {
  const { settings } = useSettings();
  const { lang } = useLang();
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const goal = settings?.renov_goal || 0;
  const raised = settings?.renov_raised || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const note = settings ? ml(settings.renov_note, lang) : "";
  const thumbs = (gallery || []).slice(0, 4);

  return (
    <section className="py-16 bg-cream" data-testid="renov-progress" ref={ref}>
      <div className="max-w-5xl mx-auto px-5 lg:px-8">
        <div className="bg-creamalt border border-byzgold/30 rounded-sm p-8 md:p-12 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-byzgold" />
            <span className="text-sm uppercase tracking-[0.25em] text-byzgold">Fondul de renovare</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-inkbrown mb-8">Progresul renovării</h2>

          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="font-serif text-4xl md:text-5xl text-inkbrown" data-testid="renov-raised">{fmt(raised)} <span className="text-xl text-byzgold">RON</span></div>
              <div className="text-sm text-inkbrown/60 mt-1">strânși din obiectivul de {fmt(goal)} RON</div>
            </div>
            <div className="text-right">
              <motion.div
                className="font-serif text-4xl md:text-5xl text-burgundy"
                initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.6 }}
                data-testid="renov-percent"
              >{pct}%</motion.div>
            </div>
          </div>

          {/* Progress track */}
          <div className="h-4 w-full rounded-full bg-cream border border-byzgold/30 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full bg-byzgold relative"
              initial={{ width: 0 }}
              animate={inView ? { width: `${pct}%` } : { width: 0 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ backgroundImage: "linear-gradient(90deg,#DAA520,#c8941a)" }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/20" />
            </motion.div>
          </div>

          {note && <p className="text-inkbrown/70 mt-6 leading-relaxed italic">{note}</p>}

          {thumbs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              {thumbs.map((g, i) => (
                <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.1 }}
                  className="relative rounded-sm overflow-hidden group">
                  <img src={g.image} alt="" className="w-full h-24 md:h-28 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-byzgold/30" />
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Link to="/doneaza" data-testid="progress-donate-btn" className="inline-flex items-center gap-2 bg-inkbrown text-cream px-6 py-3 rounded-sm font-medium hover:bg-byzgold hover:text-inkbrown transition-colors">
              <Cross className="w-3 h-5" color="currentColor" /> Contribuie la renovare
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Renovation() {
  const { t, lang } = useLang();
  const { pc } = useSiteContent();
  const p = t.pages.renovation;
  const [gallery, setGallery] = useState([]);
  useEffect(() => { api.get("/renovation").then((r) => setGallery(r.data)).catch(() => {}); }, []);

  return (
    <div data-testid="renovation-page">
      <PageHero kicker={t.nav.renovation} title={p.title} intro={p.intro} pageKey="renovation" />

      <RenovationProgress gallery={gallery} />

      <section className="py-16 bg-creamalt relative grain">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 grid md:grid-cols-2 gap-12 relative z-10">
          <Reveal>
            <h3 className="font-serif text-3xl text-inkbrown mb-4">{pc("renovation", "state", lang, p.state)}</h3>
            <p className="text-lg text-inkbrown/80 leading-relaxed">{pc("renovation", "stateText", lang, p.stateText)}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h3 className="font-serif text-3xl text-inkbrown mb-4">{pc("renovation", "goals", lang, p.goals)}</h3>
            <ul className="space-y-3 text-lg text-inkbrown/80">
              {[pc("renovation", "g1", lang, p.g1), pc("renovation", "g2", lang, p.g2), pc("renovation", "g3", lang, p.g3)].map((g, i) => <li key={i} className="flex items-center gap-3"><Cross className="w-3 h-6" />{g}</li>)}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="py-16 bg-cream">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <Reveal><h3 className="font-serif text-3xl text-inkbrown mb-8 flex items-center gap-3"><Hammer className="w-6 h-6 text-byzgold" />{pc("renovation", "gallery", lang, p.gallery)}</h3></Reveal>
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
            <h3 className="font-serif text-4xl mb-4">{pc("renovation", "support", lang, p.support)}</h3>
            <p className="text-lg text-cream/80 mb-8 leading-relaxed">{pc("renovation", "supportText", lang, p.supportText)}</p>
            <Link to="/doneaza" data-testid="renovation-donate-btn" className="inline-flex items-center gap-2 bg-byzgold text-inkbrown px-8 py-4 rounded-sm font-semibold text-lg hover:bg-cream transition-colors">
              <Cross className="w-4 h-6" color="currentColor" /> {t.nav.donate}
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
