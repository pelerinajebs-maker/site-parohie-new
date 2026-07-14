import React, { createContext, useContext, useState, useCallback } from "react";

const dict = {
  ro: {
    parishShort: "Sfântul Ierarh Nicolae",
    parishFull: "Parohia Ortodoxă Română Sfântul Ierarh Nicolae din Sigmir",
    location: "Sigmir, Bistrița-Năsăud, România",
    nav: {
      home: "Acasă", about: "Despre parohie", history: "Istoric biserică",
      community: "Comunitate", magazine: "Revista parohială", announcements: "Anunțuri",
      renovation: "Renovare biserică", resources: "Resurse duhovnicești",
      calendar: "Calendar ortodox", patron: "Hramul parohiei", priest: "Cuvântul Preotului",
      catechesis: "Catehizare", prayers: "Rugăciuni", newsletter: "Newsletter", contact: "Contact", donate: "Donează",
    },
    hero: {
      subtitle: "O poartă digitală către comunitatea noastră — o casă de rugăciune, credință și lumină.",
      cta1: "Despre parohie", cta2: "Contact", cta3: "Donează",
      scroll: "Coboară",
    },
    marquee: ["Pace vouă", "Rugați-vă neîncetat", "Doamne miluiește", "Hristos în mijlocul nostru"],
    home: {
      aboutKicker: "Cine suntem", aboutTitle: "O comunitate de credință în Sigmir",
      aboutText: "Parohia noastră, ocrotită de Sfântul Ierarh Nicolae, este o familie duhovnicească adunată în jurul Sfântului Altar. Aici, tineri și vârstnici, deopotrivă, găsesc rugăciune, mângâiere și un rost.",
      aboutLink: "Descoperă istoricul",
      newsKicker: "Viața parohiei", newsTitle: "Anunțuri și revista parohială",
      newsText: "Rămâi aproape de viața comunității: evenimente, programul slujbelor și reflecții duhovnicești.",
      seeAnnouncements: "Vezi anunțurile", seeMagazine: "Citește revista",
      renovKicker: "Împreună zidim", renovTitle: "Renovarea bisericii",
      renovText: "Biserica noastră are nevoie de sprijinul tău. Fii părtaș la lucrarea de înnoire a casei Domnului.",
      renovLink: "Susține renovarea",
      contactKicker: "Legătură directă", contactTitle: "Vorbește cu preotul paroh",
      contactText: "Pentru întrebări pastorale, programări sau o vorbă bună, scrie-ne pe WhatsApp.",
      whatsapp: "Chat pe WhatsApp",
    },
    footer: {
      quickLinks: "Legături rapide",
      mission: "O parohie ortodoxă românească vie, deschisă tuturor celor ce caută pe Dumnezeu, în Sigmir și dincolo de hotare.",
      contact: "Contact", rights: "Toate drepturile rezervate.",
    },
    pages: {
      about: { title: "Despre parohie", intro: "Parohia Ortodoxă Română Sfântul Ierarh Nicolae este o comunitate de credincioși din Sigmir, adunată în jurul Sfintei Liturghii și a tradiției ortodoxe.", exploreHistory: "Istoric biserică", exploreCommunity: "Comunitate" },
      history: { title: "Istoric biserică", intro: "Istoria bisericii noastre este o mărturie a credinței înaintașilor.", p1: "Biserica din Sigmir a fost ridicată prin jertfa și dăruirea credincioșilor, ca loc de rugăciune și adunare a comunității.", p2: "De-a lungul deceniilor, sfântul lăcaș a fost martorul botezurilor, cununiilor și marilor sărbători, păstrând vie flacăra credinței ortodoxe." },
      community: { title: "Comunitate", intro: "O familie duhovnicească vie, cu grupuri și activități pentru toate vârstele.", groups: "Grupuri parohiale", activities: "Activități", g1: "Grupul tinerilor", g2: "Corul parohial", g3: "Comitetul de doamne", a1: "Activități catehetice pentru copii", a2: "Ajutorarea celor în nevoie", a3: "Evenimente culturale și pelerinaje" },
      magazine: { title: "Revista parohială", intro: "Edițiile și articolele revistei noastre parohiale." },
      announcements: { title: "Anunțuri", intro: "Evenimente viitoare, programul sărbătorilor și comunicate importante." },
      renovation: { title: "Renovare biserică", intro: "Proiectul de înnoire a sfântului lăcaș din Sigmir.", state: "Starea actuală", stateText: "Biserica necesită lucrări de consolidare, pictură și înnoire a interiorului liturgic.", goals: "Obiectivele renovării", g1: "Consolidarea structurii", g2: "Pictura bizantină a interiorului", g3: "Înnoirea mobilierului liturgic", gallery: "Galerie foto", support: "Cum poți ajuta", supportText: "Poți sprijini prin donații sau prin voluntariat. Orice ajutor, oricât de mic, este binecuvântat." },
      resources: { title: "Resurse duhovnicești", intro: "Hrană pentru suflet: calendar, rugăciuni, cuvinte pastorale și materiale de catehizare." },
      calendar: { title: "Calendar ortodox", intro: "Sărbători, sfinți și rânduiala postului pentru ziua aleasă.", pick: "Alege data", feast: "Sărbătoare", saints: "Sfinții zilei", fast: "Post", readings: "Citiri", loading: "Se încarcă din calendarul ortodox...", error: "Calendarul nu este disponibil momentan." },
      patron: { title: "Hramul parohiei", intro: "Sfântul Ierarh Nicolae, ocrotitorul parohiei noastre — prăznuit pe 6 decembrie." },
      priest: { title: "Cuvântul Preotului", intro: "Mesaje pastorale, reflecții și predici duminicale." },
      catechesis: { title: "Catehizare", intro: "Materiale și îndrumări pentru creșterea în credință." },
      prayers: { title: "Rugăciuni", intro: "O colecție de rugăciuni pentru fiecare vreme și trebuință." },
      newsletter: {
        title: "Newsletter duhovnicesc",
        intro: "Abonează-te și primește recomandări de lectură ortodoxă, articole și vești din viața parohiei.",
        pubTitle: "Publicații recomandate",
        pubText: "Îți recomandăm cu drag două publicații ortodoxe de referință din România:",
        lumina: "Ziarul Lumina — publicația Patriarhiei Române, cu știri, articole și cateheze zilnice.",
        renasterea: "Revista Renașterea — revista Arhiepiscopiei Vadului, Feleacului și Clujului.",
        visit: "Vizitează",
        formTitle: "Abonează-te la newsletter",
        name: "Nume (opțional)", email: "Adresa ta de email", subscribe: "Abonează-mă",
        success: "Te-ai abonat cu succes! Verifică emailul de confirmare.",
        already: "Ești deja abonat. Mulțumim!",
        hint: "Îți vom trimite un email de bun venit. Te poți dezabona oricând.",
      },
      contact: {
        title: "Contact", intro: "Suntem aproape de tine. Scrie-ne, sună-ne sau vino la biserică.",
        details: "Date de contact", address: "Adresă", phone: "Telefon", email: "Email", hours: "Program oficiu parohial",
        directTitle: "Legătură directă cu preotul paroh", directText: "Pentru întrebări pastorale, spovedanie, programări (botez, cununie, parastas) sau o vorbă de mângâiere, ne poți scrie oricând pe WhatsApp.",
        form: "Formular de contact", name: "Nume", message: "Mesaj", send: "Trimite mesajul", sent: "Mesajul a fost trimis. Mulțumim!",
      },
      donate: {
        title: "Donează", intro: "Sprijinul tău ține candela aprinsă. Îți mulțumim din inimă.",
        bankTitle: "Prin transfer bancar", holder: "Titular cont", bank: "Banca", externalTitle: "Donație online", externalText: "Poți dona rapid și securizat prin platforma noastră online.", externalBtn: "Donează online", copy: "Copiază IBAN", copied: "IBAN copiat!",
        cardTitle: "Donează cu cardul", cardText: "Sprijină parohia rapid și securizat, prin card bancar. Plata este procesată de Stripe.",
        donorName: "Numele tău (opțional)", donorEmail: "Email (pentru confirmare)", emailHint: "Îți vom trimite un email de mulțumire.",
        presets: { seed: "Sămânță", candle: "Lumânare", brick: "Cărămidă", pillar: "Stâlp" },
        custom: "Altă sumă (RON)", customPlaceholder: "ex. 150", payBtn: "Donează", processing: "Se procesează plata...", paidTitle: "Mulțumim din inimă!", paidText: "Donația ta a fost primită. Dumnezeu să te binecuvânteze!", failedText: "Plata nu a putut fi finalizată. Încearcă din nou.", selectAmount: "Alege o sumă mai întâi.",
      },
      login: { title: "Autentificare", subtitle: "Panou de administrare parohie", email: "Email", password: "Parolă", submit: "Intră în cont", error: "Autentificare eșuată" },
    },
    common: { readMore: "Citește mai mult", back: "Înapoi", loading: "Se încarcă...", empty: "Nu există înregistrări momentan." },
  },

  de: {
    parishShort: "Heiliger Nikolaus",
    parishFull: "Rumänisch-Orthodoxe Pfarrei Heiliger Nikolaus in Sigmir",
    location: "Sigmir, Bistrița-Năsăud, Rumänien",
    nav: {
      home: "Startseite", about: "Über die Pfarrei", history: "Geschichte der Kirche",
      community: "Gemeinschaft", magazine: "Pfarrblatt", announcements: "Ankündigungen",
      renovation: "Kirchenrenovierung", resources: "Geistliche Ressourcen",
      calendar: "Orthodoxer Kalender", patron: "Patronatsfest", priest: "Wort des Priesters",
      catechesis: "Katechese", prayers: "Gebete", newsletter: "Newsletter", contact: "Kontakt", donate: "Spenden",
    },
    hero: {
      subtitle: "Ein digitales Tor zu unserer Gemeinschaft — ein Haus des Gebets, des Glaubens und des Lichts.",
      cta1: "Über die Pfarrei", cta2: "Kontakt", cta3: "Spenden", scroll: "Nach unten",
    },
    marquee: ["Friede sei mit euch", "Betet ohne Unterlass", "Herr, erbarme dich", "Christus in unserer Mitte"],
    home: {
      aboutKicker: "Wer wir sind", aboutTitle: "Eine Glaubensgemeinschaft in Sigmir",
      aboutText: "Unsere Pfarrei, unter dem Schutz des heiligen Nikolaus, ist eine geistliche Familie rund um den heiligen Altar. Hier finden Jung und Alt Gebet, Trost und Sinn.",
      aboutLink: "Geschichte entdecken",
      newsKicker: "Leben der Pfarrei", newsTitle: "Ankündigungen und Pfarrblatt",
      newsText: "Bleiben Sie dem Gemeindeleben nahe: Veranstaltungen, Gottesdienstzeiten und geistliche Betrachtungen.",
      seeAnnouncements: "Ankündigungen ansehen", seeMagazine: "Pfarrblatt lesen",
      renovKicker: "Gemeinsam bauen", renovTitle: "Renovierung der Kirche",
      renovText: "Unsere Kirche braucht Ihre Unterstützung. Werden Sie Teil der Erneuerung des Hauses Gottes.",
      renovLink: "Renovierung unterstützen",
      contactKicker: "Direkter Kontakt", contactTitle: "Sprechen Sie mit dem Pfarrer",
      contactText: "Für seelsorgerische Fragen, Termine oder ein gutes Wort schreiben Sie uns per WhatsApp.",
      whatsapp: "Chat auf WhatsApp",
    },
    footer: {
      quickLinks: "Schnelllinks",
      mission: "Eine lebendige rumänisch-orthodoxe Pfarrei, offen für alle, die Gott suchen, in Sigmir und darüber hinaus.",
      contact: "Kontakt", rights: "Alle Rechte vorbehalten.",
    },
    pages: {
      about: { title: "Über die Pfarrei", intro: "Die Rumänisch-Orthodoxe Pfarrei Heiliger Nikolaus ist eine Gemeinschaft von Gläubigen in Sigmir, versammelt um die Göttliche Liturgie und die orthodoxe Tradition.", exploreHistory: "Geschichte der Kirche", exploreCommunity: "Gemeinschaft" },
      history: { title: "Geschichte der Kirche", intro: "Die Geschichte unserer Kirche ist ein Zeugnis des Glaubens der Vorfahren.", p1: "Die Kirche in Sigmir wurde durch die Opferbereitschaft der Gläubigen als Ort des Gebets errichtet.", p2: "Über die Jahrzehnte war das Gotteshaus Zeuge von Taufen, Trauungen und großen Festen." },
      community: { title: "Gemeinschaft", intro: "Eine lebendige geistliche Familie mit Gruppen und Aktivitäten für alle Altersgruppen.", groups: "Pfarrgruppen", activities: "Aktivitäten", g1: "Jugendgruppe", g2: "Kirchenchor", g3: "Frauenkomitee", a1: "Katechese für Kinder", a2: "Hilfe für Bedürftige", a3: "Kulturelle Veranstaltungen und Pilgerfahrten" },
      magazine: { title: "Pfarrblatt", intro: "Ausgaben und Artikel unseres Pfarrblatts." },
      announcements: { title: "Ankündigungen", intro: "Kommende Veranstaltungen, Festprogramme und wichtige Mitteilungen." },
      renovation: { title: "Kirchenrenovierung", intro: "Das Erneuerungsprojekt des Gotteshauses in Sigmir.", state: "Aktueller Zustand", stateText: "Die Kirche benötigt Verstärkung, Malerei und Erneuerung des liturgischen Innenraums.", goals: "Ziele der Renovierung", g1: "Verstärkung der Struktur", g2: "Byzantinische Innenmalerei", g3: "Erneuerung des liturgischen Mobiliars", gallery: "Fotogalerie", support: "Wie Sie helfen können", supportText: "Sie können durch Spenden oder Freiwilligenarbeit helfen. Jede Hilfe ist gesegnet." },
      resources: { title: "Geistliche Ressourcen", intro: "Nahrung für die Seele: Kalender, Gebete, pastorale Worte und Katechesematerial." },
      calendar: { title: "Orthodoxer Kalender", intro: "Feste, Heilige und Fastenordnung für den gewählten Tag.", pick: "Datum wählen", feast: "Fest", saints: "Heilige des Tages", fast: "Fasten", readings: "Lesungen", loading: "Wird aus dem orthodoxen Kalender geladen...", error: "Der Kalender ist derzeit nicht verfügbar." },
      patron: { title: "Patronatsfest", intro: "Der heilige Nikolaus, Schutzpatron unserer Pfarrei — gefeiert am 6. Dezember." },
      priest: { title: "Wort des Priesters", intro: "Pastorale Botschaften, Betrachtungen und Sonntagspredigten." },
      catechesis: { title: "Katechese", intro: "Materialien und Anleitungen zum Wachstum im Glauben." },
      prayers: { title: "Gebete", intro: "Eine Sammlung von Gebeten für jede Zeit und jedes Anliegen." },
      newsletter: {
        title: "Geistlicher Newsletter",
        intro: "Abonnieren Sie und erhalten Sie orthodoxe Leseempfehlungen, Artikel und Neuigkeiten aus dem Pfarrleben.",
        pubTitle: "Empfohlene Publikationen",
        pubText: "Wir empfehlen Ihnen herzlich zwei bedeutende orthodoxe Publikationen aus Rumänien:",
        lumina: "Ziarul Lumina — die Publikation des Rumänischen Patriarchats mit täglichen Nachrichten und Katechesen.",
        renasterea: "Revista Renașterea — die Zeitschrift der Erzdiözese von Cluj.",
        visit: "Besuchen",
        formTitle: "Newsletter abonnieren",
        name: "Name (optional)", email: "Ihre E-Mail-Adresse", subscribe: "Abonnieren",
        success: "Erfolgreich abonniert! Prüfen Sie die Bestätigungs-E-Mail.",
        already: "Sie sind bereits abonniert. Danke!",
        hint: "Wir senden Ihnen eine Willkommens-E-Mail. Sie können sich jederzeit abmelden.",
      },
      contact: {
        title: "Kontakt", intro: "Wir sind Ihnen nahe. Schreiben Sie uns, rufen Sie an oder kommen Sie zur Kirche.",
        details: "Kontaktdaten", address: "Adresse", phone: "Telefon", email: "E-Mail", hours: "Öffnungszeiten des Pfarrbüros",
        directTitle: "Direkter Kontakt mit dem Pfarrer", directText: "Für seelsorgerische Fragen, Beichte, Termine (Taufe, Trauung) oder ein tröstendes Wort schreiben Sie uns jederzeit per WhatsApp.",
        form: "Kontaktformular", name: "Name", message: "Nachricht", send: "Nachricht senden", sent: "Nachricht gesendet. Danke!",
      },
      donate: {
        title: "Spenden", intro: "Ihre Unterstützung hält die Kerze am Brennen. Herzlichen Dank.",
        bankTitle: "Per Banküberweisung", holder: "Kontoinhaber", bank: "Bank", externalTitle: "Online-Spende", externalText: "Spenden Sie schnell und sicher über unsere Online-Plattform.", externalBtn: "Online spenden", copy: "IBAN kopieren", copied: "IBAN kopiert!",
        cardTitle: "Mit Karte spenden", cardText: "Unterstützen Sie die Pfarrei schnell und sicher per Bankkarte. Die Zahlung wird von Stripe verarbeitet.",
        donorName: "Ihr Name (optional)", donorEmail: "E-Mail (für Bestätigung)", emailHint: "Wir senden Ihnen eine Dankes-E-Mail.",
        presets: { seed: "Samen", candle: "Kerze", brick: "Ziegel", pillar: "Säule" },
        custom: "Anderer Betrag (RON)", customPlaceholder: "z. B. 150", payBtn: "Spenden", processing: "Zahlung wird verarbeitet...", paidTitle: "Herzlichen Dank!", paidText: "Ihre Spende ist eingegangen. Gott segne Sie!", failedText: "Die Zahlung konnte nicht abgeschlossen werden. Bitte erneut versuchen.", selectAmount: "Bitte zuerst einen Betrag wählen.",
      },
      login: { title: "Anmeldung", subtitle: "Verwaltungsbereich der Pfarrei", email: "E-Mail", password: "Passwort", submit: "Anmelden", error: "Anmeldung fehlgeschlagen" },
    },
    common: { readMore: "Weiterlesen", back: "Zurück", loading: "Wird geladen...", empty: "Derzeit keine Einträge." },
  },

  en: {
    parishShort: "St Nicholas",
    parishFull: "Romanian Orthodox Parish of St Nicholas in Sigmir",
    location: "Sigmir, Bistrița-Năsăud, Romania",
    nav: {
      home: "Home", about: "About the Parish", history: "Church History",
      community: "Community", magazine: "Parish Magazine", announcements: "Announcements",
      renovation: "Church Renovation", resources: "Spiritual Resources",
      calendar: "Orthodox Calendar", patron: "Patron Feast", priest: "Priest's Word",
      catechesis: "Catechesis", prayers: "Prayers", newsletter: "Newsletter", contact: "Contact", donate: "Donate",
    },
    hero: {
      subtitle: "A digital gateway to our community — a house of prayer, faith and light.",
      cta1: "About the Parish", cta2: "Contact", cta3: "Donate", scroll: "Scroll",
    },
    marquee: ["Peace be with you", "Pray without ceasing", "Lord, have mercy", "Christ in our midst"],
    home: {
      aboutKicker: "Who we are", aboutTitle: "A community of faith in Sigmir",
      aboutText: "Our parish, under the protection of St Nicholas, is a spiritual family gathered around the holy altar. Here, young and old alike find prayer, comfort and meaning.",
      aboutLink: "Discover our history",
      newsKicker: "Parish life", newsTitle: "Announcements and the parish magazine",
      newsText: "Stay close to the life of the community: events, service schedules and spiritual reflections.",
      seeAnnouncements: "See announcements", seeMagazine: "Read the magazine",
      renovKicker: "Building together", renovTitle: "Renovating the church",
      renovText: "Our church needs your support. Be part of the renewal of the house of the Lord.",
      renovLink: "Support the renovation",
      contactKicker: "Direct contact", contactTitle: "Speak with the parish priest",
      contactText: "For pastoral questions, appointments or a kind word, message us on WhatsApp.",
      whatsapp: "Chat on WhatsApp",
    },
    footer: {
      quickLinks: "Quick links",
      mission: "A living Romanian Orthodox parish, open to all who seek God, in Sigmir and beyond.",
      contact: "Contact", rights: "All rights reserved.",
    },
    pages: {
      about: { title: "About the Parish", intro: "The Romanian Orthodox Parish of St Nicholas is a community of the faithful in Sigmir, gathered around the Divine Liturgy and Orthodox tradition.", exploreHistory: "Church History", exploreCommunity: "Community" },
      history: { title: "Church History", intro: "The history of our church is a testimony to the faith of our forebears.", p1: "The church in Sigmir was built through the sacrifice of the faithful as a place of prayer and gathering.", p2: "Over the decades, the holy place has witnessed baptisms, weddings and great feasts, keeping the flame of Orthodox faith alive." },
      community: { title: "Community", intro: "A living spiritual family with groups and activities for all ages.", groups: "Parish groups", activities: "Activities", g1: "Youth group", g2: "Parish choir", g3: "Ladies' committee", a1: "Catechesis for children", a2: "Helping those in need", a3: "Cultural events and pilgrimages" },
      magazine: { title: "Parish Magazine", intro: "Editions and articles of our parish magazine." },
      announcements: { title: "Announcements", intro: "Upcoming events, feast schedules and important notices." },
      renovation: { title: "Church Renovation", intro: "The renewal project of the holy church in Sigmir.", state: "Current state", stateText: "The church requires consolidation, painting and renewal of the liturgical interior.", goals: "Renovation goals", g1: "Structural consolidation", g2: "Byzantine interior painting", g3: "Renewal of liturgical furnishings", gallery: "Photo gallery", support: "How you can help", supportText: "You can help through donations or volunteering. Every gift, however small, is blessed." },
      resources: { title: "Spiritual Resources", intro: "Nourishment for the soul: calendar, prayers, pastoral words and catechesis material." },
      calendar: { title: "Orthodox Calendar", intro: "Feasts, saints and the fasting rule for the chosen day.", pick: "Choose a date", feast: "Feast", saints: "Saints of the day", fast: "Fast", readings: "Readings", loading: "Loading from the Orthodox calendar...", error: "The calendar is currently unavailable." },
      patron: { title: "Patron Feast", intro: "St Nicholas the Wonderworker, patron of our parish — celebrated on December 6th." },
      priest: { title: "Priest's Word", intro: "Pastoral messages, reflections and Sunday sermons." },
      catechesis: { title: "Catechesis", intro: "Materials and guidance for growth in faith." },
      prayers: { title: "Prayers", intro: "A collection of prayers for every time and need." },
      newsletter: {
        title: "Spiritual Newsletter",
        intro: "Subscribe and receive Orthodox reading recommendations, articles and news from parish life.",
        pubTitle: "Recommended publications",
        pubText: "We warmly recommend two leading Orthodox publications from Romania:",
        lumina: "Ziarul Lumina — the publication of the Romanian Patriarchate, with daily news and catechesis.",
        renasterea: "Revista Renașterea — the magazine of the Archdiocese of Cluj.",
        visit: "Visit",
        formTitle: "Subscribe to the newsletter",
        name: "Name (optional)", email: "Your email address", subscribe: "Subscribe",
        success: "Successfully subscribed! Check your confirmation email.",
        already: "You are already subscribed. Thank you!",
        hint: "We'll send you a welcome email. You can unsubscribe anytime.",
      },
      contact: {
        title: "Contact", intro: "We are close to you. Write to us, call us, or come to church.",
        details: "Contact details", address: "Address", phone: "Phone", email: "Email", hours: "Parish office hours",
        directTitle: "Direct contact with the parish priest", directText: "For pastoral questions, confession, appointments (baptism, wedding) or a word of comfort, message us anytime on WhatsApp.",
        form: "Contact form", name: "Name", message: "Message", send: "Send message", sent: "Message sent. Thank you!",
      },
      donate: {
        title: "Donate", intro: "Your support keeps the candle burning. Thank you from the heart.",
        bankTitle: "By bank transfer", holder: "Account holder", bank: "Bank", externalTitle: "Online donation", externalText: "Donate quickly and securely through our online platform.", externalBtn: "Donate online", copy: "Copy IBAN", copied: "IBAN copied!",
        cardTitle: "Donate by card", cardText: "Support the parish quickly and securely by bank card. Payment is processed by Stripe.",
        donorName: "Your name (optional)", donorEmail: "Email (for confirmation)", emailHint: "We'll send you a thank-you email.",
        presets: { seed: "Seed", candle: "Candle", brick: "Brick", pillar: "Pillar" },
        custom: "Other amount (RON)", customPlaceholder: "e.g. 150", payBtn: "Donate", processing: "Processing payment...", paidTitle: "Thank you from the heart!", paidText: "Your donation has been received. God bless you!", failedText: "The payment could not be completed. Please try again.", selectAmount: "Please choose an amount first.",
      },
      login: { title: "Sign in", subtitle: "Parish administration panel", email: "Email", password: "Password", submit: "Sign in", error: "Login failed" },
    },
    common: { readMore: "Read more", back: "Back", loading: "Loading...", empty: "No entries at the moment." },
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  // Site is Romanian-only. Lang is locked to "ro".
  const [lang, setLangState] = useState("ro");
  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  }, []);
  const t = dict[lang] || dict.ro;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

// pick multilingual field with fallback to ro
export function ml(obj, lang) {
  if (!obj) return "";
  return obj[lang] || obj.ro || obj.en || obj.de || "";
}
