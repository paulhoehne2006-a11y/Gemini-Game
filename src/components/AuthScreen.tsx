import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, LogIn, Scale, ShieldCheck, Sparkles, UserPlus, Users } from 'lucide-react';
import {
  AuthRequestError,
  AuthUser,
  fetchGoogleAuthConfig,
  GoogleAuthConfig,
  login,
  loginWithGoogle,
  register,
  startGoogleOAuthRedirect,
} from '../auth';
import { createLegalConsentRecord } from '../legal';
import { soundFx } from '../audio/soundFx';

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
  onOpenLegal?: () => void;
}

type AuthMode = 'login' | 'register';

const usernamePattern = /^[a-zA-Z0-9_-]{3,24}$/;

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, onOpenLegal }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [faction, setFaction] = useState<'neu-anspach' | 'wehrheim'>('neu-anspach');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [legalConsentAccepted, setLegalConsentAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [googleConfig, setGoogleConfig] = useState<GoogleAuthConfig | null>(null);
  const [showGoogleDevPanel, setShowGoogleDevPanel] = useState(false);
  const [devGoogleEmail, setDevGoogleEmail] = useState('operator.taunus@gmail.com');
  const [devGoogleName, setDevGoogleName] = useState('TaunusOperator');

  useEffect(() => {
    let active = true;
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const authErr = params.get('auth_error');
      if (authErr) {
        setError(authErr);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    fetchGoogleAuthConfig()
      .then((cfg) => {
        if (active) setGoogleConfig(cfg);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleGoogleDevLogin = async (emailInput?: string, displayNameInput?: string) => {
    const emailToUse = (emailInput ?? devGoogleEmail).trim();
    const nameToUse = (displayNameInput ?? devGoogleName).trim() || 'TaunusOperator';
    if (!emailToUse || !emailToUse.includes('@')) {
      setError('Bitte gib eine gültige Google-E-Mail-Adresse ein.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const user = await loginWithGoogle({
        devProfile: {
          email: emailToUse,
          displayName: nameToUse,
        },
        clanTag: '',
        faction,
        legalConsent: createLegalConsentRecord(),
      });
      setSuccessMessage(
        `Google-Anmeldung erfolgreich! Willkommen, ${user.displayName || user.username || 'Operator'}!`
      );
      soundFx.playRewardClaim();
      setTimeout(() => {
        onAuthenticated(user);
      }, 200);
    } catch (requestError) {
      setError(
        requestError instanceof AuthRequestError
          ? requestError.message
          : 'Die Google-Anmeldung konnte nicht durchgeführt werden.'
      );
      setIsSubmitting(false);
    }
  };

  const handleGoogleButtonClick = async () => {
    setError(null);
    setSuccessMessage(null);

    let cfg = googleConfig;
    if (!cfg) {
      cfg = await fetchGoogleAuthConfig();
      setGoogleConfig(cfg);
    }

    if (cfg.devFallbackEnabled) {
      setShowGoogleDevPanel((prev) => !prev);
      return;
    }

    if (cfg.oauthRedirectEnabled) {
      setIsSubmitting(true);
      startGoogleOAuthRedirect({
        clanTag: '',
        faction,
      });
      return;
    }

    if (cfg.gisEnabled && cfg.googleClientId) {
      const googleGlobal = (window as any).google;
      if (googleGlobal?.accounts?.id) {
        setIsSubmitting(true);
        googleGlobal.accounts.id.initialize({
          client_id: cfg.googleClientId,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) {
              setIsSubmitting(false);
              setError('Keine Google-Anmeldedaten empfangen.');
              return;
            }
            try {
              const user = await loginWithGoogle({
                credential: response.credential,
                clanTag: '',
                faction,
                legalConsent: createLegalConsentRecord(),
              });
              setSuccessMessage(
                `Willkommen, ${user.displayName || user.username || 'Operator'}! Spiel startet...`
              );
              soundFx.playRewardClaim();
              setTimeout(() => {
                onAuthenticated(user);
              }, 200);
            } catch (err) {
              setError(
                err instanceof AuthRequestError
                  ? err.message
                  : 'Die Google-Anmeldung ist fehlgeschlagen.'
              );
              setIsSubmitting(false);
            }
          },
        });
        googleGlobal.accounts.id.prompt();
        return;
      }
    }

    if (cfg.devFallbackEnabled) {
      setShowGoogleDevPanel((prev) => !prev);
      return;
    }

    setError(
      'Google OAuth ist auf diesem Server noch nicht freigeschaltet. Bitte GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET in Render hinterlegen.'
    );
  };

  const validate = (): string | null => {
    if (!usernamePattern.test(username.trim())) {
      return 'Der Benutzername muss 3-24 Zeichen lang sein und darf nur Buchstaben, Zahlen, _ oder - enthalten.';
    }
    if (
      password.length < 10 ||
      password.length > 128 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return 'Das Passwort muss 10-128 Zeichen lang sein und mindestens einen Großbuchstaben, Kleinbuchstaben und eine Zahl enthalten.';
    }
    if (mode === 'register' && password !== confirmation) return 'Die Passwörter stimmen nicht überein.';
    if (mode === 'register' && !legalConsentAccepted) {
      return 'Bitte bestätige die rechtlichen Hinweise und Datenschutzinformationen.';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const user = await login(username.trim(), password);
        setSuccessMessage(`Willkommen zurück, ${user.username || 'Operator'}! Spiel startet...`);
        soundFx.playRewardClaim();
        setTimeout(() => {
          onAuthenticated(user);
        }, 400);
      } else {
        const user = await register(
          username.trim(),
          password,
          '',
          faction,
          createLegalConsentRecord()
        );
        setSuccessMessage(`Konto erfolgreich erstellt! Willkommen, ${user.username || 'Operator'}!`);
        soundFx.playLevelUp();
        setTimeout(() => {
          onAuthenticated(user);
        }, 600);
      }
    } catch (requestError) {
      setError(
        requestError instanceof AuthRequestError
          ? requestError.message
          : 'Der Authentifizierungsdienst ist gerade nicht erreichbar. Bitte versuche es erneut.'
      );
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmation('');
  };

  return (
    <main className="relative min-h-screen bg-slate-950 px-4 py-8 sm:py-12 text-slate-100 flex items-center justify-center overflow-x-hidden tactical-grid">
      {/* Ambient background glow accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[42rem] max-w-full rounded-full bg-amber-500/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 h-80 w-[36rem] max-w-full rounded-full bg-cyan-500/8 blur-[130px]"
      />

      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)]">
        {/* Top subtle hairline amber accent glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

        <div className="border-b border-white/10 bg-slate-950/70 px-6 py-7 sm:px-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.25)]">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-[11px] font-bold tracking-widest text-amber-400">61267 NEU-ANSPACH</p>
                <p className="text-xs text-slate-400">Zentraler Operator-Zugang</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYS ONLINE</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            {mode === 'login' ? 'Willkommen zurück' : 'Operator-Konto erstellen'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Dein Konto funktioniert auf jedem Gerät. Die Anmeldung bleibt als geschützte Session im Browser und wird nicht im lokalen Speicher abgelegt.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-8" noValidate>
          {/* Tab Switcher */}
          <div
            className="relative flex rounded-xl border border-white/10 bg-slate-950/80 p-1 shadow-inner"
            role="tablist"
            aria-label="Authentifizierungsmodus"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`btn-tactile relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-all duration-150 select-none ${
                mode === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_2px_12px_rgba(245,158,11,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" /> Anmelden
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchMode('register')}
              className={`btn-tactile relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-all duration-150 select-none ${
                mode === 'register'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_2px_12px_rgba(245,158,11,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" /> Registrieren
            </button>
          </div>

          {/* Google OAuth 2.0 Sign-In Section */}
          <div className="space-y-2.5">
            <button
              type="button"
              data-testid="google-auth-button"
              disabled={isSubmitting}
              onClick={handleGoogleButtonClick}
              className="btn-tactile group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition-all duration-150 hover:bg-slate-100 hover:shadow-[0_6px_20px_rgba(255,255,255,0.12)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Mit Google anmelden</span>
            </button>

            <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2 text-center">
              <p className="text-[11px] leading-relaxed text-slate-300">
                Nach der Google-Anmeldung kannst du deinen Wunsch-Nutzernamen frei wählen oder deinen bestehenden alten Account verknüpfen.
              </p>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400 text-center">
              Mit der Anmeldung über Google akzeptierst du die{' '}
              {onOpenLegal ? (
                <button
                  type="button"
                  onClick={onOpenLegal}
                  className="font-semibold text-amber-400 underline underline-offset-2 hover:text-amber-300 cursor-pointer"
                >
                  Datenschutzhinweise (Render, Neon SQL & Google OAuth) und Nutzungsbedingungen
                </button>
              ) : (
                <span className="text-slate-300">
                  Datenschutzhinweise (Render, Neon SQL & Google OAuth) und Nutzungsbedingungen
                </span>
              )}
              .
            </p>

            {/* Dev / Test Mode Google Account Picker Panel */}
            {showGoogleDevPanel && (
              <div
                data-testid="google-dev-panel"
                className="rounded-2xl border border-amber-500/40 bg-slate-950/95 p-4 space-y-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)] animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Google-Konto wählen (Entwicklungs-/Testmodus)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Lokale Testumgebung erkannt. Wähle ein Test-Konto für den sofortigen Login:
                </p>

                <button
                  type="button"
                  data-testid="google-dev-quick-login"
                  disabled={isSubmitting}
                  onClick={() => handleGoogleDevLogin('operator.taunus@gmail.com', 'TaunusOperator')}
                  className="btn-tactile flex w-full items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2.5 text-left text-xs transition-all hover:bg-amber-500/25 active:scale-[0.98] cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-white">TaunusOperator</div>
                    <div className="font-mono text-[11px] text-amber-300">operator.taunus@gmail.com</div>
                  </div>
                  <span className="rounded-lg bg-amber-500 px-2.5 py-1 font-mono text-[10px] font-black text-slate-950">
                    1-Klick Login
                  </span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <input
                    type="email"
                    data-testid="google-dev-email"
                    aria-label="Google Test E-Mail"
                    value={devGoogleEmail}
                    onChange={(e) => setDevGoogleEmail(e.target.value)}
                    placeholder="E-Mail-Adresse"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    data-testid="google-dev-name"
                    aria-label="Google Test Anzeigename"
                    value={devGoogleName}
                    onChange={(e) => setDevGoogleName(e.target.value)}
                    placeholder="Anzeigename"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="button"
                  data-testid="google-dev-submit"
                  disabled={isSubmitting}
                  onClick={() => handleGoogleDevLogin(devGoogleEmail, devGoogleName)}
                  className="btn-tactile w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 px-3 py-2 text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
                >
                  Mit angegebenem Google-Konto fortfahren
                </button>

                {googleConfig?.oauthRedirectEnabled && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsSubmitting(true);
                      startGoogleOAuthRedirect({
                        clanTag: '',
                        faction,
                      });
                    }}
                    className="w-full text-center text-[10px] font-mono text-slate-400 hover:text-amber-400 underline underline-offset-2 pt-1 transition-colors cursor-pointer"
                  >
                    Echten Google OAuth Redirect aufrufen &rarr;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Visual Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-white/10" />
            <span className="mx-3 shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
              ODER MIT OPERATOR-BENUTZERNAMEN
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          {/* Username Field */}
          <div className="space-y-1.5">
            <label htmlFor="auth-username" className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              Benutzername
            </label>
            <input
              id="auth-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              maxLength={24}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="z. B. TaunusHunter"
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-150 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/15 focus:bg-slate-950 shadow-inner"
            />
          </div>

          {mode === 'register' && (
            <>
              {/* Clan-Börse Info Badge instead of Clan-Tag Input */}
              <div
                data-testid="auth-clan-boerse-hint"
                className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200/90 shadow-inner"
              >
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <p>
                  <span className="font-bold text-amber-300">Hinweis:</span> Clans & Clan-Tags werden im Spiel über die neue Clan-Börse vergeben. Du kannst dort einem offenen Clan beitreten oder ab Level 3 deinen eigenen Clan gründen.
                </p>
              </div>

              {/* Faction Selector */}
              <fieldset className="space-y-2">
                <legend className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">Fraktion</legend>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['neu-anspach', 'Neu-Anspach', 'Heimat-Garde'],
                    ['wehrheim', 'Wehrheim', 'Nachbar-Koalition'],
                  ] as const).map(([value, label, sub]) => (
                    <label
                      key={value}
                      className={`btn-tactile group relative flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm transition-all duration-150 select-none ${
                        faction === value
                          ? 'border-amber-500/70 bg-amber-500/15 text-white shadow-[0_0_16px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                          : 'border-white/10 bg-slate-950/80 text-slate-400 hover:border-white/20 hover:bg-slate-900/80 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="faction"
                        value={value}
                        checked={faction === value}
                        onChange={() => setFaction(value)}
                        className="h-4 w-4 accent-amber-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="block font-bold text-xs sm:text-sm truncate">{label}</span>
                        <span className="block text-[10px] text-slate-400 truncate">{sub}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {/* Password Field */}
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              Passwort
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-150 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/15 focus:bg-slate-950 shadow-inner"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-confirm-password" className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                Passwort wiederholen
              </label>
              <input
                id="auth-confirm-password"
                name="password-confirmation"
                type="password"
                autoComplete="new-password"
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-150 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/15 focus:bg-slate-950 shadow-inner"
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-2">
              <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-300 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={legalConsentAccepted}
                  onChange={(event) => setLegalConsentAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-950 accent-amber-500 transition-colors cursor-pointer"
                />
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  Ich bestätige, dass ich die Hinweise zu Datenschutz (Render, Neon SQL & Google OAuth), Nutzungsbedingungen und
                  öffentlichen Spielprofilen gelesen habe. Diese Produktinformation ersetzt keine
                  Rechtsberatung.
                </span>
              </label>
              {onOpenLegal && (
                <button
                  type="button"
                  onClick={onOpenLegal}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 underline underline-offset-2 hover:text-amber-300 cursor-pointer"
                >
                  <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Impressum, Datenschutz (Render, Neon & Google) & Bedingungen öffnen</span>
                </button>
              )}
            </div>
          )}

          {error && (
            <div role="alert" className="flex gap-2.5 rounded-xl border border-red-500/40 bg-red-950/40 px-3.5 py-3 text-xs leading-relaxed text-red-200 shadow-[0_4px_16px_rgba(239,68,68,0.15)] animate-in fade-in">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div role="status" className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs font-mono font-bold text-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.2)] animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-tactile flex w-full items-center justify-center gap-2.5 rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-black text-slate-950 shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:bg-amber-400 hover:shadow-[0_6px_24px_rgba(245,158,11,0.45)] active:scale-[0.98] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {mode === 'login' ? <LogIn className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
            {isSubmitting
              ? 'Wird verarbeitet ...'
              : mode === 'login'
              ? 'Anmelden & Spiel starten'
              : 'Konto registrieren & Spiel starten'}
          </button>
        </form>

        {/* Footer bar with Legal & Privacy Modal Trigger */}
        <div className="border-t border-white/10 bg-slate-950/80 px-6 py-4 text-center">
          <button
            type="button"
            data-testid="auth-open-legal-button"
            onClick={onOpenLegal}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-mono text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <Scale className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>Impressum, Datenschutz (Render, Neon & Google) & Bedingungen</span>
          </button>
        </div>
      </section>
    </main>
  );
};
