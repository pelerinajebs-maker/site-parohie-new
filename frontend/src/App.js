import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "@/i18n";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { SiteContentProvider } from "@/context/SiteContentContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import { About, History, Community, ResourcesHub } from "@/pages/StaticPages";
import { ContentList, ContentDetail } from "@/pages/Content";
import CalendarPage from "@/pages/CalendarPage";
import Renovation from "@/pages/Renovation";
import Contact from "@/pages/Contact";
import Donate from "@/pages/Donate";
import Newsletter from "@/pages/Newsletter";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";

function Site({ children }) {
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <SettingsProvider>
          <SiteContentProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Site><Home /></Site>} />
              <Route path="/despre" element={<Site><About /></Site>} />
              <Route path="/despre/istoric" element={<Site><History /></Site>} />
              <Route path="/despre/comunitate" element={<Site><Community /></Site>} />

              <Route path="/revista" element={<Site><ContentList kind="magazine" base="/revista" pageKey="magazine" /></Site>} />
              <Route path="/revista/:id" element={<Site><ContentDetail base="/revista" /></Site>} />

              <Route path="/anunturi" element={<Site><ContentList kind="announcement" base="/anunturi" pageKey="announcements" /></Site>} />
              <Route path="/anunturi/:id" element={<Site><ContentDetail base="/anunturi" /></Site>} />

              <Route path="/renovare" element={<Site><Renovation /></Site>} />

              <Route path="/resurse" element={<Site><ResourcesHub /></Site>} />
              <Route path="/resurse/calendar" element={<Site><CalendarPage /></Site>} />
              <Route path="/resurse/hram" element={<Site><ContentList kind="resource" category="patron" base="/resurse/hram" pageKey="patron" /></Site>} />
              <Route path="/resurse/hram/:id" element={<Site><ContentDetail base="/resurse/hram" /></Site>} />
              <Route path="/resurse/cuvantul-preotului" element={<Site><ContentList kind="resource" category="priest" base="/resurse/cuvantul-preotului" pageKey="priest" /></Site>} />
              <Route path="/resurse/cuvantul-preotului/:id" element={<Site><ContentDetail base="/resurse/cuvantul-preotului" /></Site>} />
              <Route path="/resurse/catehizare" element={<Site><ContentList kind="resource" category="catechesis" base="/resurse/catehizare" pageKey="catechesis" /></Site>} />
              <Route path="/resurse/catehizare/:id" element={<Site><ContentDetail base="/resurse/catehizare" /></Site>} />
              <Route path="/resurse/rugaciuni" element={<Site><ContentList kind="resource" category="prayers" base="/resurse/rugaciuni" pageKey="prayers" /></Site>} />
              <Route path="/resurse/rugaciuni/:id" element={<Site><ContentDetail base="/resurse/rugaciuni" /></Site>} />
              <Route path="/resurse/newsletter" element={<Site><Newsletter /></Site>} />

              <Route path="/contact" element={<Site><Contact /></Site>} />
              <Route path="/doneaza" element={<Site><Donate /></Site>} />

              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </BrowserRouter>
          </SiteContentProvider>
        </SettingsProvider>
      </AuthProvider>
    </LangProvider>
  );
}

export default App;
