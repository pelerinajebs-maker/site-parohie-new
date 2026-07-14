import React, { useState } from "react";
import { Newspaper, ExternalLink, Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useLang } from "@/i18n";
import { PageHero } from "@/components/Layout";
import { Reveal, Cross } from "@/components/motion";
import { Input } from "@/components/ui/input";

const PUBS = [
  { key: "lumina", url: "https://ziarullumina.ro/", name: "Ziarul Lumina" },
  { key: "renasterea", url: "https://revistarenasterea.ro/", name: "Revista Renașterea" },
];

export default function Newsletter() {
  const { t } = useLang();
  const p = t.pages.newsletter;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/newsletter/subscribe", { email, name });
      toast.success(data.already ? p.already : p.success);
      if (!data.already) { setEmail(""); setName(""); }
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="newsletter-page">
      <PageHero kicker={t.nav.resources} title={p.title} intro={p.intro} />
      <section className="py-16 bg-cream">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12">
          <Reveal>
            <div className="flex items-center gap-3 mb-4"><Newspaper className="w-7 h-7 text-byzgold" /><h2 className="font-serif text-3xl text-inkbrown">{p.pubTitle}</h2></div>
            <p className="text-inkbrown/70 mb-6 leading-relaxed">{p.pubText}</p>
            <div className="space-y-4">
              {PUBS.map((pub) => (
                <div key={pub.key} className="bg-creamalt border border-byzgold/30 rounded-sm p-6">
                  <div className="flex items-start gap-3 mb-2"><Cross className="w-3 h-6 mt-1 shrink-0" /><h3 className="font-serif text-2xl text-inkbrown">{pub.name}</h3></div>
                  <p className="text-inkbrown/70 mb-4">{p[pub.key]}</p>
                  <a href={pub.url} target="_blank" rel="noreferrer" data-testid={`pub-${pub.key}`} className="inline-flex items-center gap-2 text-burgundy font-medium hover:text-byzgold transition-colors">
                    <ExternalLink className="w-4 h-4" /> {p.visit} {pub.name}
                  </a>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="bg-inkbrown text-cream rounded-sm p-8 relative grain">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4"><Mail className="w-7 h-7 text-byzgold" /><h2 className="font-serif text-3xl">{p.formTitle}</h2></div>
                <p className="text-cream/70 mb-6 leading-relaxed">{p.hint}</p>
                <form onSubmit={subscribe} className="space-y-4" data-testid="newsletter-form">
                  <Input placeholder={p.name} value={name} onChange={(e) => setName(e.target.value)} data-testid="newsletter-name" className="bg-cream/10 border-byzgold/40 text-cream placeholder:text-cream/50 h-12 text-base" />
                  <Input type="email" required placeholder={p.email} value={email} onChange={(e) => setEmail(e.target.value)} data-testid="newsletter-email" className="bg-cream/10 border-byzgold/40 text-cream placeholder:text-cream/50 h-12 text-base" />
                  <button type="submit" disabled={loading} data-testid="newsletter-submit" className="w-full inline-flex items-center justify-center gap-2 bg-byzgold text-inkbrown px-7 py-4 rounded-sm font-semibold text-lg hover:bg-cream transition-colors disabled:opacity-60">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} {p.subscribe}
                  </button>
                </form>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
