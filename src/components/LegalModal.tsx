import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Database,
  FileText,
  UserRound,
  Mail,
  Scale,
  Server,
  Cookie,
  Globe,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  legalContactEmail,
  legalOperatorName,
  legalOperatorAddress,
  LEGAL_NOTICE_VERSION,
} from '../legal';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LegalCategory = 'all' | 'impressum' | 'privacy' | 'hosting' | 'google' | 'rights';

const CATEGORY_TABS: { id: LegalCategory; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'impressum', label: 'Impressum (§ 5 DDG)' },
  { id: 'privacy', label: 'Datenschutz (DSGVO)' },
  { id: 'hosting', label: 'Hosting (Render & Neon SQL)' },
  { id: 'google', label: 'Google Sign-In' },
  { id: 'rights', label: 'Cookies & Rechte' },
];

const Section: React.FC<{
  id: string;
  title: string;
  badge?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, title, badge, icon, children }) => (
  <section
    className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-950/65 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:border-white/15"
    aria-labelledby={id}
  >
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
      <h3
        id={id}
        className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-400"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400">
          {icon}
        </span>
        <span>{title}</span>
      </h3>
      {badge && (
        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          {badge}
        </span>
      )}
    </div>
    <div className="text-xs sm:text-[13px] leading-relaxed text-slate-300 space-y-2 max-w-[72ch]">
      {children}
    </div>
  </section>
);

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<LegalCategory>('all');

  if (!isOpen) return null;

  const showSection = (categories: LegalCategory[]) =>
    activeCategory === 'all' || categories.includes(activeCategory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-3 sm:p-6 backdrop-blur-xl animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Backlights */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/85 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.2)]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="legal-modal-title"
                className="font-mono text-base sm:text-lg font-bold tracking-tight text-white"
              >
                Rechtliches, Datenschutz & Bedingungen
              </h2>
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest block">
                IMPRESSUM (§ 5 DDG) · DSGVO · RENDER & NEON SQL · GOOGLE OAUTH
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Rechtliche Hinweise schließen"
            className="cursor-pointer rounded-xl p-2 text-slate-400 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Interactive Category Filter Bar */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-slate-950/60 px-5 sm:px-6 py-2.5 scrollbar-none"
          role="tablist"
          aria-label="Rechtliche Kategorien filtern"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(tab.id)}
                className={`cursor-pointer shrink-0 rounded-xl px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.18)]'
                    : 'bg-white/[0.03] text-slate-400 border border-white/5 hover:bg-white/[0.08] hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Legal Content */}
        <div className="space-y-4 overflow-y-auto p-5 sm:p-6 font-sans text-slate-300">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/25 p-4 text-xs leading-relaxed text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
              <strong className="text-cyan-100 font-mono uppercase tracking-wide">
                Transparenz- & Architekturhinweis (Render + Neon SQL + Google OAuth):
              </strong>
            </div>
            Diese Übersicht dokumentiert transparent die reale technische Infrastruktur des Spiels (Hosting auf{' '}
            <strong className="text-white">Render</strong>, Serverless-PostgreSQL-Datenbank bei{' '}
            <strong className="text-white">Neon</strong> sowie optionale Anmeldung über{' '}
            <strong className="text-white">Google Sign-In</strong>) gemäß DSGVO, § 5 DDG und § 25 TDDDG.
          </div>

          {/* Section 1: Impressum (§ 5 DDG) */}
          {showSection(['impressum', 'privacy']) && (
            <Section
              id="legal-sec-impressum"
              title="1. Impressum & Anbieterkennzeichnung (§ 5 DDG)"
              badge="§ 5 DDG / Art. 13 DSGVO"
              icon={<Mail className="h-3.5 w-3.5" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl bg-slate-900/90 border border-white/10 p-3 text-xs">
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Verantwortlicher Betreiber
                  </span>
                  <strong className="text-white font-medium">{legalOperatorName}</strong>
                </div>
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Anschrift (Ladungsfähig)
                  </span>
                  <span className="text-slate-200">{legalOperatorAddress}</span>
                </div>
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Datenschutz- & Support-Kontakt
                  </span>
                  <a
                    className="text-amber-300 underline hover:text-amber-200 transition-colors break-all"
                    href={`mailto:${legalContactEmail}`}
                  >
                    {legalContactEmail}
                  </a>
                </div>
              </div>
              <p className="text-[11px] text-slate-300">
                <strong className="text-amber-400">Hinweis zur Gemeinnützigkeit / Nicht-Kommerzialität:</strong> Dieses Spiel ist ein rein privates, nicht-kommerzielles Gaming- und Heimat-Projekt für 61267 Neu-Anspach ohne Gewinnerzielungsabsicht, ohne Werbung und ohne kostenpflichtige Inhalte.
              </p>
              <p className="text-[11px] text-slate-400">
                Konfigurationshinweis für den Produktivbetrieb auf Render: Die Betreiberangaben können bei Bedarf über die
                Umgebungsvariablen{' '}
                <code className="rounded bg-slate-950 px-1.5 py-0.5 border border-white/10 text-amber-300 font-mono">
                  VITE_LEGAL_OPERATOR_NAME
                </code>
                ,{' '}
                <code className="rounded bg-slate-950 px-1.5 py-0.5 border border-white/10 text-amber-300 font-mono">
                  VITE_LEGAL_OPERATOR_ADDRESS
                </code>{' '}
                und{' '}
                <code className="rounded bg-slate-950 px-1.5 py-0.5 border border-white/10 text-amber-300 font-mono">
                  VITE_LEGAL_CONTACT_EMAIL
                </code>{' '}
                überschrieben werden.
              </p>
            </Section>
          )}

          {/* Section 2: Hosting auf Render */}
          {showSection(['hosting', 'privacy']) && (
            <Section
              id="legal-sec-render"
              title="2. Hosting-Infrastruktur auf Render (Auftragsverarbeitung)"
              badge="Art. 28 & Art. 6 Abs. 1 lit. f DSGVO"
              icon={<Server className="h-3.5 w-3.5" />}
            >
              <p>
                Die Webanwendung, die REST-API sowie der Echtzeit-WebSocket-Server (<code className="text-amber-300 font-mono">/ws</code>) werden
                gehostet bei <strong className="text-white">Render Services, Inc.</strong> (525 Brannan St, Suite 300, San
                Francisco, CA 94107, USA; mit wählbaren EU-Rechenzentren wie Frankfurt am Main).
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-white">Verarbeitete Verbindungsdaten:</strong> Beim Aufruf der Seite und bei
                  WebSocket-Verbindungen werden technisch notwendige Server-Logs verarbeitet (IP-Adresse zur Missbrauchs-
                  und Rate-Limit-Abwehr, Zeitstempel, aufgerufener Pfad, HTTP-Statuscode, User-Agent sowie TLS-Metadaten).
                </li>
                <li>
                  <strong className="text-white">Zweck & Rechtsgrundlage:</strong> Gewährleistung der Systemsicherheit,
                  Schutz vor Brute-Force-Angriffen (Rate-Limiting) und stabiler Multiplayer-Betrieb gemäß{' '}
                  <strong className="text-slate-200">Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse).
                </li>
                <li>
                  <strong className="text-white">Drittlandtransfer & Garantien:</strong> Render ist unter dem{' '}
                  <strong className="text-slate-200">EU-US Data Privacy Framework (DPF)</strong> zertifiziert und bietet ein
                  Data Processing Addendum (DPA) inklusive EU-Standardvertragsklauseln (SCCs) gemäß Art. 46 DSGVO.
                </li>
              </ul>
            </Section>
          )}

          {/* Section 3: Cloud-SQL-Datenbank bei Neon */}
          {showSection(['hosting', 'privacy']) && (
            <Section
              id="legal-sec-neon"
              title="3. Cloud-SQL-Datenbank bei Neon (Serverless PostgreSQL)"
              badge="Art. 6 Abs. 1 lit. b & a DSGVO"
              icon={<Database className="h-3.5 w-3.5" />}
            >
              <p>
                Für die dauerhafte Speicherung von Spielerkonten, Sitzungen und Ranglisten wird eine über TLS (
                <code className="text-amber-300 font-mono">sslmode=require</code>) verschlüsselte PostgreSQL-Datenbank bei{' '}
                <strong className="text-white">Neon, Inc.</strong> (Serverless PostgreSQL, Auftragsverarbeiter gemäß Art. 28
                DSGVO) eingesetzt.
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-white">Tabelle <code className="font-mono text-amber-300">accounts</code>:</strong>{' '}
                  Konto-ID, frei gewählter Benutzername (Pseudonym), Clan-Tag, Fraktion (Neu-Anspach / Wehrheim),
                  Authentifizierungs-Anbieter (<code className="font-mono">password</code> oder{' '}
                  <code className="font-mono">google</code>), kryptografischer Scrypt-Passwort-Hash + Salt (bei
                  Passwort-Konten) bzw. Google-Sub-ID, E-Mail & Profilbild-URL (nur bei Google-Anmeldung) sowie der
                  Zeitstempel der Datenschutz-Bestätigung.
                </li>
                <li>
                  <strong className="text-white">Tabelle <code className="font-mono text-amber-300">sessions</code>:</strong>{' '}
                  SHA-256-Hash des Sitzungstokens, CSRF-Schutztoken, Erstellungs- und Ablaufzeitpunkt (Standard: 30 Tage;
                  automatische Invalidierung bei Abmeldung oder Gerätewechsel durch Single-Session-Schutz).
                </li>
                <li>
                  <strong className="text-white">
                    Tabellen <code className="font-mono text-amber-300">leaderboard</code>,{' '}
                    <code className="font-mono text-amber-300">rooms</code> &{' '}
                    <code className="font-mono text-amber-300">live_events</code>:
                  </strong>{' '}
                  Öffentlich im Spiel sichtbare Ranglisten-Punkte, Kills, Siege, höchste Welle und temporäre
                  Multiplayer-Raumzustände (automatische Bereinigung inaktiver Räume nach 10 Minuten).
                </li>
                <li>
                  <strong className="text-white">Speicherdauer:</strong> Kontodaten bleiben gespeichert, bis der Nutzer sein
                  Konto im Operator-Profil selbst löscht oder eine Löschung anfordert.
                </li>
              </ul>
            </Section>
          )}

          {/* Section 4: Anmelden mit Google (Google OAuth 2.0 / OIDC) */}
          {showSection(['google', 'privacy']) && (
            <Section
              id="legal-sec-google"
              title="4. „Anmelden mit Google“ (Google OAuth 2.0 / OpenID Connect)"
              badge="Optional · Art. 6 Abs. 1 lit. a & b DSGVO"
              icon={<Globe className="h-3.5 w-3.5" />}
            >
              <p>
                Du kannst dich wahlweise mit einem rein pseudonymen lokalen Konto (Benutzername + Passwort ohne
                E-Mail-Adresse) registrieren oder optional die Funktion{' '}
                <strong className="text-white">„Anmelden mit Google“</strong> nutzen, bereitgestellt durch die{' '}
                <strong className="text-white">Google Ireland Limited</strong> (Gordon House, Barrow Street, Dublin 4,
                Irland) bzw. <strong className="text-white">Google LLC</strong> (1600 Amphitheatre Parkway, Mountain View,
                CA 94043, USA).
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-white">Übermittelte Daten bei Google-Login:</strong> Wenn du aktiv auf „Mit Google
                  anmelden“ klickst, übermittelt Google nach deiner Bestätigung deine eindeutige Google-Kennung (
                  <code className="font-mono text-amber-300">sub</code>), deine verifizierte E-Mail-Adresse (
                  <code className="font-mono text-amber-300">email</code>), deinen Anzeigenamen sowie optional deine
                  Profilbild-URL an unseren Server.
                </li>
                <li>
                  <strong className="text-white">Kein Zugriff auf Google-Passwörter:</strong> Wir erhalten zu keinem
                  Zeitpunkt dein Google-Passwort und fordern keine weitergehenden Berechtigungen (nur Standard-Scopes{' '}
                  <code className="font-mono text-amber-300">openid email profile</code>) an.
                </li>
                <li>
                  <strong className="text-white">Zweck & Pseudonym-Alternative:</strong> Die Daten dienen ausschließlich der
                  eindeutigen Zuordnung deines Spielerkontos (Art. 6 Abs. 1 lit. b DSGVO). Deine E-Mail-Adresse wird niemals
                  öffentlich im Leaderboard angezeigt. Wer keine Datenübermittlung durch Google wünscht, kann jederzeit die
                  lokale Benutzername/Passwort-Registrierung nutzen.
                </li>
              </ul>
            </Section>
          )}

          {/* Section 5: Technisch notwendige Cookies & LocalStorage */}
          {showSection(['rights', 'privacy']) && (
            <Section
              id="legal-sec-cookies"
              title="5. Technisch notwendige Cookies & LocalStorage (§ 25 Abs. 2 Nr. 2 TDDDG)"
              badge="Kein Tracking / Keine Werbung"
              icon={<Cookie className="h-3.5 w-3.5" />}
            >
              <p>
                Dieses Spiel verwendet <strong className="text-emerald-300">keinerlei Werbe-, Analyse- oder Tracking-Cookies</strong>. Es
                kommen ausschließlich technisch zwingend erforderliche Speichermechanismen nach § 25 Abs. 2 Nr. 2 TDDDG zum
                Einsatz:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-white">
                    Sitzungs-Cookie (<code className="font-mono text-amber-300">gemini_game_session</code>):
                  </strong>{' '}
                  Kryptografisches <code className="font-mono">HttpOnly</code>- und <code className="font-mono">Secure</code>
                  -Cookie zur Aufrechterhaltung deiner Anmeldung (Laufzeit: max. 30 Tage, sofortige Löschung bei Logout).
                </li>
                <li>
                  <strong className="text-white">
                    OAuth-CSRF-State-Cookie (<code className="font-mono text-amber-300">gemini_google_oauth_state</code>):
                  </strong>{' '}
                  Kurzlebiges Sicherheits-Cookie (max. 10 Minuten), das ausschließlich während einer aktiven
                  Google-OAuth-Weiterleitung gesetzt wird, um Cross-Site-Request-Forgery-Angriffe abzuwehren, und direkt nach
                  dem Callback gelöscht wird.
                </li>
                <li>
                  <strong className="text-white">Browser LocalStorage:</strong> Speichert lokale Spieleinstellungen,
                  Audio-/Grafik-Präferenzen und lokalen Kampagnenfortschritt direkt in deinem Browser.
                </li>
              </ul>
            </Section>
          )}

          {/* Section 6: Betroffenenrechte, Datenexport & Kontolöschung */}
          {showSection(['rights', 'privacy']) && (
            <Section
              id="legal-sec-rights"
              title="6. Deine DSGVO-Rechte, JSON-Datenexport & Kontolöschung"
              badge="Art. 15–21 & Art. 77 DSGVO"
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
            >
              <p>
                Dir stehen gegenüber dem Verantwortlichen jederzeit folgende Betroffenenrechte nach der DSGVO zu:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-white">Auskunft & Datenübertragbarkeit (Art. 15 & 20 DSGVO):</strong> Über dein
                  Operator-Profil im Spiel (Endpunkt <code className="font-mono text-amber-300">GET /api/auth/export</code>)
                  kannst du jederzeit per Klick eine vollständige, maschinenlesbare JSON-Kopie all deiner gespeicherten
                  Kontodaten herunterladen.
                </li>
                <li>
                  <strong className="text-white">Berichtigung & Löschung / „Recht auf Vergessenwerden“ (Art. 16 & 17 DSGVO):</strong>{' '}
                  Du kannst dein Konto samt Sitzungen und Ranglisten-Einträgen jederzeit unmittelbar im Spiel über{' '}
                  <code className="font-mono text-amber-300">POST /api/auth/delete</code> unwiderruflich aus der
                  Neon-SQL-Datenbank löschen (bei Passwort-Konten durch Passwortbestätigung; bei Google-Konten durch Eingabe
                  von <code className="font-mono">LÖSCHEN</code> oder deines Benutzernamens).
                </li>
                <li>
                  <strong className="text-white">Einschränkung, Widerspruch & Beschwerderecht (Art. 18, 21 & 77 DSGVO):</strong>{' '}
                  Du hast das Recht auf Einschränkung der Verarbeitung, Widerspruch gegen Verarbeitungen nach Art. 6 Abs. 1
                  lit. f DSGVO sowie das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde (z. B.{' '}
                  <em>Der Hessische Beauftragte für Datenschutz und Informationsfreiheit</em>, Gustav-Stresemann-Ring 1,
                  65189 Wiesbaden).
                </li>
              </ul>
            </Section>
          )}

          {/* Section 7: Nutzungsbedingungen & Fair Play */}
          {showSection(['impressum', 'rights']) && (
            <Section
              id="legal-sec-terms"
              title="7. Nutzungsbedingungen (AGB) & Fair-Play-Regeln"
              badge="Nutzungsregeln"
              icon={<FileText className="h-3.5 w-3.5" />}
            >
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-white">Fair Play & Anti-Cheat:</strong> Das Manipulieren von Netzwerkverkehr,
                  REST-/WebSocket-Endpunkten, Sitzungstokens oder Spielwerten ist untersagt. Server-seitige
                  Plausibilitätsprüfungen verwerfen unzulässige Manipulationen automatisch.
                </li>
                <li>
                  <strong className="text-white">Verhaltensregeln & Namenswahl:</strong> Benutzernamen und Clan-Tags dürfen
                  keine beleidigenden, rechtswidrigen, extremistischen oder Marken-/Persönlichkeitsrechte verletzenden
                  Inhalte enthalten. Bitte verwende im Spiel keine sensiblen personenbezogenen Daten.
                </li>
                <li>
                  <strong className="text-white">Verfügbarkeit & Haftung:</strong> Das Spiel wird als Freizeit- und
                  Demonstrationsprojekt bereitgestellt. Der Betreiber behält sich vor, rechtswidrige Profile oder
                  manipulierte Leaderboard-Einträge zum Schutz des Betriebs zu entfernen.
                </li>
              </ul>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950/85 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Hinweisversion {LEGAL_NOTICE_VERSION} · DSGVO & DDG Konformitätsübersicht</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2 font-mono text-xs font-bold text-slate-950 shadow-[0_2px_12px_rgba(245,158,11,0.35)] transition-all duration-150 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98]"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
