import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { AuthRequestError, AuthUser, login, register } from '../auth';
import { createLegalConsentRecord } from '../legal';
import { soundFx } from '../audio/soundFx';

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
}

type AuthMode = 'login' | 'register';

const usernamePattern = /^[a-zA-Z0-9_-]{3,24}$/;

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [clanTag, setClanTag] = useState('');
  const [faction, setFaction] = useState<'neu-anspach' | 'wehrheim'>('neu-anspach');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [legalConsentAccepted, setLegalConsentAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): string | null => {
    if (!usernamePattern.test(username.trim())) {
      return 'Der Benutzername muss 3-24 Zeichen lang sein und darf nur Buchstaben, Zahlen, _ oder - enthalten.';
    }
    if (mode === 'register' && !/^[a-zA-Z0-9_-]{2,6}$/.test(clanTag.trim())) {
      return 'Der Clan-Tag muss 2-6 Zeichen lang sein und darf nur Buchstaben, Zahlen, _ oder - enthalten.';
    }
    if (password.length < 10 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
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
        const user = await register(username.trim(), password, clanTag.trim().toUpperCase(), faction, createLegalConsentRecord());
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
              {/* Clan-Tag Field */}
              <div className="space-y-1.5">
                <label htmlFor="auth-clan-tag" className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Clan-Tag
                </label>
                <input
                  id="auth-clan-tag"
                  name="clanTag"
                  type="text"
                  autoComplete="organization"
                  required
                  minLength={2}
                  maxLength={6}
                  pattern="[a-zA-Z0-9_-]{2,6}"
                  value={clanTag}
                  onChange={(event) => setClanTag(event.target.value.toUpperCase())}
                  aria-describedby="auth-clan-tag-help"
                  placeholder="z. B. 61267"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm uppercase tracking-wider font-mono text-white placeholder:text-slate-600 outline-none transition-all duration-150 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/15 focus:bg-slate-950 shadow-inner"
                />
                <p id="auth-clan-tag-help" className="text-xs text-slate-500">2-6 Zeichen: Buchstaben, Zahlen, _ oder -.</p>
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
            <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-300 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={legalConsentAccepted}
                onChange={(event) => setLegalConsentAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-950 accent-amber-500 transition-colors cursor-pointer"
              />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Ich bestätige, dass ich die Hinweise zu Datenschutz, Nutzungsbedingungen und
                öffentlichen Spielprofilen gelesen habe. Diese Produktinformation ersetzt keine
                Rechtsberatung.
              </span>
            </label>
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
      </section>
    </main>
  );
};
