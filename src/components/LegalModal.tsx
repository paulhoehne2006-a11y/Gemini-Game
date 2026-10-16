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
  <section className="space-y-2" aria-labelledby={title}>
    <h3 id={title} className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-400">
      {icon}
      {title}
    </h3>
    <div className="text-xs leading-relaxed text-slate-300">{children}</div>
  </section>
);

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-amber-400" />
            <h2 id="legal-modal-title" className="font-mono text-lg font-bold tracking-tight text-white">
              Rechtliches, Datenschutz & Bedingungen
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Rechtliche Hinweise schließen"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6 font-sans text-slate-300">
          <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/20 p-4 text-xs leading-relaxed text-cyan-100">
            <strong>Produkt-Hinweis:</strong> Diese Ansicht ist eine verständliche Produktinformation
            für das Spiel und keine Rechtsberatung. Vor einem öffentlichen oder kommerziellen Betrieb
            müssen die Platzhalter ersetzt und die Texte rechtlich geprüft werden.
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
            <ul className="list-disc space-y-1 pl-5">
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
              <a className="text-amber-300 underline" href={`mailto:${legalContactEmail}`}>
                {legalContactEmail}
              </a>{' '}
              melden. Verantwortliche Stelle: <strong className="text-slate-200">{legalOperatorName}</strong>.
              Beide Werte sind absichtlich Konfigurationsplatzhalter und müssen über
              <code className="mx-1 rounded bg-slate-950 px-1 py-0.5">VITE_LEGAL_CONTACT_EMAIL</code>
              und <code className="rounded bg-slate-950 px-1 py-0.5">VITE_LEGAL_OPERATOR_NAME</code>
              gesetzt werden; es werden keine Identitäten erfunden.
            </p>
          </Section>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-3.5">
          <span className="font-mono text-[11px] text-slate-500">Hinweisversion {LEGAL_NOTICE_VERSION}</span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-amber-400 px-4 py-1.5 font-mono text-xs font-bold text-slate-950 transition-colors hover:bg-amber-300"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
