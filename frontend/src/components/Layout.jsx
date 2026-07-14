import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { useLang, ml } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { Cross } from "@/components/motion";

const langs = ["ro", "de", "en"];

function useNav() {
  const { t } = useLang();
  return [
    { to: "/", label: t.nav.home },
    { to: "/despre", label: t.nav.about, children: [
      { to: "/despre/istoric", label: t.nav.history },
      { to: "/despre/comunitate", label: t.nav.community },
    ]},
    { to: "/revista", label: t.nav.magazine },
    { to: "/anunturi", label: t.nav.announcements },
    { to: "/renovare", label: t.nav.renovation },
    { to: "/resurse", label: t.nav.resources, children: [
      { to: "/resurse/calendar", label: t.nav.calendar },
      { to: "/resurse/hram", label: t.nav.patron },
      { to: "/resurse/cuvantul-preotului", label: t.nav.priest },
      { to: "/resurse/catehizare", label: t.nav.catechesis },
      { to: "/resurse/rugaciuni", label: t.nav.prayers },
    ]},
    { to: "/contact", label: t.nav.contact },
  ];
}

function DonateButton({ testid, className = "" }) {
  const { settings } = useSettings();
  const { lang, t } = useLang();
  if (settings && settings.donation_enabled === false) return null;
  const label = settings ? ml(settings.donation_button_text, lang) || t.nav.donate : t.nav.donate;
  return (
    <Link
      to="/doneaza"
      data-testid={testid}
      className={`inline-flex items-center gap-2 bg-byzgold text-inkbrown px-5 py-2.5 rounded-sm font-semibold tracking-wide hover:bg-inkbrown hover:text-byzgold transition-colors duration-300 ${className}`}
    >
      <Cross className="w-3 h-5" color="currentColor" />
      {label}
    </Link>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-1" data-testid="lang-switcher">
      {langs.map((l) => (
        <button
          key={l}
          data-testid={`lang-${l}`}
          onClick={() => setLang(l)}
          className={`px-2 py-1 text-xs uppercase tracking-widest transition-colors ${
            lang === l ? "text-byzgold font-bold" : "text-inkbrown/50 hover:text-inkbrown"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Navbar() {
  const nav = useNav();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openSub, setOpenSub] = useState(null);
  const loc = useLocation();

  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-cream/90 backdrop-blur-xl border-b border-byzgold/30 shadow-sm" : "bg-cream/70 backdrop-blur-md"
      }`}
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3 shrink-0" data-testid="logo-link">
          <Cross className="w-6 h-10" />
          <div className="leading-tight">
            <div className="font-serif text-xl text-inkbrown">{t.parishShort}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-byzgold">Sigmir · BN</div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-1" data-testid="desktop-nav">
          {nav.map((item) => (
            <div key={item.to} className="relative group">
              <Link
                to={item.to}
                className="flex items-center gap-1 px-3 py-2 text-sm text-inkbrown hover:text-byzgold transition-colors"
                data-testid={`nav-${item.to}`}
              >
                {item.label}
                {item.children && <ChevronDown className="w-3 h-3" />}
              </Link>
              {item.children && (
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="bg-cream border border-byzgold/30 rounded-sm shadow-lg py-2 min-w-[240px]">
                    {item.children.map((c) => (
                      <Link key={c.to} to={c.to} className="block px-4 py-2 text-sm text-inkbrown hover:bg-creamalt hover:text-byzgold transition-colors" data-testid={`nav-${c.to}`}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-4">
          <LangSwitcher />
          <DonateButton testid="header-donate-btn" />
        </div>

        <button className="xl:hidden text-inkbrown" onClick={() => setOpen(true)} data-testid="mobile-menu-open" aria-label="Menu">
          <Menu className="w-7 h-7" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
            className="fixed inset-0 z-50 bg-cream xl:hidden overflow-y-auto"
            data-testid="mobile-menu"
          >
            <div className="flex items-center justify-between h-20 px-5 border-b border-byzgold/30">
              <span className="font-serif text-xl">{t.parishShort}</span>
              <button onClick={() => setOpen(false)} data-testid="mobile-menu-close"><X className="w-7 h-7" /></button>
            </div>
            <div className="px-5 py-6 space-y-1">
              {nav.map((item) => (
                <div key={item.to} className="border-b border-byzgold/10">
                  <div className="flex items-center justify-between">
                    <Link to={item.to} className="py-3 text-lg text-inkbrown" data-testid={`mnav-${item.to}`}>{item.label}</Link>
                    {item.children && (
                      <button onClick={() => setOpenSub(openSub === item.to ? null : item.to)} className="p-2">
                        <ChevronDown className={`w-5 h-5 transition-transform ${openSub === item.to ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                  {item.children && openSub === item.to && (
                    <div className="pb-3 pl-4 space-y-1">
                      {item.children.map((c) => (
                        <Link key={c.to} to={c.to} className="block py-2 text-base text-inkbrown/80" data-testid={`mnav-${c.to}`}>{c.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-6 flex items-center justify-between">
                <LangSwitcher />
                <DonateButton testid="mobile-donate-btn" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  const { t, lang } = useLang();
  const { settings } = useSettings();
  const nav = useNav();
  return (
    <footer className="bg-inkbrown text-cream/90 relative grain" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-20 grid md:grid-cols-3 gap-12 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <Cross className="w-6 h-10" />
            <span className="font-serif text-2xl">{t.parishShort}</span>
          </div>
          <p className="text-cream/70 leading-relaxed text-base">{t.footer.mission}</p>
          <div className="flex items-center gap-2 mt-5 text-byzgold">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{t.location}</span>
          </div>
        </div>
        <div>
          <h4 className="font-serif text-xl text-byzgold mb-4">{t.footer.quickLinks}</h4>
          <ul className="space-y-2">
            {nav.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-cream/70 hover:text-byzgold transition-colors text-base">{n.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-xl text-byzgold mb-4">{t.footer.contact}</h4>
          <ul className="space-y-3 text-cream/70 text-base">
            {settings?.phone && <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-byzgold" />{settings.phone}</li>}
            {settings?.email && <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-byzgold" />{settings.email}</li>}
            {settings?.whatsapp_number && (
              <li>
                <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-byzgold transition-colors" data-testid="footer-whatsapp">
                  <MessageCircle className="w-4 h-4 text-byzgold" /> WhatsApp
                </a>
              </li>
            )}
          </ul>
          <div className="mt-6"><DonateButton testid="footer-donate-btn" /></div>
        </div>
      </div>
      <div className="byz-rule" />
      <div className="text-center py-6 text-xs text-cream/50 tracking-wider relative z-10">
        © {new Date().getFullYear()} {t.parishFull}. {t.footer.rights}
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  const { settings } = useSettings();
  if (!settings?.whatsapp_number) return null;
  return (
    <a
      href={`https://wa.me/${settings.whatsapp_number}`}
      target="_blank" rel="noreferrer"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-forest text-cream flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-300"
      data-testid="whatsapp-float" aria-label="WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}

export default function Layout({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.09, smoothWheel: true }}>
      <div className="App min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </div>
    </ReactLenis>
  );
}

// Reusable page hero for internal pages
export function PageHero({ kicker, title, intro }) {
  return (
    <section className="pt-36 pb-16 bg-creamalt relative grain overflow-hidden" data-testid="page-hero">
      <div className="max-w-5xl mx-auto px-5 lg:px-8 relative z-10">
        {kicker && <div className="text-sm uppercase tracking-[0.25em] text-byzgold mb-4 flex items-center gap-3"><Cross className="w-2.5 h-5" />{kicker}</div>}
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
          className="font-serif text-5xl md:text-6xl text-inkbrown leading-none mb-6"
        >{title}</motion.h1>
        {intro && <p className="text-lg md:text-xl text-inkbrown/70 max-w-3xl leading-relaxed">{intro}</p>}
        <div className="byz-rule mt-10 max-w-xs" />
      </div>
    </section>
  );
}
