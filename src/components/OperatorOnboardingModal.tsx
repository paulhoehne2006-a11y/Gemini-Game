import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  Swords,
  Scale,
  Download,
  Trash2,
  AlertTriangle,
  Link2,
  Users,
  Sparkles,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';
import { createLegalConsentRecord, LegalConsentRecord } from '../legal';
import {
  AuthRequestError,
  AuthUser,
  exportUserData,
  deleteUserAccount,
  updateOperatorUsername,
  linkLegacyPasswordAccount,
  linkGoogleToCurrentAccount,
  fetchGoogleAuthConfig,
} from '../auth';

interface OperatorOnboardingModalProps {
  initialName: string;
  initialClanTag: string;
  initialCity: string;
  isFirstTime: boolean;
  authProvider?: 'password' | 'google';
  userEmail?: string;
  onComplete: (profile: {
    name: string;
    clanTag: string;
    city: string;
    consent?: LegalConsentRecord;
  }) => void;
  onAccountLinked?: (user: AuthUser) => void;
  onOpenClanHub?: () => void;
  onOpenLegal: () => void;
  onClose?: () => void;
  onLogout?: () => void;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,24}$/;

export const OperatorOnboardingModal: React.FC<OperatorOnboardingModalProps> = ({
  initialName,
  initialClanTag,
  initialCity,
  isFirstTime,
  authProvider = 'password',
  userEmail,
  onComplete,
  onAccountLinked,
  onOpenClanHub,
  onOpenLegal,
  onClose,
  onLogout,
}) => {
  const [name, setName] = useState(
    isFirstTime && (!initialName || initialName === 'Unbekannt') ? '' : initialName
  );
  const [city, setCity] = useState(initialCity || 'Neu-Anspach');
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Legacy Account Linking state
  const [legacyUsername, setLegacyUsername] = useState('');
  const [legacyPassword, setLegacyPassword] = useState('');
  const [isLinkingLegacy, setIsLinkingLegacy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Google Account Linking state (for password accounts without linked Google email)
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  // DSGVO Export & Account Deletion state
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isGoogleAccount = authProvider === 'google';
  const effectiveClanTag = (initialClanTag || '').trim().toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();

    if (!USERNAME_PATTERN.test(trimmed)) {
      setError(
        'Bitte gib einen gültigen Benutzernamen (3–24 Zeichen, nur Buchstaben, Zahlen, _ oder -) ein.'
      );
      return;
    }

    if (isFirstTime && !hasAcceptedLegal) {
      setError('Bitte bestätige die Datenschutzhinweise und Nutzungsbedingungen.');
      return;
    }

    const factionValue = city === 'Wehrheim' ? 'wehrheim' : 'neu-anspach';
    setIsSaving(true);
    try {
      const updatedUser = await updateOperatorUsername(trimmed, factionValue);
      if (updatedUser) {
        onAccountLinked?.(updatedUser);
      }
    } catch (err: any) {
      const isValidationOrConflictError =
        (err instanceof AuthRequestError && err.status !== 401 && err.status < 500) ||
        (typeof err?.message === 'string' &&
          (err.message.includes('vergeben') ||
            err.message.includes('Benutzername') ||
            err.message.includes('ungültig')));
      if (isValidationOrConflictError) {
        setError(err.message || 'Dieser Benutzername konnte nicht gespeichert werden.');
        setIsSaving(false);
        return;
      }
      // Offline / guest fallback: proceed with local profile completion
    } finally {
      setIsSaving(false);
    }

    soundFx.playLevelUp();
    onComplete({
      name: trimmed.slice(0, 24),
      clanTag: effectiveClanTag,
      city,
      ...(isFirstTime
        ? {
            consent: createLegalConsentRecord(),
          }
        : {}),
    });
  };

  const handleLinkLegacyAccount = async () => {
    setLinkError(null);
    setLinkSuccess(null);
    const trimmedLegacyUser = legacyUsername.trim();
    if (!trimmedLegacyUser || !legacyPassword) {
      setLinkError('Bitte gib deinen alten Benutzernamen und dein altes Passwort ein.');
      return;
    }

    try {
      setIsLinkingLegacy(true);
      const linkedUser = await linkLegacyPasswordAccount(trimmedLegacyUser, legacyPassword);
      const resolvedName = linkedUser.username || trimmedLegacyUser;
      const resolvedCity = linkedUser.faction === 'wehrheim' ? 'Wehrheim' : 'Neu-Anspach';
      const resolvedClanTag = linkedUser.clanTag || '';

      setName(resolvedName);
      setCity(resolvedCity);
      setLinkSuccess(`Account erfolgreich verknüpft! Willkommen zurück, ${resolvedName}`);
      soundFx.playRewardClaim();
      onAccountLinked?.(linkedUser);

      setTimeout(() => {
        onComplete({
          name: resolvedName,
          clanTag: resolvedClanTag,
          city: resolvedCity,
          ...(isFirstTime
            ? {
                consent: createLegalConsentRecord(),
              }
            : {}),
        });
      }, 450);
    } catch (err: any) {
      setLinkError(
        err?.message || 'Die Verknüpfung des alten Accounts ist fehlgeschlagen. Bitte prüfe deine Zugangsdaten.'
      );
    } finally {
      setIsLinkingLegacy(false);
    }
  };

  const handleLinkGoogleAccount = async () => {
    setLinkError(null);
    setLinkSuccess(null);
    try {
      setIsLinkingGoogle(true);
      const cfg = await fetchGoogleAuthConfig();
      if (cfg.oauthRedirectEnabled && !cfg.devFallbackEnabled) {
        window.location.assign('/api/auth/google?mode=link');
        return;
      }
      const linkedUser = await linkGoogleToCurrentAccount({
        devProfile: {
          email: 'operator.taunus@gmail.com',
          displayName: name.trim() || initialName || 'TaunusOperator',
        },
      } as any);
      if (linkedUser) {
        setLinkSuccess(
          `Account erfolgreich verknüpft! Willkommen zurück, ${linkedUser.username || name.trim()}`
        );
        soundFx.playRewardClaim();
        onAccountLinked?.(linkedUser);
      }
    } catch (err: any) {
      setLinkError(err?.message || 'Google-Verknüpfung fehlgeschlagen.');
    } finally {
      setIsLinkingGoogle(false);
    }
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
    if (isGoogleAccount) {
      if (deletePassword.trim().toUpperCase() !== 'LÖSCHEN') {
        setDeleteError('Bitte gib zur Bestätigung LÖSCHEN ein.');
        return;
      }
    } else if (!deletePassword) {
      setDeleteError('Bitte gib dein Passwort ein.');
      return;
    }
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteUserAccount(isGoogleAccount ? deletePassword.trim().toUpperCase() : deletePassword);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden my-auto">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Tactical Corner Brackets */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-500/40 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-500/40 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-500/40 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-500/40 pointer-events-none" />

        {/* Tactical Header Banner */}
        <div className="px-6 py-5 bg-slate-950/95 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-amber-400 tracking-wider">
              61267 NEU-ANSPACH · OPERATOR-AKTE & KONTO-SYNCHRONISATION
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
              {isFirstTime
                ? 'Wähle deinen Benutzernamen für das Live-Leaderboard'
                : 'Operator-Profil & Account-Verknüpfung'}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Welcoming Google / First-Time Badge */}
          {(isGoogleAccount || isFirstTime) && (
            <div
              data-testid="google-onboarding-welcome-badge"
              className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-100 shadow-[0_4px_16px_rgba(245,158,11,0.12)]"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-300">
                  Google-Konto verbunden — Wähle jetzt deinen öffentlichen Operator-Nutzernamen oder verknüpfe deinen alten Account!
                </p>
                {userEmail && (
                  <p className="font-mono text-[11px] text-amber-200/80">
                    Verknüpfte E-Mail: {userEmail}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Explanation */}
          <p className="text-xs text-slate-300 leading-relaxed">
            Für das Multiplayer-Profil kannst du deinen öffentlichen Operator-Nutzernamen (3–24 Zeichen) jederzeit frei wählen. Clans werden im Spiel über die Clan-Börse verwaltet.
          </p>

          {/* 1. Username Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="operator-username-input"
                className="block text-xs font-mono font-semibold text-slate-200"
              >
                1. DEIN WUNSCH-BENUTZERNAME (OPERATOR-NAME)
              </label>
              <span className="text-[11px] font-mono text-slate-400">3–24 Zeichen</span>
            </div>
            <input
              id="operator-username-input"
              data-testid="operator-username-input"
              type="text"
              autoFocus
              maxLength={24}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="z.B. Paul61267, TaunusSniper, BembelKing..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-white font-mono text-sm transition-all"
            />
            {error && (
              <div role="alert" className="text-xs text-red-400 font-mono mt-1">
                {error}
              </div>
            )}
          </div>

          {isFirstTime && (
            <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
              <label className="flex items-start gap-3 text-xs text-slate-200 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcceptedLegal}
                  onChange={(event) => {
                    setHasAcceptedLegal(event.target.checked);
                    if (error) setError(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-950 text-amber-500 focus:ring-amber-500/40 accent-amber-500"
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
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <Scale className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>
                  Keine Rechtsberatung; die Texte sind Produktinformationen und müssen vor
                  dem öffentlichen Betrieb konfiguriert/geprüft werden.
                </span>
              </div>
            </div>
          )}

          {/* 2. Clan Status Display (No Freeform Clan-Tag Editing) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-mono font-semibold text-slate-200">
                2. CLAN-STATUS & CLAN-BÖRSE
              </span>
              <span className="text-[11px] font-mono text-slate-400">Offizielle Clan-Vergabe</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/80 p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  {effectiveClanTag ? (
                    <div
                      data-testid="operator-clan-status-badge"
                      className="text-xs font-mono font-bold text-amber-400"
                    >
                      Aktueller Clan: [{effectiveClanTag}]
                    </div>
                  ) : (
                    <div
                      data-testid="operator-clan-status-badge"
                      className="text-xs font-mono font-bold text-slate-300"
                    >
                      Kein Clan (Clanlos)
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    Clans können in der Clan-Börse beigetreten oder ab Level 3 gegründet werden.
                  </div>
                </div>
              </div>

              {onOpenClanHub && (
                <button
                  type="button"
                  data-testid="open-clan-hub-btn"
                  onClick={() => {
                    onClose?.();
                    onOpenClanHub();
                  }}
                  className="btn-tactile inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-mono font-bold text-amber-300 hover:bg-amber-500/25 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                >
                  <span>Zur Clan-Börse</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Faction Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-slate-200">
              3. HEIMAT-FRAKTION IM TAUNUS-DERBY
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCity('Neu-Anspach')}
                className={`btn-tactile p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  city === 'Neu-Anspach'
                    ? 'bg-red-950/40 border-red-500/70 text-white ring-1 ring-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'bg-slate-950/80 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">61267 Neu-Anspach</span>
                  {city === 'Neu-Anspach' && <CheckCircle2 className="w-4 h-4 text-red-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Hessenpark, Waldschwimmbad, Bahnhof & Feldbergblick
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCity('Wehrheim')}
                className={`btn-tactile p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  city === 'Wehrheim'
                    ? 'bg-amber-950/40 border-amber-500/70 text-white ring-1 ring-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950/80 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">61273 Wehrheim</span>
                  {city === 'Wehrheim' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Apfeldorf & Lochmühle-Garde im Lokalderby
                </div>
              </button>
            </div>
          </div>

          {/* 4. Alten Account verknüpfen / Konto-Synchronisation */}
          <div
            data-testid="legacy-account-linking-section"
            className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4 space-y-3.5 shadow-[0_4px_20px_rgba(6,182,212,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                  Alten Account verknüpfen / Konto-Synchronisation
                </span>
              </div>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                Spielstand-Transfer
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Du hast bereits einen älteren Operator-Account mit Passwort? Verknüpfe ihn hier, um deinen bisherigen Namen, Clan-Fortschritt und Spielstand direkt in dieses Konto zu übernehmen.
            </p>

            {/* Option A: Bestehenden Passwort-Account übernehmen */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-200">
                <KeyRound className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>Option A — Bestehenden Passwort-Account übernehmen</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="legacy-username-input" className="sr-only">
                    Alter Benutzername
                  </label>
                  <input
                    id="legacy-username-input"
                    data-testid="legacy-username-input"
                    type="text"
                    value={legacyUsername}
                    onChange={(e) => {
                      setLegacyUsername(e.target.value);
                      if (linkError) setLinkError(null);
                    }}
                    placeholder="Alter Benutzername"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="legacy-password-input" className="sr-only">
                    Altes Passwort
                  </label>
                  <input
                    id="legacy-password-input"
                    data-testid="legacy-password-input"
                    type="password"
                    value={legacyPassword}
                    onChange={(e) => {
                      setLegacyPassword(e.target.value);
                      if (linkError) setLinkError(null);
                    }}
                    placeholder="Altes Passwort"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <button
                type="button"
                data-testid="link-legacy-account-btn"
                disabled={isLinkingLegacy}
                onClick={handleLinkLegacyAccount}
                className="btn-tactile flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 px-4 py-2.5 text-xs font-mono font-bold text-cyan-200 transition-all duration-150 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {isLinkingLegacy
                    ? 'Verknüpfe Account ...'
                    : 'Alten Account jetzt verknüpfen & Spielstand übernehmen'}
                </span>
              </button>
            </div>

            {/* Option B: Google-Konto nachträglich verknüpfen */}
            {authProvider === 'password' && !userEmail && (
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div className="text-[11px] font-mono font-semibold text-slate-300">
                  Option B — Google-Konto nachträglich verknüpfen
                </div>
                <button
                  type="button"
                  data-testid="link-google-account-btn"
                  disabled={isLinkingGoogle}
                  onClick={handleLinkGoogleAccount}
                  className="btn-tactile flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-mono font-bold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <span>
                    {isLinkingGoogle
                      ? 'Verbinde mit Google ...'
                      : 'Dieses Konto mit Google verknüpfen'}
                  </span>
                </button>
              </div>
            )}

            {linkError && (
              <div
                role="alert"
                data-testid="link-account-error"
                className="rounded-xl border border-red-500/40 bg-red-950/50 px-3.5 py-2.5 text-xs font-mono text-red-300"
              >
                {linkError}
              </div>
            )}

            {linkSuccess && (
              <div
                role="status"
                data-testid="link-account-success"
                className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{linkSuccess}</span>
              </div>
            )}
          </div>

          {/* Live Callsign Preview */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-sm shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                {(name.trim() || 'OP').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">
                  VORSCHAU IM ECHTEN MULTIPLAYER-LEADERBOARD
                </div>
                <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5 mt-0.5">
                  {effectiveClanTag ? (
                    <span className="text-amber-400 font-bold">[{effectiveClanTag}]</span>
                  ) : (
                    <span className="text-slate-500 text-xs">[CLANLOS]</span>
                  )}
                  <span>{name.trim() || 'DeinBenutzername'}</span>
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{city}</span>
          </div>

          {/* DSGVO & Privacy Controls (Art. 15 & Art. 17 DSGVO) */}
          {!isFirstTime && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
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
                  className="btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-mono transition-all duration-150 cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Exportiere ...' : 'Daten exportieren (JSON)'}</span>
                </button>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-mono transition-all duration-150 cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Konto löschen</span>
                  </button>
                ) : (
                  <div className="w-full p-4 rounded-xl bg-red-950/60 border border-red-500/50 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-red-200 font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Konto unwiderruflich löschen?</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {isGoogleAccount
                        ? 'Google-verknüpfte Konten ohne lokales Passwort werden durch Eingabe von LÖSCHEN endgültig entfernt. Alle Kontodaten, Sitzungen und Leaderboard-Einträge werden sofort gelöscht.'
                        : 'Bitte bestätige mit deinem Passwort. Alle Kontodaten, Sitzungen und Leaderboard-Einträge werden sofort entfernt.'}
                    </p>
                    {deleteError && (
                      <div className="text-xs text-red-400 font-mono">{deleteError}</div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type={isGoogleAccount ? 'text' : 'password'}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder={isGoogleAccount ? 'LÖSCHEN eingeben' : 'Dein Passwort'}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-red-500/40 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteAccountSubmit}
                        disabled={isDeleting}
                        className="btn-tactile px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs font-mono cursor-pointer transition-all"
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
                        className="px-2.5 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
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
                className="btn-tactile px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95"
              >
                Abbrechen
              </button>
            )}
            <button
              type="submit"
              data-testid="operator-save-profile-btn"
              disabled={isSaving}
              className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs tracking-wide transition-all duration-150 shadow-[0_4px_20px_rgba(245,158,11,0.35)] disabled:opacity-60 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Speichere ...'
                  : isFirstTime
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
