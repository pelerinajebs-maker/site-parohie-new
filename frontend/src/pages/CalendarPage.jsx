import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sun, BookOpen, Star, Flame } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/i18n";
import { PageHero } from "@/components/Layout";
import { Reveal, Cross } from "@/components/motion";
import { Calendar as DayPicker } from "@/components/ui/calendar";

export default function CalendarPage() {
  const { t, lang } = useLang();
  const p = t.pages.calendar;
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDay = useCallback((d) => {
    setLoading(true); setError(false);
    api.get(`/calendar/${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`)
      .then((r) => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDay(date); }, [date, fetchDay]);

  const locale = lang === "ro" ? "ro-RO" : lang === "de" ? "de-DE" : "en-GB";
  const heading = date.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div data-testid="calendar-page">
      <PageHero kicker={t.nav.resources} title={p.title} intro={p.intro} />
      <section className="py-16 bg-cream">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="text-sm uppercase tracking-[0.2em] text-byzgold mb-4">{p.pick}</div>
              <div className="bg-creamalt border border-byzgold/30 rounded-sm p-4 inline-block">
                <DayPicker mode="single" selected={date} onSelect={(d) => d && setDate(d)} data-testid="calendar-picker" />
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              <h2 className="font-serif text-3xl text-inkbrown capitalize mb-6" data-testid="calendar-date-heading">{heading}</h2>
              {loading && <p className="text-inkbrown/60">{p.loading}</p>}
              {error && <p className="text-burgundy" data-testid="calendar-error">{p.error}</p>}
              {!loading && !error && data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" data-testid="calendar-result">
                  {data.summary_title && (
                    <div className="bg-burgundy text-cream p-6 rounded-sm">
                      <div className="flex items-center gap-2 text-byzgold text-sm uppercase tracking-widest mb-2"><Star className="w-4 h-4" />{p.feast}</div>
                      <p className="font-serif text-2xl">{data.summary_title}</p>
                    </div>
                  )}
                  {data.fast_level_desc && (
                    <div className="flex items-start gap-3 border border-byzgold/30 p-5 rounded-sm">
                      <Flame className="w-5 h-5 text-byzgold mt-1" />
                      <div><div className="text-sm uppercase tracking-widest text-byzgold mb-1">{p.fast}</div><p className="text-inkbrown/80">{data.fast_level_desc}{data.fast_exception_desc ? ` — ${data.fast_exception_desc}` : ""}</p></div>
                    </div>
                  )}
                  {data.saints && data.saints.length > 0 && (
                    <div className="border border-byzgold/30 p-5 rounded-sm">
                      <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-byzgold mb-3"><Sun className="w-4 h-4" />{p.saints}</div>
                      <ul className="space-y-2 text-inkbrown/80">
                        {data.saints.map((s, i) => <li key={i} className="flex gap-3"><Cross className="w-2.5 h-5 mt-1 shrink-0" />{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {data.readings && data.readings.length > 0 && (
                    <div className="border border-byzgold/30 p-5 rounded-sm">
                      <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-byzgold mb-3"><BookOpen className="w-4 h-4" />{p.readings}</div>
                      <ul className="space-y-2 text-inkbrown/80">
                        {data.readings.map((r, i) => <li key={i}>{r.display}{r.source ? ` (${r.source})` : ""}</li>)}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
