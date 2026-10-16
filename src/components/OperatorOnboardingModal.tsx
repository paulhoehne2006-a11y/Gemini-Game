import React, { useState } from 'react';
import { Shield, CheckCircle2, Swords, Scale, Download, Trash2, AlertTriangle } from 'lucide-react';
import { soundFx } from '../audio/soundFx';
import { LegalConsentRecord } from '../legal';
import { exportUserData, deleteUserAccount } from '../auth';

interface OperatorOnboardingModalProps {
  initialName: string;
  initialClanTag: string;
  initialCity: string;
  isFirstTime: boolean;
  onComplete: (profile: {
    name: string;
    clanTag: string;
    city: string;
    consent?: LegalConsentRecord;
  }) => void;
  onOpenLegal: () => void;
  onClose?: () => void;
  onLogout?: () => void;
}

const PRESET_TAGS = ['61267', 'ANS', 'TAUN', 'BEMB', 'FELD'];

export const OperatorOnboardingModal: React.FC<OperatorOnboardingModalProps> = ({
  initialName,
  initialClanTag,
  initialCity,
  isFirstTime,
  onComplete,
  onOpenLegal,
  onClose,
  onLogout,
}) => {
  const [name, setName] = useState(isFirstTime ? '' : initialName);
  const [clanTag, setClanTag] = useState(initialClanTag || '61267');
  const [city, setCity] = useState(initialCity || 'Neu-Anspach');
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Bitte gib einen Benutzernamen mit mindestens 2 Zeichen ein.');
      return;
    }
    if (isFirstTime && !hasAcceptedLegal) {
      setError('Bitte bestätige die Datenschutzhinweise und Nutzungsbedingungen.');
      return;
    }
    const cleanTag = clanTag.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase().slice(0, 6) || '61267';
    soundFx.playLevelUp();
    onComplete({
      name: trimmed.slice(0, 20),
      clanTag: cleanTag,
      city,
      ...(isFirstTime
        ? {
            consent: {
              acceptedAt: new Date().toISOString(),
              noticeVersion: '2026-10-15',
              privacyPolicyVersion: '2026-10-15',
              termsVersion: '2026-10-15',
            },
          }
        : {}),
    });
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      setExportFeedback(null);
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `operator-daten-${name.trim() || 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportFeedback('Daten erfolgreich als JSON exportiert!');
    } catch {
      setExportFeedback('Export fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccountSubmit = async () => {
    if (!deletePassword) {
      setDeleteError('Bitte gib dein Passwort ein.');
      return;
    }
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteUserAccount(deletePassword);
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Löschung fehlgeschlagen.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Tactical Header Banner */}
        <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-amber-400 tracking-wider">
              61267 NEU-ANSPACH · OPERATOR-AKTE & MULTIPLAYER-PROFIL
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              {isFirstTime
                ? 'Wähle deinen Benutzernamen für das Live-Leaderboard'
                : 'Operator-Benutzername & Clan-Tag anpassen'}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Explanation */}
          <p className="text-xs text-slate-300 leading-relaxed">
            Für das Multiplayer-Profil ist nur ein frei gewählter Benutzername erforderlich. Benutzername, optionaler Clan-Tag, optionale Fraktion und Spielstatistiken werden mit dem Leaderboard synchronisiert. Bitte gib keine E-Mail-Adresse, Telefonnummer oder andere unnötige persönliche Daten ein.
          </p>

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-semibold text-slate-200">
              1. DEIN BENUTZERNAME (SPIELERNAME)
            </label>
            <input
              type="text"
              autoFocus
              maxLength={20}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="z.B. Paul61267, TaunusSniper, BembelKing..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:outline-none text-white font-mono text-sm"
            />
            {error && <div className="text-xs text-red-400 font-mono">{error}</div>}
          </div>

          {isFirstTime && (
            <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
              <label className="flex items-start gap-3 text-xs text-slate-200 leading-relaxed">
                <input
                  type="checkbox"
                  checked={hasAcceptedLegal}
                  onChange={(event) => {
                    setHasAcceptedLegal(event.target.checked);
                    if (error) setError(null);
                  }}
                  className="mt-0.5 h-4 w-4 accent-amber-500"
                  required
                />
                <span>
                  Ich habe die{' '}
                  <button
                    type="button"
                    onClick={onOpenLegal}
                    className="font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200"
                  >
                    Datenschutzhinweise und Nutzungsbedingungen
                  </button>{' '}
                  gelesen und stimme der Verarbeitung der für das Multiplayer-Profil
                  erforderlichen Daten zu. Diese Zustimmung wird mit Version und
                  Zeitpunkt gespeichert und kann über die genannten Kontaktwege widerrufen
                  werden.
                </span>
              </label>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Scale className="h-3.5 w-3.5 text-amber-400" />
                Keine Rechtsberatung; die Texte sind Produktinformationen und müssen vor
                dem öffentlichen Betrieb konfiguriert/geprüft werden.
              </div>
            </div>
          )}

          {/* Friend Clan Tag Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-semibold text-slate-200">
                2. FREUNDES-CLAN-TAG (FÜR GEMEINSAME GRUPPEN)
              </label>
              <span className="text-[11px] font-mono text-slate-400">Max. 6 Zeichen</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-mono font-bold text-sm">
                  [
                </span>
                <input
                  type="text"
                  maxLength={6}
                  value={clanTag}
                  onChange={(e) =>
                    setClanTag(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase())
                  }
                  placeholder="61267"
                  className="w-full pl-7 pr-7 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:outline-none text-amber-400 font-mono font-bold text-sm uppercase"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-mono font-bold text-sm">
                  ]
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setClanTag(tag)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      clanTag === tag
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    [{tag}]
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Faction Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-slate-200">
              3. HEIMAT-FRAKTION IM TAUNUS-DERBY
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCity('Neu-Anspach')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  city === 'Neu-Anspach'
                    ? 'bg-red-950/40 border-red-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">61267 Neu-Anspach</span>
                  {city === 'Neu-Anspach' && <CheckCircle2 className="w-4 h-4 text-red-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Hessenpark, Waldschwimmbad, Bahnhof & Feldbergblick
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCity('Wehrheim')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  city === 'Wehrheim'
                    ? 'bg-amber-950/40 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">61273 Wehrheim</span>
                  {city === 'Wehrheim' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Apfeldorf & Lochmühle-Garde im Lokalderby
                </div>
              </button>
            </div>
          </div>

          {/* Live Callsign Preview */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
                {(name.trim() || 'OP').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">
                  VORSCHAU IM ECHTEN MULTIPLAYER-LEADERBOARD
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  <span className="text-amber-400 mr-1.5">[{clanTag || '61267'}]</span>
                  <span>{name.trim() || 'DeinBenutzername'}</span>
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{city}</span>
          </div>

          {/* DSGVO & Privacy Controls for logged-in profile */}
          {!isFirstTime && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-300">
                  DSGVO / DATENSCHUTZ-RECHTE
                </span>
                <button
                  type="button"
                  onClick={onOpenLegal}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Rechtliche Hinweise
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Exportiere ...' : 'Daten exportieren (JSON)'}</span>
                </button>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Konto löschen</span>
                  </button>
                ) : (
                  <div className="w-full p-3 rounded-lg bg-red-950/60 border border-red-500/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-red-200 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Konto unwiderruflich löschen?</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Bitte bestätige mit deinem Passwort. Alle Kontodaten, Sitzungen und Leaderboard-Einträge werden sofort entfernt.
                    </p>
                    {deleteError && (
                      <div className="text-xs text-red-400 font-mono">{deleteError}</div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Dein Passwort"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-red-500/40 text-xs font-mono text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteAccountSubmit}
                        disabled={isDeleting}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono cursor-pointer"
                      >
                        {isDeleting ? 'Löschen ...' : 'Endgültig löschen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                          setDeleteError(null);
                        }}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {exportFeedback && (
                <div className="text-xs text-amber-400 font-mono">{exportFeedback}</div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {!isFirstTime && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
            )}
            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide transition-colors cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>
                {isFirstTime
                  ? 'Benutzername speichern & Spiel starten'
                  : 'Operator-Profil aktualisieren'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
