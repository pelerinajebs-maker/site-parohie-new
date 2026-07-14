import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Copy, ExternalLink, Landmark, CreditCard, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useLang } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { PageHero } from "@/components/Layout";
import { Reveal, Cross } from "@/components/motion";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { id: "seed", amount: 50 },
  { id: "candle", amount: 100 },
  { id: "brick", amount: 250 },
  { id: "pillar", amount: 500 },
];

function StripePanel() {
  const { t } = useLang();
  const p = t.pages.donate;
  const [selected, setSelected] = useState("candle");
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const body = { origin_url: window.location.origin };
      if (selected === "custom") {
        const amt = parseFloat(custom);
        if (!amt || amt <= 0) { toast.error(p.selectAmount); setLoading(false); return; }
        body.custom_amount = amt;
      } else {
        body.package_id = selected;
      }
      const { data } = await api.post("/donations/checkout", body);
      if (data.url) window.location.href = data.url;
      else throw new Error("no url");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
      setLoading(false);
    }
  };

  return (
    <div className="bg-cream border border-byzgold/30 rounded-sm p-8 h-full" data-testid="stripe-panel">
      <div className="flex items-center gap-3 mb-4"><CreditCard className="w-7 h-7 text-byzgold" /><h3 className="font-serif text-2xl text-inkbrown">{p.cardTitle}</h3></div>
      <p className="text-inkbrown/70 mb-6 leading-relaxed">{p.cardText}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setSelected(preset.id)}
            data-testid={`donate-preset-${preset.id}`}
            className={`px-4 py-4 rounded-sm border text-left transition-colors ${
              selected === preset.id ? "bg-byzgold border-byzgold text-inkbrown" : "border-byzgold/30 text-inkbrown hover:border-byzgold"
            }`}
          >
            <div className="text-xs uppercase tracking-wide opacity-70">{p.presets[preset.id]}</div>
            <div className="font-serif text-2xl">{preset.amount} <span className="text-sm">RON</span></div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setSelected("custom")}
        className={`w-full text-left px-4 py-3 rounded-sm border mb-4 transition-colors ${selected === "custom" ? "border-byzgold bg-creamalt" : "border-byzgold/30"}`}
        data-testid="donate-preset-custom"
      >
        <span className="text-sm text-inkbrown/70">{p.custom}</span>
      </button>
      {selected === "custom" && (
        <Input type="number" min="5" placeholder={p.customPlaceholder} value={custom} onChange={(e) => setCustom(e.target.value)} className="bg-creamalt border-byzgold/30 mb-4 h-12 text-base" data-testid="donate-custom-input" />
      )}

      <button onClick={pay} disabled={loading} data-testid="donate-card-btn" className="w-full inline-flex items-center justify-center gap-2 bg-inkbrown text-cream px-7 py-4 rounded-sm font-semibold text-lg hover:bg-byzgold hover:text-inkbrown transition-colors disabled:opacity-60">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {p.processing}</> : <><CreditCard className="w-5 h-5" /> {p.payBtn}</>}
      </button>
    </div>
  );
}

function ReturnStatus() {
  const { t } = useLang();
  const p = t.pages.donate;
  const [params] = useSearchParams();
  const nav = useNavigate();
  const sessionId = params.get("session_id");
  const [state, setState] = useState("checking"); // checking | paid | failed
  const [tries, setTries] = useState(0);

  const poll = useCallback(async (attempt) => {
    if (attempt >= 6) { setState("failed"); return; }
    try {
      const { data } = await api.get(`/donations/status/${sessionId}`);
      if (data.payment_status === "paid") { setState("paid"); toast.success(p.paidTitle); return; }
      if (data.status === "expired") { setState("failed"); return; }
      setTimeout(() => setTries(attempt + 1), 2000);
    } catch {
      setTimeout(() => setTries(attempt + 1), 2000);
    }
  }, [sessionId, p.paidTitle]);

  useEffect(() => { if (sessionId) poll(tries); }, [tries, sessionId, poll]);

  if (!sessionId) return null;

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-8 mb-4" data-testid="donation-return">
      <div className={`rounded-sm p-6 border ${state === "paid" ? "bg-forest text-cream border-forest" : state === "failed" ? "bg-burgundy text-cream border-burgundy" : "bg-creamalt border-byzgold/30"}`}>
        {state === "checking" && <div className="flex items-center gap-3 text-inkbrown"><Loader2 className="w-6 h-6 animate-spin text-byzgold" /> {p.processing}</div>}
        {state === "paid" && <div className="flex items-start gap-3"><CheckCircle2 className="w-7 h-7 shrink-0" /><div><div className="font-serif text-2xl">{p.paidTitle}</div><p className="text-cream/85">{p.paidText}</p></div></div>}
        {state === "failed" && <div className="flex items-start gap-3"><XCircle className="w-7 h-7 shrink-0" /><div><p>{p.failedText}</p></div></div>}
      </div>
      {state !== "checking" && (
        <button onClick={() => nav("/doneaza")} className="mt-3 text-sm text-burgundy underline" data-testid="donation-return-clear">OK</button>
      )}
    </div>
  );
}

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
        <ReturnStatus />
        <div className="max-w-6xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-8">
          <Reveal><StripePanel /></Reveal>

          <Reveal delay={0.1}>
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

              {settings?.donation_external_link && (
                <div className="mt-8 pt-6 border-t border-byzgold/20">
                  <p className="text-inkbrown/70 mb-3">{p.externalText}</p>
                  <a href={settings.donation_external_link} target="_blank" rel="noreferrer" data-testid="donate-external-btn" className="inline-flex items-center gap-2 text-royal font-medium hover:text-byzgold transition-colors">
                    <ExternalLink className="w-4 h-4" /> {p.externalBtn}
                  </a>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
