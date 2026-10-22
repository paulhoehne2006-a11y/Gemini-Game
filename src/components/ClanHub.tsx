import React, { useEffect, useState } from 'react';
import {
  Check,
  Crown,
  MessageCircle,
  RefreshCw,
  Send,
  Shield,
  UserPlus,
  Users,
  X,
  Trophy,
  Swords,
  Radio,
  Flame,
  AlertCircle,
  LogOut,
  Terminal,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  answerClanInvitation,
  ClanInvitation,
  ClanMessage,
  ClanSummary,
  createClan,
  fetchClanMessages,
  fetchMyClan,
  inviteToClan,
  leaveClan,
  sendClanMessage,
} from '../game/clans';
import { connectLeaderboardSocket } from '../game/multiplayer';

interface ClanHubProps {
  playerName: string;
  onClanTagChange?: (tag: string) => void;
}

export const ClanHub: React.FC<ClanHubProps> = ({ playerName, onClanTagChange }) => {
  const [clan, setClan] = useState<ClanSummary | null>(null);
  const [invitations, setInvitations] = useState<ClanInvitation[]>([]);
  const [messages, setMessages] = useState<ClanMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [newClan, setNewClan] = useState({ tag: '', name: '', description: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const [clanData, messageData] = await Promise.all([fetchMyClan(), fetchClanMessages()]);
      setClan(clanData.clan);
      if (clanData.clan?.tag) {
        onClanTagChange?.(clanData.clan.tag);
      }
      setInvitations(clanData.invitations || []);
      setMessages(messageData.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clan konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const socket = connectLeaderboardSocket(
      () => {},
      undefined,
      undefined,
      (incomingClanTag, incomingMessage) => {
        if (incomingClanTag === clan?.tag) {
          setMessages((current) =>
            [...current.filter((item) => item.id !== incomingMessage.id), incomingMessage].slice(-50)
          );
        }
      }
    );
    return () => socket.disconnect();
  }, [clan?.tag]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      setError(null);
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-slate-400">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
          </div>
        </div>
        <div className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Initialisiere Clan-Zentrale …
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-32 lg:pb-16 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header - Dark Obsidian Glassmorphism with Tactical Accents */}
      <header className="relative overflow-hidden rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Layered Ambient Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Tactical Corner Brackets */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400/50 pointer-events-none" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400/50 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-400/50 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-400/50 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                [SYSTEM: SQUAD OPERATIONS]
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-800/80 border border-white/10 text-slate-300">
                CLAN-ZENTRALE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Squad- & Clan-Verwaltung
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kämpfe im Verbund! Gründet einen Clan, ladet Mitstreiter ein, teilt eure Siege und koordiniert euch im verschlüsselten Clanchat.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={busy}
            className="self-start sm:self-auto p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-150 cursor-pointer shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
            aria-label="Clan-Daten aktualisieren"
            title="Aktualisieren"
          >
            <RefreshCw className={`h-4 w-4 transition-transform ${busy ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-950/40 backdrop-blur-md p-4 text-sm text-red-200 shadow-xl">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* STATE 1: Player currently has no Clan */}
      {!clan ? (
        <div className="space-y-6 sm:space-y-8">
          {/* Pending Invitations for player without clan */}
          {invitations.length > 0 && (
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-4">
              <h3 className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Offene Clan-Einladungen ({invitations.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-sm shadow-md hover:border-white/20 transition-all"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="text-amber-400 font-mono font-black">[{invite.clanTag}]</span>
                        <span>{invite.clanName}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Eingeladen von <span className="text-slate-200 font-medium">{invite.inviterName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await answerClanInvitation(invite.id, true);
                          })
                        }
                        className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 transition-all duration-150 cursor-pointer shadow-md shadow-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                        title="Einladung annehmen"
                        aria-label={`Einladung von Clan ${invite.clanName} annehmen`}
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await answerClanInvitation(invite.id, false);
                          })
                        }
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-400 hover:text-white transition-all duration-150 cursor-pointer border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                        title="Einladung ablehnen"
                        aria-label={`Einladung von Clan ${invite.clanName} ablehnen`}
                      >
                        <X className="h-4 w-4 stroke-[2]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clan Creation Form with Live Dossier Preview */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-6">
            <div className="space-y-1.5">
              <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>NEUER SQUAD-AUFTRAG</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Eigenen Clan im Taunus gründen
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Erstelle ein eigenes Truppenkürzel (Clan-Tag) mit bis zu 6 Zeichen. Alle Mitglieder tragen dein Kürzel im Gefecht und auf der Rangliste.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                  Clan-Tag (Max. 6 Zeichen)
                </label>
                <input
                  value={newClan.tag}
                  onChange={(e) =>
                    setNewClan({ ...newClan, tag: e.target.value.toUpperCase() })
                  }
                  maxLength={6}
                  placeholder="z.B. ANSPCH"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 font-mono font-bold uppercase text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                  Vollständiger Clanname
                </label>
                <input
                  value={newClan.name}
                  onChange={(e) => setNewClan({ ...newClan, name: e.target.value })}
                  maxLength={32}
                  placeholder="z.B. Hessenpark Bürgerwehr"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                  Motto / Kurzbeschreibung
                </label>
                <input
                  value={newClan.description}
                  onChange={(e) => setNewClan({ ...newClan, description: e.target.value })}
                  maxLength={160}
                  placeholder="z.B. Für Neu-Anspach bis zum Sieg!"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Live Clan Badge Preview */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center font-mono font-black text-amber-300 text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                  {newClan.tag || 'TAG'}
                </div>
                <div>
                  <div className="font-bold text-white text-base">
                    {newClan.name || 'Dein Clanname'}
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-1">
                    {newClan.description || 'Kurzbeschreibung des Squads'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={busy || !newClan.tag.trim() || !newClan.name.trim()}
                onClick={() =>
                  run(async () => {
                    await createClan(newClan);
                  })
                }
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              >
                Clan gründen
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STATE 2: Player has a Clan */
        <>
          {/* Hero Clan Operations Card & Open Invitations Panel */}
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Clan Headquarters Deck */}
            <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-amber-950/30 backdrop-blur-xl border border-amber-500/35 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2.5 py-0.5 rounded-md font-black bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                      [{clan.tag}]
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md font-bold bg-slate-950/80 text-slate-300 border border-white/10">
                      RANG #{clan.rank}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {clan.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                    {clan.description || 'Gemeinsam für 61267 Neu-Anspach.'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/90 border border-amber-500/35 p-4 sm:p-5 text-right shadow-[0_0_20px_rgba(245,158,11,0.12)]">
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums">
                    {clan.totalScore.toLocaleString('de-DE')}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-amber-400/80 uppercase tracking-wider mt-0.5">
                    GESAMT-CLANPUNKTE
                  </div>
                </div>
              </div>

              {/* 3 Tactical Telemetry Chips */}
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-center space-y-1 hover:border-cyan-500/50 transition-colors shadow-sm">
                  <Users className="mx-auto h-4 w-4 text-cyan-400" />
                  <div className="text-base sm:text-lg font-black text-white tabular-nums">
                    {clan.memberCount}
                  </div>
                  <div className="text-[10px] text-cyan-300/80 uppercase tracking-wider font-semibold">Mitglieder</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center space-y-1 hover:border-emerald-500/50 transition-colors shadow-sm">
                  <Shield className="mx-auto h-4 w-4 text-emerald-400" />
                  <div className="text-base sm:text-lg font-black text-white tabular-nums">
                    {clan.totalWins}
                  </div>
                  <div className="text-[10px] text-emerald-300/80 uppercase tracking-wider font-semibold">Siege</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center space-y-1 hover:border-amber-500/50 transition-colors shadow-sm">
                  <Crown className="mx-auto h-4 w-4 text-amber-400" />
                  <div className="text-base sm:text-lg font-black text-white tabular-nums">
                    {clan.totalKills}
                  </div>
                  <div className="text-[10px] text-amber-300/80 uppercase tracking-wider font-semibold">Kills</div>
                </div>
              </div>
            </div>

            {/* Invitations Panel */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Offene Einladungen ({invitations.length})</span>
                </h3>

                <div className="mt-3.5 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {invitations.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 text-center text-xs text-slate-400 font-mono">
                      Keine offenen Einladungen vorhanden.
                    </div>
                  ) : (
                    invitations.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs shadow-sm hover:border-white/20 transition-all"
                      >
                        <div>
                          <div className="font-bold text-white">
                            <span className="text-amber-400 font-mono font-black">[{invite.clanTag}]</span>{' '}
                            {invite.clanName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            von <span className="text-slate-300 font-medium">{invite.inviterName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await answerClanInvitation(invite.id, true);
                              })
                            }
                            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 transition-all duration-150 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                            title="Annehmen"
                            aria-label={`Einladung von ${invite.clanName} annehmen`}
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await answerClanInvitation(invite.id, false);
                              })
                            }
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-400 hover:text-white transition-all duration-150 cursor-pointer border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                            title="Ablehnen"
                            aria-label={`Einladung von ${invite.clanName} ablehnen`}
                          >
                            <X className="h-3.5 w-3.5 stroke-[2]" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 font-mono leading-relaxed">
                Einladungen anderer Clans können jederzeit angenommen werden (wechselt automatisch deinen aktiven Clan).
              </div>
            </div>
          </div>

          {/* Member Roster & Tactical Military Comms Chat Terminal */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Member Roster Card */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase tracking-wider">
                    <Users className="h-4 w-4 text-cyan-400" />
                    <span>Squad-Mitglieder ({clan.members.length})</span>
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold">
                    [{clan.tag}] ROSTER
                  </span>
                </div>

                {/* Member Roster List */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {clan.members.map((member) => (
                    <div
                      key={member.accountId}
                      className="flex items-center justify-between rounded-xl bg-slate-950/80 border border-white/10 p-3.5 hover:border-white/20 transition-all duration-150 shadow-sm"
                    >
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        {member.role === 'leader' ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                            <Crown className="h-3 w-3 text-amber-400" />
                            <span>LEADER</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[10px] font-mono border border-white/5">
                            MEMBER
                          </span>
                        )}
                        <span>{member.username}</span>
                        {member.username.toLowerCase() === playerName.toLowerCase() && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Du
                          </span>
                        )}
                      </div>

                      <div className="font-mono text-xs text-amber-300 font-bold tabular-nums">
                        {member.score.toLocaleString('de-DE')} Pkt
                      </div>
                    </div>
                  ))}
                </div>

                {/* Invite Member Input */}
                <div className="pt-2">
                  <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-medium">
                    Spieler in Clan einladen:
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Benutzername eingeben …"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors shadow-inner"
                    />
                    <button
                      type="button"
                      disabled={busy || !inviteName.trim()}
                      onClick={() =>
                        run(async () => {
                          await inviteToClan(inviteName.trim());
                          setInviteName('');
                        })
                      }
                      className="rounded-xl bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-50 text-slate-950 px-4 font-bold text-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-md shadow-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Einladen</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Leave Clan Action */}
              <div className="pt-3.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Clan-Mitgliedschaft beenden:
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      if (window.confirm('Möchtest du den Clan wirklich verlassen?')) {
                        await leaveClan();
                      }
                    })
                  }
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Clan verlassen</span>
                </button>
              </div>
            </div>

            {/* Military Comms Clan Chat Terminal */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase tracking-wider">
                    <MessageCircle className="h-4 w-4 text-amber-400" />
                    <span>Clanchat (Verschlüsselt)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                    KANAL: [{clan.tag}]
                  </span>
                </div>

                {/* Chat Log Console */}
                <div className="h-64 sm:h-72 space-y-2.5 overflow-y-auto rounded-2xl bg-slate-950/80 border border-white/10 p-4 font-sans shadow-inner">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400 font-mono space-y-2">
                      <Terminal className="w-6 h-6 text-slate-600" />
                      <p>Noch keine Funksprüche vorhanden. Schreibe die erste taktische Meldung an deinen Squad!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMe = message.authorName.toLowerCase() === playerName.toLowerCase();
                      return (
                        <div
                          key={message.id}
                          className={`text-xs p-3 rounded-2xl border transition-all duration-150 shadow-sm ${
                            isMe
                              ? 'bg-amber-500/10 border-amber-500/30 ml-6 text-slate-100'
                              : 'bg-slate-900/80 border-white/10 mr-6 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                            <span className={isMe ? 'text-amber-300 font-bold' : 'text-cyan-300 font-bold'}>
                              {message.authorName} {isMe ? '(Du)' : ''}
                            </span>
                            <span className="text-slate-400 font-medium">
                              {message.createdAt
                                ? new Date(message.createdAt).toLocaleTimeString('de-DE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                          <div className="leading-relaxed break-words font-sans">
                            {message.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Send Form */}
                <form
                  className="flex gap-2 pt-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (messageText.trim()) {
                      run(async () => {
                        await sendClanMessage(messageText.trim());
                        setMessageText('');
                      });
                    }
                  }}
                >
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    maxLength={240}
                    placeholder={`Funkspruch als ${playerName} …`}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-colors shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={busy || !messageText.trim()}
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] disabled:opacity-50 text-slate-950 px-5 font-bold text-xs flex items-center justify-center transition-all duration-150 cursor-pointer shadow-md shadow-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                    aria-label="Funkspruch absenden"
                  >
                    <Send className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
