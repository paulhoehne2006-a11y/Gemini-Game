import React from 'react';
import { X, ShieldCheck, Database, FileText, UserRound, Mail, Scale } from 'lucide-react';
import { legalContactEmail, legalOperatorName, LEGAL_NOTICE_VERSION } from '../legal';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <section className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-white/5" aria-labelledby={title}>
    <h3 id={title} className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
      {icon}
      <span>{title}</span>
    </h3>
    <div className="text-xs leading-relaxed text-slate-300">{children}</div>
  </section>
);

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-3 sm:p-5 backdrop-blur-xl animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Backlights */}
        <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="font-mono text-base sm:text-lg font-bold tracking-tight text-white">
                Rechtliches, Datenschutz & Bedingungen
              </h2>
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                TRANSPARENZ & COMPLIANCE
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Rechtliche Hinweise schließen"
            className="cursor-pointer rounded-xl p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6 font-sans text-slate-300">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 text-xs leading-relaxed text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <strong className="text-cyan-100 font-mono uppercase tracking-wide block mb-1">Produkt-Hinweis:</strong>
            Diese Ansicht ist eine verständliche Produktinformation für das Spiel und keine Rechtsberatung. Vor einem öffentlichen oder kommerziellen Betrieb müssen die Platzhalter ersetzt und die Texte rechtlich geprüft werden.
          </div>

          <Section title="1. Welche Daten werden für das Konto benötigt?" icon={<UserRound className="h-4 w-4" />}>
            <p>
              Für das Multiplayer-Profil wird nur ein frei gewählter Benutzername benötigt.
              Optional können Clan-Tag und Fraktion angegeben werden. Spielstatistiken werden
              zur Anzeige im Leaderboard gespeichert. Es werden hier keine E-Mail-Adressen,
              Passwörter, Telefonnummern, Zahlungsdaten oder Werbeprofile erhoben.
            </p>
          </Section>

          <Section title="2. Datenschutz & öffentliche Anzeige" icon={<Database className="h-4 w-4" />}>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Im Leaderboard können Benutzername, Clan-Tag, Fraktion und Spielwerte öffentlich sichtbar sein.</li>
              <li>Lokale Einstellungen bleiben im Browser; es werden keine Tracking- oder Werbe-Cookies gesetzt.</li>
              <li>Multiplayer-Raumdaten werden nur für die laufende Sitzung benötigt und nicht als Kontoidentität verwendet.</li>
              <li>Bitte verwende ein Pseudonym und teile keine zusätzlichen persönlichen Daten im Spiel.</li>
            </ul>
          </Section>

          <Section title="3. Nutzungsbedingungen" icon={<FileText className="h-4 w-4" />}>
            <p>
              Nutze das Spiel fair, respektvoll und nur mit Inhalten, für die du die erforderlichen
              Rechte hast. Keine Manipulation, kein Missbrauch des Dienstes und keine Eingabe
              sensibler Daten. Der Betreiber kann öffentliche Profil- oder Spielinhalte entfernen,
              wenn dies für Sicherheit oder Betrieb erforderlich ist.
            </p>
          </Section>

          <Section title="4. Löschung, Auskunft & Widerruf" icon={<ShieldCheck className="h-4 w-4" />}>
            <p>
              Für Fragen, Auskunft, Berichtigung, Löschung oder Widerruf der Einwilligung nutze
              den konfigurierten Kontakt. Ohne verifizierte Identitätsdaten kann die Bearbeitung
              eines Anliegens zusätzliche Angaben zur Zuordnung des Pseudonyms erfordern.
              Ein Lösch- und Exportprozess ist vor öffentlichem Betrieb verbindlich festzulegen.
            </p>
          </Section>

          <Section title="5. Sicherheit & Kontakt" icon={<Mail className="h-4 w-4" />}>
            <p>
              Sicherheitsvorfälle oder Datenschutzfragen bitte an{' '}
              <a className="text-amber-300 underline hover:text-amber-200 transition-colors" href={`mailto:${legalContactEmail}`}>
                {legalContactEmail}
              </a>{' '}
              melden. Verantwortliche Stelle: <strong className="text-white">{legalOperatorName}</strong>.
              Beide Werte sind absichtlich Konfigurationsplatzhalter und müssen über
              <code className="mx-1 rounded bg-slate-950 px-1.5 py-0.5 border border-white/10 text-amber-300 font-mono">VITE_LEGAL_CONTACT_EMAIL</code>
              und <code className="rounded bg-slate-950 px-1.5 py-0.5 border border-white/10 text-amber-300 font-mono">VITE_LEGAL_OPERATOR_NAME</code>
              gesetzt werden; es werden keine Identitäten erfunden.
            </p>
          </Section>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/80 px-6 py-4">
          <span className="font-mono text-[11px] text-slate-400">Hinweisversion {LEGAL_NOTICE_VERSION}</span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2 font-mono text-xs font-bold text-slate-950 shadow-[0_2px_12px_rgba(245,158,11,0.35)] transition-all hover:from-amber-300 hover:to-amber-400 active:scale-[0.98]"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
