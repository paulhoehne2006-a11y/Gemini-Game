import React from 'react';
import { X, ShieldCheck, Database, Award, Info, Scale } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight font-mono">
              Rechtliche Hinweise & Datenschutz
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          {/* Section 1: Sensible Daten & Secrets */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase mb-2">
              <ShieldCheck className="w-4 h-4" />
              1. Keine sensiblen Daten oder Passwörter hinterlegt
            </div>
            <p className="text-xs text-slate-400">
              Im gesamten Codebase und in der Datenbank sind <strong className="text-slate-200">keine Passwörter, keine privaten E-Mails, keine Telefonnummern, keine Bezahlinformationen und keine geheimen API-Schlüssel</strong> im Klartext gespeichert.
              Der optionale KI-Funksprüche-Dienst nutzt serverseitige Umgebungsvariablen.
            </p>
          </div>

          {/* Section 2: Was wird gespeichert? (DSGVO / GDPR Transparenz) */}
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase mb-2">
              <Database className="w-4 h-4" />
              2. Welche Daten werden gespeichert? (Datenschutz / DSGVO)
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
              <li>
                <strong className="text-slate-200">Frei wählbarer Spielername (Pseudonym):</strong> Der Name und Clan-Tag, den du dir gibst (z.B. „PEPSI“ oder „BembelRitter61267“), um im Leaderboard und in der Freunde-Lobby aufzutauchen.
              </li>
              <li>
                <strong className="text-slate-200">Spielstatistiken:</strong> Highscore, Kills, überlebte Wellen, freigeschaltete Maps und ausgerüstete Waffe.
              </li>
              <li>
                <strong className="text-slate-200">Lokale Einstellungen:</strong> Lautstärke und Waffen-Upgrades werden lokal in deinem eigenen Browser (LocalStorage) gesichert. Es werden keine Werbe- oder Tracking-Cookies gesetzt.
              </li>
              <li>
                <strong className="text-slate-200">Multiplayer-Sitzungen:</strong> Raum-Codes und Koordinaten von Spielern werden nur flüchtig im Arbeitsspeicher des Servers gehalten und nach Verlassen der Runde gelöscht.
              </li>
            </ul>
          </div>

          {/* Section 3: Marken, Ortsnamen & Urheberrecht */}
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase mb-2">
              <Award className="w-4 h-4" />
              3. Markenrechte, Orte & Haftungsausschluss (Disclaimer)
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Dies ist ein <strong className="text-slate-200">nicht-kommerzielles Fan- und Freizeitprojekt</strong> zur Würdigung der Region 61267 Neu-Anspach und des Taunus.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li>
                Die Nennung realer Orte (z.B. <em>Freilichtmuseum Hessenpark, Waldschwimmbad, Bürgerhaus, Taunus-Center, Adolf-Reichwein-Schule</em>) dient ausschließlich dem regionalen Lokalkolorit in einem fiktiven Computerspiel. Es besteht keinerlei offizielle Verbindung, Partnerschaft oder Billigung durch die Betreiber der jeweiligen realen Institutionen.
              </li>
              <li>
                Bezeichnungen wie „Cold War Waffen-Upgrades“, „Pack-a-Punch“ oder Waffennamen sind genretypische Hommagen bzw. Parodien. Alle Marken, Logos und Namen gehören ihren jeweiligen rechtmäßigen Inhabern.
              </li>
            </ul>
          </div>

          {/* Section 4: Rechtliche Bedingungen beim Hosten & Teilen */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs uppercase mb-2">
              <Info className="w-4 h-4" />
              4. Hosten & Teilen mit Freunden: Was musst du beachten?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Solange du das Spiel im <strong className="text-amber-200">privaten Freundeskreis</strong> spielst (nicht kommerziell, kein Verkauf, keine Werbung), bist du rechtlich auf der sicheren Seite (sog. Haushaltsausnahme bei der DSGVO).
              Wenn du die Seite dauerhaft als eigene öffentliche Domain betreibst, genügt in Deutschland typischerweise die Angabe eines einfachen Impressums/Kontakts gemäß § 5 DDG (Digitale-Dienste-Gesetz).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950">
          <span className="text-[11px] font-mono text-slate-500">
            Version 2.4.0 • 61267 Neu-Anspach Fan-Projekt
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Verstanden & Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
