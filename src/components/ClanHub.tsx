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
      onClanTagChange?.(clanData.clan.tag);
      setInvitations(clanData.invitations);
      setMessages(messageData.messages);
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
          setMessages((current) => [...current.filter((item) => item.id !== incomingMessage.id), incomingMessage].slice(-50));
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

  if (loading) return <div className="p-8 text-center text-slate-400">Clan-Zentrale wird geladen …</div>;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 p-4 pb-24 text-slate-100 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-400">Clan-Zentrale</p>
          <h1 className="mt-1 text-3xl font-black text-white">Squad-Verwaltung</h1>
        </div>
        <button type="button" onClick={load} className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:text-white" aria-label="Clan aktualisieren">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      {error && <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}

      {!clan ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-bold text-white">Eigenen Clan gründen</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input value={newClan.tag} onChange={(e) => setNewClan({ ...newClan, tag: e.target.value.toUpperCase() })} maxLength={6} placeholder="TAG" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 uppercase text-white" />
            <input value={newClan.name} onChange={(e) => setNewClan({ ...newClan, name: e.target.value })} maxLength={32} placeholder="Clanname" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
            <input value={newClan.description} onChange={(e) => setNewClan({ ...newClan, description: e.target.value })} maxLength={160} placeholder="Kurzbeschreibung" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </div>
          <button type="button" disabled={busy} onClick={() => run(async () => { await createClan(newClan); })} className="mt-4 rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">Clan gründen</button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-amber-400">[{clan.tag}] · PLATZ {clan.rank}</p>
                  <h2 className="mt-1 text-2xl font-black text-white">{clan.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{clan.description || 'Gemeinsam für Neu-Anspach.'}</p>
                </div>
                <div className="rounded-xl bg-amber-500/15 p-3 text-right">
                  <div className="text-2xl font-black text-amber-300">{clan.totalScore.toLocaleString('de-DE')}</div>
                  <div className="font-mono text-[10px] text-amber-200/70">CLAN-PUNKTE</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-xl bg-slate-950/70 p-3"><Users className="mx-auto mb-1 h-4 w-4 text-cyan-300" />{clan.memberCount} Mitglieder</div>
                <div className="rounded-xl bg-slate-950/70 p-3"><Shield className="mx-auto mb-1 h-4 w-4 text-emerald-300" />{clan.totalWins} Siege</div>
                <div className="rounded-xl bg-slate-950/70 p-3"><Crown className="mx-auto mb-1 h-4 w-4 text-amber-300" />{clan.totalKills} Kills</div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="font-bold text-white">Einladungen</h3>
              {invitations.length === 0 ? <p className="mt-3 text-sm text-slate-500">Keine offenen Einladungen.</p> : invitations.map((invite) => (
                <div key={invite.id} className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-950 p-3 text-sm">
                  <span><b className="text-white">[{invite.clanTag}] {invite.clanName}</b><br /><span className="text-slate-500">von {invite.inviterName}</span></span>
                  <span className="flex gap-1"><button type="button" onClick={() => run(async () => { await answerClanInvitation(invite.id, true); })} className="rounded-lg bg-emerald-500 p-2 text-slate-950"><Check className="h-4 w-4" /></button><button type="button" onClick={() => run(async () => { await answerClanInvitation(invite.id, false); })} className="rounded-lg bg-slate-800 p-2 text-slate-300"><X className="h-4 w-4" /></button></span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="flex items-center gap-2 font-bold text-white"><Users className="h-4 w-4 text-cyan-300" /> Mitglieder</h3>
              <div className="mt-3 space-y-2">{clan.members.map((member) => <div key={member.accountId} className="flex items-center justify-between rounded-xl bg-slate-950/70 p-3"><span>{member.role === 'leader' && <Crown className="mr-2 inline h-4 w-4 text-amber-400" />}{member.username}</span><span className="font-mono text-xs text-slate-400">{member.score.toLocaleString('de-DE')} Pkt</span></div>)}</div>
              <div className="mt-4 flex gap-2"><input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Benutzername einladen" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><button type="button" onClick={() => run(async () => { await inviteToClan(inviteName); setInviteName(''); })} className="rounded-xl bg-cyan-400 px-3 text-slate-950"><UserPlus className="h-4 w-4" /></button></div>
              <button type="button" onClick={() => run(async () => { await leaveClan(); })} className="mt-4 text-xs text-red-300 hover:text-red-200">Clan verlassen</button>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="flex items-center gap-2 font-bold text-white"><MessageCircle className="h-4 w-4 text-amber-300" /> Clanchat</h3>
              <div className="mt-3 h-64 space-y-2 overflow-y-auto rounded-xl bg-slate-950 p-3">{messages.map((message) => <div key={message.id} className="text-sm"><b className="text-amber-300">{message.authorName}</b><span className="ml-2 text-slate-300">{message.text}</span></div>)}</div>
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (messageText.trim()) run(async () => { await sendClanMessage(messageText); setMessageText(''); }); }}><input value={messageText} onChange={(e) => setMessageText(e.target.value)} maxLength={240} placeholder={`Nachricht als ${playerName}`} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><button type="submit" className="rounded-xl bg-amber-500 px-3 text-slate-950"><Send className="h-4 w-4" /></button></form>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
