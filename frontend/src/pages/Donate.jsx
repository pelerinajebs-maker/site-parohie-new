import React from "react";
import { Copy, ExternalLink, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { PageHero } from "@/components/Layout";
import { Reveal, Cross } from "@/components/motion";

export default function Donate() {
  const { t } = useLang();
  const p = t.pages.donate;
  const { settings } = useSettings();

  const copyIban = () => {
    if (settings?.iban) {
      navigator.clipboard.writeText(settings.iban);
      toast.success(p.copied);
    }
  };

  return (
    <div data-testid="donate-page">
      <PageHero kicker={t.nav.donate} title={p.title} intro={p.intro} />
      <section className="py-16 bg-cream">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 grid md:grid-cols-2 gap-8">
          <Reveal>
            <div className="bg-creamalt border border-byzgold/30 rounded-sm p-8 h-full">
              <div className="flex items-center gap-3 mb-6"><Landmark className="w-7 h-7 text-byzgold" /><h3 className="font-serif text-2xl text-inkbrown">{p.bankTitle}</h3></div>
              <dl className="space-y-4 text-inkbrown/85">
                <div>
                  <dt className="text-sm uppercase tracking-wide text-byzgold">IBAN</dt>
                  <dd className="font-mono text-lg break-all" data-testid="donate-iban">{settings?.iban}</dd>
                </div>
                <div><dt className="text-sm uppercase tracking-wide text-byzgold">{p.holder}</dt><dd className="text-lg">{settings?.account_holder}</dd></div>
                <div><dt className="text-sm uppercase tracking-wide text-byzgold">{p.bank}</dt><dd className="text-lg">{settings?.bank_name}</dd></div>
              </dl>
              <button onClick={copyIban} data-testid="donate-copy-iban" className="mt-6 inline-flex items-center gap-2 border border-byzgold text-inkbrown px-5 py-2.5 rounded-sm hover:bg-byzgold transition-colors">
                <Copy className="w-4 h-4" /> {p.copy}
              </button>
            </div>
          </Reveal>

          {settings?.donation_external_link && (
            <Reveal delay={0.1}>
              <div className="bg-burgundy text-cream rounded-sm p-8 h-full flex flex-col relative grain">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6"><Cross className="w-6 h-10" /><h3 className="font-serif text-2xl">{p.externalTitle}</h3></div>
                  <p className="text-cream/80 leading-relaxed mb-8 flex-1">{p.externalText}</p>
                  <a href={settings.donation_external_link} target="_blank" rel="noreferrer" data-testid="donate-external-btn" className="inline-flex items-center justify-center gap-2 bg-byzgold text-inkbrown px-7 py-4 rounded-sm font-semibold text-lg hover:bg-cream transition-colors">
                    <ExternalLink className="w-5 h-5" /> {p.externalBtn}
                  </a>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  );
}
