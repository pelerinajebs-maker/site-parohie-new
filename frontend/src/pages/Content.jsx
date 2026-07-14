import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Calendar as CalIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useLang, ml } from "@/i18n";
import { PageHero } from "@/components/Layout";
import { Reveal, Cross } from "@/components/motion";

function fmtDate(d, lang) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString(lang === "ro" ? "ro-RO" : lang === "de" ? "de-DE" : "en-GB", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return ""; }
}

// Generic list page. base = route base for detail links.
export function ContentList({ kind, category, base, pageKey }) {
  const { t, lang } = useLang();
  const [items, setItems] = useState(null);
  const p = t.pages[pageKey];

  useEffect(() => {
    const params = { kind };
    if (category) params.category = category;
    api.get("/content", { params }).then((r) => setItems(r.data)).catch(() => setItems([]));
  }, [kind, category]);

  return (
    <div data-testid={`list-${pageKey}`}>
      <PageHero kicker={t.nav.resources && category ? t.nav.resources : t.parishShort} title={p.title} intro={p.intro} />
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          {items === null && <p className="text-inkbrown/60">{t.common.loading}</p>}
          {items && items.length === 0 && <p className="text-inkbrown/60" data-testid="empty-state">{t.common.empty}</p>}
          <div className="grid md:grid-cols-2 gap-8">
            {items && items.map((it, i) => (
              <Reveal key={it.id} delay={(i % 2) * 0.1}>
                <Link to={`${base}/${it.id}`} data-testid={`content-card-${it.id}`} className="group block bg-cream border border-byzgold/30 rounded-sm overflow-hidden hover:border-byzgold transition-colors h-full">
                  {it.image && <div className="h-56 overflow-hidden"><img src={it.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                  <div className="p-8">
                    {it.date && <div className="flex items-center gap-2 text-sm text-byzgold mb-3"><CalIcon className="w-4 h-4" />{fmtDate(it.date, lang)}</div>}
                    <h3 className="font-serif text-2xl text-inkbrown mb-3 leading-snug">{ml(it.title, lang)}</h3>
                    {it.excerpt && <p className="text-inkbrown/70 leading-relaxed mb-4">{ml(it.excerpt, lang)}</p>}
                    <span className="inline-flex items-center gap-2 text-burgundy group-hover:gap-3 transition-all">{t.common.readMore} <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ContentDetail({ base }) {
  const { id } = useParams();
  const { t, lang } = useLang();
  const [item, setItem] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.get(`/content/${id}`).then((r) => setItem(r.data)).catch(() => setErr(true));
  }, [id]);

  if (err) return <div className="pt-36 pb-20 text-center"><p>{t.common.empty}</p><Link to={base} className="text-burgundy">{t.common.back}</Link></div>;
  if (!item) return <div className="pt-36 pb-20 text-center text-inkbrown/60">{t.common.loading}</div>;

  return (
    <div data-testid="content-detail">
      <PageHero kicker={fmtDate(item.date, lang)} title={ml(item.title, lang)} />
      <article className="py-16 bg-cream">
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          {item.image && <img src={item.image} alt="" className="w-full h-[420px] object-cover rounded-sm mb-10" />}
          <div className="prose prose-lg max-w-none text-inkbrown/85 text-lg leading-relaxed whitespace-pre-line">
            {ml(item.body, lang)}
          </div>
          <div className="byz-rule my-12" />
          <Link to={base} className="inline-flex items-center gap-2 text-burgundy font-medium" data-testid="detail-back"><ArrowLeft className="w-4 h-4" /> {t.common.back}</Link>
        </div>
      </article>
    </div>
  );
}
