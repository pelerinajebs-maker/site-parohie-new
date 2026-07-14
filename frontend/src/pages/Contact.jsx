import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useLang, ml } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { PageHero } from "@/components/Layout";
import { Reveal, Cross } from "@/components/motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  const { t, lang } = useLang();
  const p = t.pages.contact;
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const wa = settings?.whatsapp_number;

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/contact", form);
      toast.success(p.sent);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally { setSending(false); }
  };

  const mapSrc = "https://www.google.com/maps?q=Sigmir,+Bistrita-Nasaud,+Romania&output=embed";

  return (
    <div data-testid="contact-page">
      <PageHero kicker={t.nav.contact} title={p.title} intro={p.intro} />

      <section className="py-16 bg-cream">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12">
          <Reveal>
            <h3 className="font-serif text-3xl text-inkbrown mb-6">{p.details}</h3>
            <ul className="space-y-5 text-lg text-inkbrown/80">
              {settings?.address && <li className="flex gap-4"><MapPin className="w-6 h-6 text-byzgold shrink-0" /><span><span className="block text-sm text-byzgold uppercase tracking-wide">{p.address}</span>{settings.address}</span></li>}
              {settings?.phone && <li className="flex gap-4"><Phone className="w-6 h-6 text-byzgold shrink-0" /><span><span className="block text-sm text-byzgold uppercase tracking-wide">{p.phone}</span>{settings.phone}</span></li>}
              {settings?.email && <li className="flex gap-4"><Mail className="w-6 h-6 text-byzgold shrink-0" /><span><span className="block text-sm text-byzgold uppercase tracking-wide">{p.email}</span>{settings.email}</span></li>}
              {settings && ml(settings.office_hours, lang) && <li className="flex gap-4"><Clock className="w-6 h-6 text-byzgold shrink-0" /><span><span className="block text-sm text-byzgold uppercase tracking-wide">{p.hours}</span>{ml(settings.office_hours, lang)}</span></li>}
            </ul>
            <p className="mt-6 text-inkbrown/60 italic">{t.parishFull}</p>

            <div className="mt-8 border border-byzgold/30 rounded-sm overflow-hidden h-64">
              <iframe title="map" src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" data-testid="contact-map" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="bg-forest text-cream p-8 rounded-sm mb-8">
              <div className="flex items-center gap-3 mb-3"><MessageCircle className="w-7 h-7 text-byzgold" /><h3 className="font-serif text-2xl">{p.directTitle}</h3></div>
              <p className="text-cream/80 mb-6 leading-relaxed">{p.directText}</p>
              {wa && (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" data-testid="contact-whatsapp-btn" className="inline-flex items-center gap-2 bg-byzgold text-inkbrown px-6 py-3 rounded-sm font-semibold hover:bg-cream transition-colors">
                  <MessageCircle className="w-5 h-5" /> {t.home.whatsapp}
                </a>
              )}
            </div>

            <h3 className="font-serif text-3xl text-inkbrown mb-5">{p.form}</h3>
            <form onSubmit={submit} className="space-y-4" data-testid="contact-form">
              <Input required placeholder={p.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name" className="bg-creamalt border-byzgold/30 h-12 text-base" />
              <Input required type="email" placeholder={p.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email" className="bg-creamalt border-byzgold/30 h-12 text-base" />
              <Textarea required placeholder={p.message} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message" className="bg-creamalt border-byzgold/30 text-base" />
              <button type="submit" disabled={sending} data-testid="contact-submit" className="inline-flex items-center gap-2 bg-inkbrown text-cream px-7 py-3.5 rounded-sm font-medium hover:bg-byzgold hover:text-inkbrown transition-colors disabled:opacity-60">
                <Send className="w-4 h-4" /> {p.send}
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
