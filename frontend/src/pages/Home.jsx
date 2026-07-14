import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { Reveal, LineReveal, Marquee, Parallax, Cross } from "@/components/motion";
import { useSiteContent } from "@/context/SiteContentContext";

const HERO = "https://customer-assets.emergentagent.com/job_flamboyant-chandrasekhar-7/artifacts/mb7fvvbc_WhatsApp%20Image%202026-07-13%20at%2017.43.39.jpeg";
const INTERIOR = "https://images.pexels.com/photos/19474821/pexels-photo-19474821.jpeg";
const CANDLES = "https://images.unsplash.com/photo-1476900164809-ff19b8ae5968";

export default function Home() {
  const { t, lang } = useLang();
  const { settings } = useSettings();
  const { pc, media } = useSiteContent();
  const wa = settings?.whatsapp_number;
  const heroTitle = pc("home", "hero_title", lang, "");
  const heroLines = heroTitle ? heroTitle.split("\n").filter(Boolean) : ["Sfântul Ierarh", "Nicolae", "din Sigmir"];

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-cream grain" data-testid="hero">
        <Parallax offset={60} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img src={media("home", "hero_image", HERO)} alt="Biserica din Sigmir" className="hero-sketch w-full max-w-5xl object-contain opacity-[0.22] md:opacity-30 mt-20" />
        </Parallax>

        <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 w-full pt-28 pb-20">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className="text-sm uppercase tracking-[0.3em] text-byzgold mb-6 flex items-center gap-3">
            <Cross className="w-2.5 h-5" /> {pc("home", "hero_kicker", lang, "Parohia Ortodoxă Română")}
          </motion.div>

          <h1 className="font-serif text-inkbrown text-5xl sm:text-6xl lg:text-[5.5rem] leading-[0.95] max-w-4xl mb-8">
            <LineReveal lines={heroLines} />
          </h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
            className="text-xl md:text-2xl text-inkbrown/70 max-w-2xl leading-relaxed mb-6 font-light">
            {pc("home", "hero_subtitle", lang, t.hero.subtitle)}
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.8 }}
            className="flex items-center gap-2 text-inkbrown/60 mb-10">
            <MapPin className="w-5 h-5 text-burgundy" />
            <span className="text-base">{t.location}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.8 }}
            className="flex flex-wrap items-center gap-4">
            <Link to="/despre" data-testid="hero-about-btn" className="inline-flex items-center gap-2 bg-inkbrown text-cream px-7 py-3.5 rounded-sm font-medium hover:bg-byzgold hover:text-inkbrown transition-colors duration-300">
              {t.hero.cta1} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/contact" data-testid="hero-contact-btn" className="inline-flex items-center gap-2 border border-byzgold text-inkbrown px-7 py-3.5 rounded-sm font-medium hover:bg-byzgold transition-colors duration-300">
              {t.hero.cta2}
            </Link>
            <Link to="/doneaza" data-testid="hero-donate-btn" className="inline-flex items-center gap-2 bg-byzgold text-inkbrown px-7 py-3.5 rounded-sm font-semibold hover:bg-burgundy hover:text-cream transition-colors duration-300">
              <Cross className="w-3 h-5" color="currentColor" /> {t.hero.cta3}
            </Link>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-inkbrown/50 flex flex-col items-center gap-2">
          {t.hero.scroll}
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-px h-8 bg-byzgold" />
        </motion.div>
      </section>

      <Marquee items={t.marquee} />

      {/* ABOUT teaser */}
      <section className="py-28 bg-cream" data-testid="home-about">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <Reveal>
              <div className="text-sm uppercase tracking-[0.25em] text-byzgold mb-4">01 — {t.home.aboutKicker}</div>
              <h2 className="font-serif text-4xl md:text-5xl text-inkbrown leading-tight mb-6">{t.home.aboutTitle}</h2>
              <p className="text-lg text-inkbrown/70 leading-relaxed mb-8">{t.home.aboutText}</p>
              <Link to="/despre/istoric" className="inline-flex items-center gap-2 text-burgundy font-medium border-b border-burgundy pb-1 hover:gap-3 transition-all" data-testid="home-about-link">
                {t.home.aboutLink} <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
          <div className="lg:col-span-6">
            <Reveal delay={0.15}>
              <div className="relative">
                <img src={INTERIOR} alt="Interior biserică" className="w-full h-[480px] object-cover rounded-sm" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-byzgold/50 -z-0" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* NEWS teaser */}
      <section className="py-28 bg-creamalt relative grain" data-testid="home-news">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
          <Reveal>
            <div className="text-sm uppercase tracking-[0.25em] text-byzgold mb-4">02 — {t.home.newsKicker}</div>
            <h2 className="font-serif text-4xl md:text-5xl text-inkbrown leading-tight mb-6 max-w-2xl">{pc("home", "news_title", lang, t.home.newsTitle)}</h2>
            <p className="text-lg text-inkbrown/70 leading-relaxed mb-10 max-w-2xl">{pc("home", "news_text", lang, t.home.newsText)}</p>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            <Reveal>
              <Link to="/anunturi" data-testid="home-announcements-link" className="group block bg-cream border border-byzgold/30 p-10 rounded-sm hover:border-byzgold transition-colors h-full">
                <Cross className="w-4 h-7 mb-5" />
                <h3 className="font-serif text-2xl text-inkbrown mb-3">{t.nav.announcements}</h3>
                <span className="inline-flex items-center gap-2 text-burgundy group-hover:gap-3 transition-all">{t.home.seeAnnouncements} <ArrowRight className="w-4 h-4" /></span>
              </Link>
            </Reveal>
            <Reveal delay={0.12}>
              <Link to="/revista" data-testid="home-magazine-link" className="group block bg-cream border border-byzgold/30 p-10 rounded-sm hover:border-byzgold transition-colors h-full">
                <Cross className="w-4 h-7 mb-5" />
                <h3 className="font-serif text-2xl text-inkbrown mb-3">{t.nav.magazine}</h3>
                <span className="inline-flex items-center gap-2 text-burgundy group-hover:gap-3 transition-all">{t.home.seeMagazine} <ArrowRight className="w-4 h-4" /></span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* RENOVATION teaser */}
      <section className="py-32 bg-burgundy text-cream relative grain" data-testid="home-renovation">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-5">
            <Reveal>
              <img src={media("home", "renovation_image", CANDLES)} alt="Lumânări" className="w-full h-[420px] object-cover rounded-sm" />
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              <div className="text-sm uppercase tracking-[0.25em] text-byzgold mb-4">03 — {t.home.renovKicker}</div>
              <h2 className="font-serif text-4xl md:text-6xl leading-tight mb-6">{pc("home", "renov_title", lang, t.home.renovTitle)}</h2>
              <p className="text-lg text-cream/80 leading-relaxed mb-8 max-w-xl">{pc("home", "renov_text", lang, t.home.renovText)}</p>
              <Link to="/renovare" data-testid="home-renovation-link" className="inline-flex items-center gap-2 bg-byzgold text-inkbrown px-7 py-3.5 rounded-sm font-semibold hover:bg-cream transition-colors">
                {t.home.renovLink} <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CONTACT / WhatsApp */}
      <section className="py-28 bg-cream" data-testid="home-contact">
        <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
          <Reveal>
            <div className="flex justify-center mb-6"><Cross className="w-6 h-10" /></div>
            <div className="text-sm uppercase tracking-[0.25em] text-byzgold mb-4">04 — {t.home.contactKicker}</div>
            <h2 className="font-serif text-4xl md:text-5xl text-inkbrown leading-tight mb-6">{pc("home", "contact_title", lang, t.home.contactTitle)}</h2>
            <p className="text-lg text-inkbrown/70 leading-relaxed mb-10 max-w-2xl mx-auto">{pc("home", "contact_text", lang, t.home.contactText)}</p>
            {wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" data-testid="home-whatsapp-btn" className="inline-flex items-center gap-3 bg-forest text-cream px-8 py-4 rounded-sm font-semibold text-lg hover:bg-inkbrown transition-colors">
                <MessageCircle className="w-6 h-6" /> {t.home.whatsapp}
              </a>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
