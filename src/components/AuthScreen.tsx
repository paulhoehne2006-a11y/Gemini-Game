import React, { useState } from 'react';
import { AlertCircle, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { AuthRequestError, AuthUser, login, register } from '../auth';
import { createLegalConsentRecord } from '../legal';

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
}

type AuthMode = 'login' | 'register';

const usernamePattern = /^[a-zA-Z0-9_-]{3,24}$/;

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [legalConsentAccepted, setLegalConsentAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): string | null => {
    if (!usernamePattern.test(username.trim())) {
      return 'Der Benutzername muss 3-24 Zeichen lang sein und darf nur Buchstaben, Zahlen, _ oder - enthalten.';
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
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = mode === 'login'
        ? await login(username.trim(), password)
        : await register(username.trim(), password, createLegalConsentRecord());
      onAuthenticated(user);
    } catch (requestError) {
      setError(
        requestError instanceof AuthRequestError
          ? requestError.message
          : 'Der Authentifizierungsdienst ist gerade nicht erreichbar. Bitte versuche es erneut.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setPassword('');
    setConfirmation('');
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:flex sm:items-center sm:justify-center">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="border-b border-slate-800 bg-slate-950 px-6 py-7 sm:px-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-400">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-mono text-[11px] font-bold tracking-widest text-amber-400">61267 NEU-ANSPACH</p>
              <p className="text-xs text-slate-400">Zentraler Operator-Zugang</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'login' ? 'Willkommen zurück' : 'Operator-Konto erstellen'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Dein Konto funktioniert auf jedem Gerät. Die Anmeldung bleibt als geschützte Session im Browser und wird nicht im lokalen Speicher abgelegt.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-8" noValidate>
          <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1" role="tablist" aria-label="Authentifizierungsmodus">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${mode === 'login' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" /> Anmelden
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchMode('register')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${mode === 'register' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" /> Registrieren
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="auth-username" className="font-mono text-xs font-bold uppercase tracking-wide text-slate-300">
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
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="auth-password" className="font-mono text-xs font-bold uppercase tracking-wide text-slate-300">
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
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <label htmlFor="auth-confirm-password" className="font-mono text-xs font-bold uppercase tracking-wide text-slate-300">
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
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          )}

          {mode === 'register' && (
            <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
              <input
                type="checkbox"
                checked={legalConsentAccepted}
                onChange={(event) => setLegalConsentAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500"
              />
              <span>
                Ich bestätige, dass ich die Hinweise zu Datenschutz, Nutzungsbedingungen und
                öffentlichen Spielprofilen gelesen habe. Diese Produktinformation ersetzt keine
                Rechtsberatung.
              </span>
            </label>
          )}

          {error && (
            <div role="alert" className="flex gap-2 rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-3 text-xs leading-relaxed text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-black text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === 'login' ? <LogIn className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
            {isSubmitting ? 'Wird verarbeitet ...' : mode === 'login' ? 'Anmelden & Spiel starten' : 'Konto erstellen'}
          </button>
        </form>
      </section>
    </main>
  );
};
