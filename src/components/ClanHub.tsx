import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Compass,
  Crown,
  Flame,
  Gift,
  Lock,
  LogOut,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  Skull,
  Star,
  Swords,
  Target,
  Terminal,
  Trophy,
  Unlock,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  answerClanInvitation,
  claimClanQuestReward,
  CLAN_CREATE_COST_NAT,
  CLAN_CREATE_MIN_LEVEL,
  ClanBadgeIcon,
  ClanInvitation,
  ClanJoinType,
  ClanMemberRole,
  ClanMessage,
  ClanQuest,
  ClanSummary,
  contributeClanQuest,
  createClan,
  fetchClanDirectory,
  fetchClanMessages,
  fetchMyClan,
  inviteToClan,
  joinClanFromDirectory,
  kickClanMember,
  leaveClan,
  respondToJoinRequest,
  sendClanMessage,
  startClanWarBattle,
  updateClanMemberRole,
  updateClanSettings,
} from '../game/clans';
import { connectLeaderboardSocket } from '../game/multiplayer';

export interface ClanHubProps {
  playerName: string;
  operatorLevel?: number;
  budget?: number;
  reputation?: number;
  highestWave?: number;
  playerScore?: number;
  onClanTagChange?: (tag: string) => void;
  onSpendNAT?: (amount: number) => void;
  onEarnRewards?: (rewards: { nat?: number; reputation?: number; skillPoints?: number }) => void;
}

type NoClanTab = 'directory' | 'create';
type ClanSubTab = 'war' | 'quests' | 'members' | 'settings_chat';
type DirectoryFilter = 'all' | 'open' | 'eligible';

const BADGE_OPTIONS: {
  id: ClanBadgeIcon;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: 'shield',
    label: 'Bollwerk-Schild',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-400/40',
  },
  {
    id: 'swords',
    label: 'Sturmklingen',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-400/40',
  },
  {
    id: 'crown',
    label: 'Taunus-Krone',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-400/40',
  },
  {
    id: 'flame',
    label: 'Feuersturm',
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    border: 'border-orange-400/40',
  },
  {
    id: 'eagle',
    label: 'Feldberg-Adler',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-400/40',
  },
  {
    id: 'skull',
    label: 'Phantom-Kommando',
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-400/40',
  },
];

const WAR_STAGES = [
  { stage: 1, name: 'Etappe 1: Saalburg-Chaussee', minFame: 0, targetFame: 500 },
  { stage: 2, name: 'Etappe 2: Hessenpark-Bollwerk', minFame: 500, targetFame: 1200 },
  { stage: 3, name: 'Etappe 3: Usa-Tal Brückenkopf', minFame: 1200, targetFame: 2000 },
  { stage: 4, name: 'Etappe 4: Feldberg-Relaisstation', minFame: 2000, targetFame: 2600 },
  { stage: 5, name: 'Etappe 5: Taunus-Kapitol', minFame: 2600, targetFame: 3000 },
];

const WAR_MODES: {
  id: 'raid' | 'siege' | 'boss';
  title: string;
  difficulty: 'Schwer' | 'Extrem' | 'Legendär';
  recLevel: number;
  description: string;
  fameRange: string;
  rewardNatText: string;
  rewardRepText: string;
  rewardSpText?: string;
  accentBorder: string;
  accentBg: string;
  badgeStyle: string;
}[] = [
  {
    id: 'raid',
    title: 'Sektor-Sturmangriff',
    difficulty: 'Schwer',
    recLevel: 3,
    description: 'Stürme die gepanzerten Wehrheimer Stellungen im vorderen Sektor.',
    fameRange: '+150–250 Kriegsruhm',
    rewardNatText: '+110 NAT',
    rewardRepText: '+55 Ruf',
    accentBorder: 'border-cyan-500/35 hover:border-cyan-400/60',
    accentBg: 'from-slate-900/90 via-slate-900/80 to-cyan-950/30',
    badgeStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
  },
  {
    id: 'siege',
    title: 'Konvoi-Belagerung',
    difficulty: 'Extrem',
    recLevel: 6,
    description:
      'Eskortiere den Bembel-Versorgungszug durch schweres Artilleriefeuer und Elite-Scharfschützen.',
    fameRange: '+220–350 Kriegsruhm',
    rewardNatText: '+160 NAT',
    rewardRepText: '+85 Ruf',
    accentBorder: 'border-amber-500/40 hover:border-amber-400/70',
    accentBg: 'from-slate-900/90 via-slate-900/80 to-amber-950/35',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  },
  {
    id: 'boss',
    title: 'Kommandanten-Duell: Feldberg-Titan',
    difficulty: 'Legendär',
    recLevel: 10,
    description:
      'Tritt im 3-Phasen-Bosskampf gegen das schwer gepanzerte Kommandofahrzeug auf dem Feldberg an.',
    fameRange: '+320–500 Kriegsruhm',
    rewardNatText: '+240 NAT',
    rewardRepText: '+120 Ruf',
    rewardSpText: '+1 SP (1x/Tag)',
    accentBorder: 'border-rose-500/45 hover:border-rose-400/75',
    accentBg: 'from-slate-900/90 via-slate-900/80 to-rose-950/40',
    badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
  },
];

function renderBadgeIcon(badge?: ClanBadgeIcon, className = 'w-5 h-5') {
  switch (badge) {
    case 'swords':
      return <Swords className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'eagle':
      return <Compass className={className} />;
    case 'skull':
      return <Skull className={className} />;
    case 'shield':
    default:
      return <Shield className={className} />;
  }
}

function getBadgeMeta(badge?: ClanBadgeIcon) {
  return BADGE_OPTIONS.find((b) => b.id === badge) || BADGE_OPTIONS[0];
}

function getRiverStageNumber(fame = 0): number {
  if (fame >= 2600) return 5;
  if (fame >= 2000) return 4;
  if (fame >= 1200) return 3;
  if (fame >= 500) return 2;
  return 1;
}

function formatRoleLabel(role?: ClanMemberRole) {
  switch (role) {
    case 'leader':
      return {
        label: 'Anführer',
        style:
          'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
      };
    case 'co_leader':
      return {
        label: 'Vize-Anführer',
        style: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      };
    case 'elder':
      return {
        label: 'Ältester',
        style: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      };
    case 'member':
    default:
      return {
        label: 'Mitglied',
        style: 'bg-slate-800/80 text-slate-300 border-white/10',
      };
  }
}

function formatJoinTypeBadge(joinType?: ClanJoinType) {
  switch (joinType) {
    case 'invite_only':
      return {
        label: 'Auf Anfrage',
        style: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
        Icon: Lock,
      };
    case 'closed':
      return {
        label: 'Geschlossen',
        style: 'bg-rose-500/15 text-rose-300 border-rose-400/40',
        Icon: Lock,
      };
    case 'open':
    default:
      return {
        label: 'Offen',
        style: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
        Icon: Unlock,
      };
  }
}

function formatQuestDifficulty(diff?: ClanQuest['difficulty'] | string) {
  if (diff === 'nightmare' || diff === 'Legendär') {
    return {
      label: 'Legendär',
      style: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    };
  }
  if (diff === 'extreme' || diff === 'Extrem') {
    return {
      label: 'Extrem',
      style: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    };
  }
  return {
    label: 'Schwer',
    style: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
  };
}

export const ClanHub: React.FC<ClanHubProps> = ({
  playerName,
  operatorLevel = 1,
  budget = 500,
  reputation = 150,
  highestWave = 1,
  playerScore = 0,
  onClanTagChange,
  onSpendNAT,
  onEarnRewards,
}) => {
  const createMinLevel = CLAN_CREATE_MIN_LEVEL ?? 3;
  const createCostNat = CLAN_CREATE_COST_NAT ?? 1000;

  const [clan, setClan] = useState<ClanSummary | null>(null);
  const [directory, setDirectory] = useState<ClanSummary[]>([]);
  const [invitations, setInvitations] = useState<ClanInvitation[]>([]);
  const [messages, setMessages] = useState<ClanMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Navigation Tabs
  const [noClanTab, setNoClanTab] = useState<NoClanTab>('directory');
  const [clanSubTab, setClanSubTab] = useState<ClanSubTab>('war');

  // Directory Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<DirectoryFilter>('all');
  const [showDirectoryInMemberTab, setShowDirectoryInMemberTab] = useState(false);

  // Create Clan State
  const [newClan, setNewClan] = useState<{
    tag: string;
    name: string;
    description: string;
    badge: ClanBadgeIcon;
    joinType: ClanJoinType;
    minLevel: number;
    minScore: number;
    minWave: number;
  }>({
    tag: '',
    name: '',
    description: '',
    badge: 'shield',
    joinType: 'open',
    minLevel: 1,
    minScore: 0,
    minWave: 1,
  });

  // Clan Settings Form State (when inside a clan)
  const [settingsForm, setSettingsForm] = useState<{
    description: string;
    badge: ClanBadgeIcon;
    joinType: ClanJoinType;
    minLevel: number;
    minScore: number;
    minWave: number;
  }>({
    description: '',
    badge: 'shield',
    joinType: 'open',
    minLevel: 1,
    minScore: 0,
    minWave: 1,
  });

  // Combat report banner for Clan Wars
  const [combatReport, setCombatReport] = useState<{
    victory: boolean;
    modeTitle: string;
    fameEarned: number;
    rewardNAT: number;
    rewardReputation: number;
    rewardSkillPoints: number;
    summary: string;
  } | null>(null);

  // Chat & Invite
  const [messageText, setMessageText] = useState('');
  const [inviteName, setInviteName] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const syncSettingsFromClan = (c: ClanSummary | null) => {
    if (!c) return;
    setSettingsForm({
      description: c.description || '',
      badge: c.badge || 'shield',
      joinType: c.joinType || 'open',
      minLevel: c.minLevel ?? 1,
      minScore: c.minScore ?? 0,
      minWave: c.minWave ?? 1,
    });
  };

  const load = async () => {
    try {
      setError(null);
      const [clanData, messageData, directoryData] = await Promise.all([
        fetchMyClan(),
        fetchClanMessages(),
        fetchClanDirectory().catch(() => ({ clans: [] as ClanSummary[] })),
      ]);
      setClan(clanData.clan);
      syncSettingsFromClan(clanData.clan);
      if (clanData.clan?.tag) {
        onClanTagChange?.(clanData.clan.tag);
      }
      setInvitations(clanData.invitations || []);
      setMessages(messageData.messages || []);
      setDirectory(directoryData.clans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clan-Zentrale konnte nicht geladen werden.');
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

  // Determine current player's role in clan
  const myMemberRecord = useMemo(() => {
    if (!clan) return null;
    return (
      clan.members.find((m) => m.username.toLowerCase() === playerName.toLowerCase()) ||
      clan.members[0] ||
      null
    );
  }, [clan, playerName]);

  const isLeader = myMemberRecord?.role === 'leader';
  const canManageClan = myMemberRecord?.role === 'leader' || myMemberRecord?.role === 'co_leader';

  // Filtered Directory
  const filteredDirectory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return directory.filter((c) => {
      if (q) {
        const matchTag = c.tag.toLowerCase().includes(q);
        const matchName = c.name.toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        if (!matchTag && !matchName && !matchDesc) return false;
      }
      if (directoryFilter === 'open' && (c.joinType || 'open') !== 'open') {
        return false;
      }
      if (directoryFilter === 'eligible') {
        const joinType = c.joinType || 'open';
        if (joinType === 'closed') return false;
        if (operatorLevel < (c.minLevel ?? 1)) return false;
        if (playerScore < (c.minScore ?? 0)) return false;
        if (highestWave < (c.minWave ?? 1)) return false;
      }
      return true;
    });
  }, [directory, searchQuery, directoryFilter, operatorLevel, playerScore, highestWave]);

  // War League Leaderboard sorted by warTrophies + warFame
  const warLeaderboard = useMemo(() => {
    const map = new Map<string, ClanSummary>();
    for (const item of directory) {
      map.set(item.tag, item);
    }
    if (clan) {
      map.set(clan.tag, clan);
    }
    return Array.from(map.values()).sort((a, b) => {
      const aScore = (a.warTrophies ?? 1000) * 10 + (a.warFame ?? 0);
      const bScore = (b.warTrophies ?? 1000) * 10 + (b.warFame ?? 0);
      return bScore - aScore;
    });
  }, [directory, clan]);

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

  const canAffordCreate = budget >= createCostNat;
  const meetsCreateLevel = operatorLevel >= createMinLevel;
  const canSubmitCreate =
    meetsCreateLevel &&
    canAffordCreate &&
    newClan.tag.trim().length >= 2 &&
    newClan.name.trim().length >= 3;

  const currentRiverStage = clan ? getRiverStageNumber(clan.warFame ?? 0) : 1;

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-32 lg:pb-16 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Global Header - Dark Obsidian Glassmorphism with Tactical Accents */}
      <header className="relative overflow-hidden rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-white/10 p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
        {/* Layered Ambient Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Tactical Corner Brackets */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400/50 pointer-events-none" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400/50 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-400/50 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-400/50 pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                [SYSTEM: SQUAD OPERATIONS]
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-800/80 border border-white/10 text-slate-300">
                CLAN-ZENTRALE
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-400/40 text-amber-300">
                TAUNUS-KRIEGSLIGA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Squad- & Clan-Verwaltung
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Durchsuche die Clan-Börse, gründe ab Operator-Level {createMinLevel} dein eigenes Einsatzkommando, bestreite mehrstufige Clankriege im Taunus und meistere kooperative Clanaufgaben.
            </p>
          </div>

          {/* Player Dossier Telemetry Strip + Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/85 border border-white/10 text-xs font-mono">
              <Award className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Operator</div>
                <div className="font-black text-white">Lv. {operatorLevel}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/85 border border-amber-500/30 text-xs font-mono">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-amber-300/80 uppercase">Kriegskasse</div>
                <div className="font-black text-amber-300 tabular-nums">
                  {budget.toLocaleString('de-DE')} NAT
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/85 border border-emerald-500/30 text-xs font-mono">
              <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-emerald-300/80 uppercase">Welle / Score</div>
                <div className="font-black text-emerald-300 tabular-nums">
                  W{highestWave} · {playerScore.toLocaleString('de-DE')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={busy}
              className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-150 cursor-pointer shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
              aria-label="Clan-Daten aktualisieren"
              title="Aktualisieren"
            >
              <RefreshCw
                className={`h-4 w-4 transition-transform ${busy ? 'animate-spin text-cyan-400' : ''}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Feedback Banner */}
      {toast && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-950/60 backdrop-blur-md p-4 text-sm text-emerald-200 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toast}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-emerald-300/70 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Meldung schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-950/50 backdrop-blur-md p-4 text-sm text-red-200 shadow-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-300/70 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Fehler schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          STATE A: PLAYER HAS NO CLAN (!clan)
         ===================================================================== */}
      {!clan ? (
        <div className="space-y-6 sm:space-y-8">
          {/* Open Invitations Banner */}
          {invitations.length > 0 && (
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-cyan-500/35 shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-4">
              <h3 className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Offene Clan-Einladungen ({invitations.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/85 border border-white/10 text-sm shadow-md hover:border-white/20 transition-all"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="text-amber-400 font-mono font-black">
                          [{invite.clanTag}]
                        </span>
                        <span>{invite.clanName}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Eingeladen von{' '}
                        <span className="text-slate-200 font-medium">{invite.inviterName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await answerClanInvitation(invite.id, true);
                            showToast(`Du bist [${invite.clanTag}] ${invite.clanName} beigetreten!`);
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
                            showToast('Einladung abgelehnt.');
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

          {/* Top 2-Tab Switcher for No-Clan View */}
          <div className="flex flex-wrap items-center gap-3 p-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => setNoClanTab('directory')}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                noClanTab === 'directory'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-950 border border-white/5'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Clan-Börse (Clans suchen & beitreten)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                  noClanTab === 'directory'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-cyan-500/20 text-cyan-300'
                }`}
              >
                {directory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setNoClanTab('create')}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                noClanTab === 'create'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-950 border border-white/5'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>
                Eigenen Clan gründen (Ab Level {createMinLevel} · {createCostNat.toLocaleString('de-DE')} NAT)
              </span>
            </button>
          </div>

          {/* VIEW 1: CLAN-BÖRSE (SEARCHABLE & FILTERABLE DIRECTORY) */}
          {noClanTab === 'directory' ? (
            <div className="space-y-6">
              {/* Search & Filter Bar */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Clan-Name, [TAG] oder Motto in der Clan-Börse suchen …"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/85 pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors shadow-inner"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDirectoryFilter('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] border ${
                        directoryFilter === 'all'
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      Alle Clans ({directory.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectoryFilter('open')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] border ${
                        directoryFilter === 'open'
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      Nur Offen
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectoryFilter('eligible')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] border ${
                        directoryFilter === 'eligible'
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      Beitretbar mit meinem Level (Lv. {operatorLevel})
                    </button>
                  </div>
                </div>
              </div>

              {/* Clan Directory Cards Grid */}
              {filteredDirectory.length === 0 ? (
                <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 text-center space-y-4 shadow-xl">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-950/90 border border-white/10 flex items-center justify-center text-cyan-400">
                    <Compass className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">Keine passenden Clans gefunden</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                      Passe deinen Suchbegriff oder Filter an — oder gründe jetzt deinen eigenen Clan im Taunus!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNoClanTab('create')}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer active:scale-[0.98] transition-all"
                  >
                    Eigenen Clan gründen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {filteredDirectory.map((c) => {
                    const badgeMeta = getBadgeMeta(c.badge);
                    const joinType = c.joinType || 'open';
                    const joinTypeMeta = formatJoinTypeBadge(joinType);
                    const JoinIcon = joinTypeMeta.Icon;

                    const reqLevel = c.minLevel ?? 1;
                    const reqScore = c.minScore ?? 0;
                    const reqWave = c.minWave ?? 1;

                    const meetsLevel = operatorLevel >= reqLevel;
                    const meetsScore = playerScore >= reqScore;
                    const meetsWave = highestWave >= reqWave;
                    const isFull = c.memberCount >= (c.maxMembers || 50);
                    const meetsAll = meetsLevel && meetsScore && meetsWave && !isFull;

                    let missingReason = '';
                    if (isFull) missingReason = 'Clan voll';
                    else if (!meetsLevel) missingReason = `Benötigt Level ${reqLevel}`;
                    else if (!meetsScore)
                      missingReason = `Benötigt ${reqScore.toLocaleString('de-DE')} Pkt.`;
                    else if (!meetsWave) missingReason = `Benötigt Welle ${reqWave}`;

                    return (
                      <div
                        key={c.id || c.tag}
                        className="p-5 sm:p-6 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-white/10 hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.45)] flex flex-col justify-between gap-5 transition-all duration-150"
                      >
                        <div className="space-y-4">
                          {/* Top Card Row: Emblem + Name + Join Type Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5">
                              <div
                                className={`w-13 h-13 rounded-2xl ${badgeMeta.bg} border ${badgeMeta.border} flex items-center justify-center ${badgeMeta.color} shrink-0 shadow-md p-3`}
                              >
                                {renderBadgeIcon(c.badge, 'w-6 h-6')}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-amber-500/20 border border-amber-400/40 text-amber-300">
                                    [{c.tag}]
                                  </span>
                                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                                    {c.name}
                                  </h3>
                                </div>
                                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                  {c.description || 'Einsatzkommando im Sektor 61267 Neu-Anspach.'}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border shrink-0 ${joinTypeMeta.style}`}
                            >
                              <JoinIcon className="w-3 h-3" />
                              <span>{joinTypeMeta.label}</span>
                            </span>
                          </div>

                          {/* Stats Pills */}
                          <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-950/85 border border-white/10 flex items-center gap-2">
                              <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                              <div className="truncate">
                                <div className="text-white font-black tabular-nums">
                                  {c.memberCount}/{c.maxMembers || 50}
                                </div>
                                <div className="text-[10px] text-slate-400">Mitglieder</div>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-950/85 border border-amber-500/25 flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                              <div className="truncate">
                                <div className="text-amber-300 font-black tabular-nums">
                                  {(c.warTrophies ?? 1000).toLocaleString('de-DE')}
                                </div>
                                <div className="text-[10px] text-slate-400">Kriegstrophäen</div>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-950/85 border border-emerald-500/25 flex items-center gap-2">
                              <Star className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="truncate">
                                <div className="text-emerald-300 font-black tabular-nums">
                                  {(c.totalScore || 0).toLocaleString('de-DE')}
                                </div>
                                <div className="text-[10px] text-slate-400">Kampfpunkte</div>
                              </div>
                            </div>
                          </div>

                          {/* Entry Requirements Row */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
                              Voraussetzungen:
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border ${
                                meetsLevel
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              Ab Level {reqLevel}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border ${
                                meetsScore
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              Min. {reqScore.toLocaleString('de-DE')} Pkt.
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border ${
                                meetsWave
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              Ab Welle {reqWave}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                          <span className="font-mono text-[11px] text-slate-400">
                            Rang #{c.rank} · Kriegsruhm: {(c.warFame ?? 0).toLocaleString('de-DE')}
                          </span>

                          {joinType === 'closed' ? (
                            <button
                              type="button"
                              disabled
                              className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-500 font-mono font-bold text-xs uppercase cursor-not-allowed flex items-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Geschlossen</span>
                            </button>
                          ) : !meetsAll ? (
                            <button
                              type="button"
                              disabled
                              className="px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300/80 font-mono font-bold text-xs uppercase cursor-not-allowed flex items-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>{missingReason}</span>
                            </button>
                          ) : joinType === 'open' ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                run(async () => {
                                  const res = await joinClanFromDirectory(c.tag, {
                                    operatorLevel,
                                    score: playerScore,
                                    highestWave,
                                  });
                                  if (res.clan?.tag) {
                                    onClanTagChange?.(res.clan.tag);
                                  }
                                  showToast(
                                    res.message || `Erfolgreich [${c.tag}] ${c.name} beigetreten!`
                                  );
                                })
                              }
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_16px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all duration-150 cursor-pointer"
                            >
                              Sofort beitreten
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                run(async () => {
                                  const res = await joinClanFromDirectory(c.tag, {
                                    operatorLevel,
                                    score: playerScore,
                                    highestWave,
                                  });
                                  showToast(
                                    res.message || `Beitrittsanfrage an [${c.tag}] gesendet!`
                                  );
                                })
                              }
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_16px_rgba(245,158,11,0.25)] active:scale-[0.98] transition-all duration-150 cursor-pointer"
                            >
                              Beitritt anfragen
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* VIEW 2: EIGENEN CLAN GRÜNDEN (REQUIRES LEVEL >= 3 & 1.000 NAT) */
            <div className="space-y-6">
              {/* Requirements Status Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-amber-500/35 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-5">
                <div className="space-y-1.5">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>KOMMANDO-LIZENZ & GRÜNDUNGSVORAUSSETZUNGEN</span>
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Eigenen Clan im Taunus gründen
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                    Um einen neuen Clan in der Taunus-Kriegsliga zu registrieren, benötigst du mindestens{' '}
                    <strong className="text-white">Operator-Level {createMinLevel}</strong> sowie die einmalige Gründungsgebühr von{' '}
                    <strong className="text-amber-300">{createCostNat.toLocaleString('de-DE')} NAT</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Requirement 1: Level >= 3 */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                      meetsCreateLevel
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                        Voraussetzung 1
                      </div>
                      <div className="font-black text-sm sm:text-base text-white">
                        Mindest-Level: Operator-Level {createMinLevel}
                      </div>
                      <div className="text-xs font-mono">
                        Dein Status: <span className="font-bold">Lv. {operatorLevel}</span>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        meetsCreateLevel
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-400/40'
                      }`}
                    >
                      {meetsCreateLevel ? (
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Requirement 2: 1.000 NAT */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                      canAffordCreate
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                        Voraussetzung 2
                      </div>
                      <div className="font-black text-sm sm:text-base text-white">
                        Gründungsgebühr: {createCostNat.toLocaleString('de-DE')} NAT
                      </div>
                      <div className="text-xs font-mono">
                        Dein Budget:{' '}
                        <span className="font-bold">{budget.toLocaleString('de-DE')} NAT</span>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        canAffordCreate
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-400/40'
                      }`}
                    >
                      {canAffordCreate ? (
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clan Creation Form */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                      Clan-Tag (2–6 Zeichen)
                    </label>
                    <input
                      value={newClan.tag}
                      onChange={(e) =>
                        setNewClan({
                          ...newClan,
                          tag: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                        })
                      }
                      maxLength={6}
                      placeholder="z.B. TAUNUS"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/85 px-4 py-3 font-mono font-bold uppercase text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors shadow-inner"
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
                      className="w-full rounded-xl border border-white/10 bg-slate-950/85 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors shadow-inner"
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
                      className="w-full rounded-xl border border-white/10 bg-slate-950/85 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                {/* Emblem Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold text-slate-300 uppercase block">
                    Clan-Wappen auswählen
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {BADGE_OPTIONS.map((b) => {
                      const selected = newClan.badge === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setNewClan({ ...newClan, badge: b.id })}
                          className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                            selected
                              ? `${b.bg} ${b.border} ${b.color} shadow-[0_0_16px_rgba(255,255,255,0.12)]`
                              : 'bg-slate-950/70 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          {renderBadgeIcon(b.id, 'w-6 h-6')}
                          <span className="font-mono text-[11px] font-bold">{b.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Entry Settings (Beitrittseinstellungen wie in Clash Royale) */}
                <div className="p-5 rounded-2xl bg-slate-950/75 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <span>Beitrittseinstellungen & Aufnahmeregeln</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-300 uppercase font-bold">
                        Beitrittsart
                      </label>
                      <select
                        value={newClan.joinType}
                        onChange={(e) =>
                          setNewClan({ ...newClan, joinType: e.target.value as ClanJoinType })
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="open">Offen (Jeder kann beitreten)</option>
                        <option value="invite_only">Auf Anfrage (Bestätigung nötig)</option>
                        <option value="closed">Geschlossen (Nur per Einladung)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-300 uppercase font-bold">
                        Mindest-Level
                      </label>
                      <select
                        value={newClan.minLevel}
                        onChange={(e) =>
                          setNewClan({ ...newClan, minLevel: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                      >
                        {[1, 3, 5, 10, 15, 20, 30].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Ab Operator-Level {lvl}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-300 uppercase font-bold">
                        Mindest-Kampfpunkte
                      </label>
                      <select
                        value={newClan.minScore}
                        onChange={(e) =>
                          setNewClan({ ...newClan, minScore: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                      >
                        {[0, 500, 1000, 2500, 5000, 10000].map((sc) => (
                          <option key={sc} value={sc}>
                            Min. {sc.toLocaleString('de-DE')} Kampfpunkte
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-300 uppercase font-bold">
                        Mindest-Welle
                      </label>
                      <select
                        value={newClan.minWave}
                        onChange={(e) =>
                          setNewClan({ ...newClan, minWave: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                      >
                        {[1, 3, 5, 10, 15, 20].map((wv) => (
                          <option key={wv} value={wv}>
                            Ab Verteidigungswelle {wv}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Live Preview & Submit Button */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/85 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-13 h-13 rounded-2xl ${getBadgeMeta(newClan.badge).bg} border ${
                        getBadgeMeta(newClan.badge).border
                      } flex items-center justify-center ${
                        getBadgeMeta(newClan.badge).color
                      } shrink-0 p-3`}
                    >
                      {renderBadgeIcon(newClan.badge, 'w-6 h-6')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-300">
                          [{newClan.tag || 'TAG'}]
                        </span>
                        <span className="font-bold text-white text-base">
                          {newClan.name || 'Dein Clanname'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-1">
                        {newClan.description || 'Kurzbeschreibung des Squads'} · Ab Lv.{' '}
                        {newClan.minLevel} · Min. {newClan.minScore.toLocaleString('de-DE')} Pkt.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busy || !canSubmitCreate}
                    onClick={() =>
                      run(async () => {
                        const res = await createClan({
                          ...newClan,
                          operatorLevel,
                          budget,
                        });
                        if (res.costDeducted) {
                          onSpendNAT?.(res.costDeducted);
                        } else {
                          onSpendNAT?.(createCostNat);
                        }
                        if (res.clan?.tag) {
                          onClanTagChange?.(res.clan.tag);
                        }
                        showToast(`Clan [${newClan.tag}] ${newClan.name} erfolgreich gegründet!`);
                      })
                    }
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Clan für {createCostNat.toLocaleString('de-DE')} NAT gründen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =====================================================================
            STATE B: PLAYER IS IN A CLAN (clan)
           ===================================================================== */
        <div className="space-y-6 sm:space-y-8">
          {/* Rich Clan Command Header */}
          <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-amber-950/35 backdrop-blur-xl border border-amber-500/35 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl ${getBadgeMeta(clan.badge).bg} border ${
                    getBadgeMeta(clan.badge).border
                  } flex items-center justify-center ${
                    getBadgeMeta(clan.badge).color
                  } shrink-0 shadow-lg p-3.5`}
                >
                  {renderBadgeIcon(clan.badge, 'w-8 h-8')}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="px-2.5 py-0.5 rounded-md font-black bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                      [{clan.tag}]
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md font-bold bg-slate-950/85 text-slate-200 border border-white/10">
                      RANG #{clan.rank}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold border ${
                        formatJoinTypeBadge(clan.joinType).style
                      }`}
                    >
                      {formatJoinTypeBadge(clan.joinType).label} · Ab Lv. {clan.minLevel ?? 1} ·
                      Min. {(clan.minScore ?? 0).toLocaleString('de-DE')} Pkt.
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {clan.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                    {clan.description || 'Gemeinsam für 61267 Neu-Anspach.'}
                  </p>
                </div>
              </div>

              {/* Leave Clan Button */}
              <div className="flex items-center gap-3 self-start lg:self-center">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await leaveClan();
                      onClanTagChange?.('');
                      showToast('Du hast den Clan verlassen.');
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-950/60 border border-red-500/35 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Clan verlassen</span>
                </button>
              </div>
            </div>

            {/* 4 Primary Clan KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 border border-amber-500/35 flex items-center gap-3">
                <Trophy className="h-6 w-6 text-amber-400 shrink-0" />
                <div>
                  <div className="text-lg sm:text-xl font-black text-amber-300 tabular-nums">
                    {(clan.warTrophies ?? 1000).toLocaleString('de-DE')}
                  </div>
                  <div className="text-[10px] text-amber-300/80 uppercase font-semibold">
                    Kriegstrophäen
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 border border-rose-500/35 flex items-center gap-3">
                <Swords className="h-6 w-6 text-rose-400 shrink-0" />
                <div>
                  <div className="text-lg sm:text-xl font-black text-rose-300 tabular-nums">
                    {(clan.warFame ?? 0).toLocaleString('de-DE')} /{' '}
                    {(clan.warTargetFame ?? 3000).toLocaleString('de-DE')}
                  </div>
                  <div className="text-[10px] text-rose-300/80 uppercase font-semibold">
                    Kriegsruhm (Etappe {currentRiverStage}/5)
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 border border-cyan-500/35 flex items-center gap-3">
                <Users className="h-6 w-6 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-lg sm:text-xl font-black text-white tabular-nums">
                    {clan.memberCount}/{clan.maxMembers ?? 50}
                  </div>
                  <div className="text-[10px] text-cyan-300/80 uppercase font-semibold">
                    Mitglieder
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 border border-emerald-500/35 flex items-center gap-3">
                <Star className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-lg sm:text-xl font-black text-emerald-300 tabular-nums">
                    {(clan.totalScore || 0).toLocaleString('de-DE')}
                  </div>
                  <div className="text-[10px] text-emerald-300/80 uppercase font-semibold">
                    Gesamt-Kampfpunkte
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Tab Clan Sub-Navigation */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => setClanSubTab('war')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                clanSubTab === 'war'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-950/60 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Clankrieg</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                  clanSubTab === 'war'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {clan.warDecksRemainingToday ?? 4}/4
              </span>
            </button>

            <button
              type="button"
              onClick={() => setClanSubTab('quests')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                clanSubTab === 'quests'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-950/60 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Clanaufgaben</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                  clanSubTab === 'quests'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {(clan.quests || []).length || 5}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setClanSubTab('members')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                clanSubTab === 'members'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-950/60 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Mitglieder & Anfragen</span>
              {(clan.joinRequests?.length || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500 text-white">
                  {clan.joinRequests?.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setClanSubTab('settings_chat')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                clanSubTab === 'settings_chat'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-400 text-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-950/60 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Einstellungen & Funk</span>
            </button>
          </div>

          {/* =================================================================
              SUB-TAB 1: SCHWIERIGE CLANKRIEGE (WAR)
             ================================================================= */}
          {clanSubTab === 'war' && (
            <div className="space-y-6">
              {/* Taunus-Sektorenkrieg (5 Etappen Flussrennen) */}
              <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-amber-500/35 shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>TAUNUS-SEKTORENKRIEG · 5-ETAPPEN-FLUSSRENNEN</span>
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Operation Feldberg-Sturm
                    </h3>
                  </div>

                  <div className="px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-amber-500/40 font-mono text-xs flex items-center gap-2.5">
                    <Swords className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-200 font-bold">
                      {clan.warDecksRemainingToday ?? 4} / {clan.warDecksMaxPerDay ?? 4}{' '}
                      Kriegsangriffe heute verfügbar
                    </span>
                  </div>
                </div>

                {/* Overall Fame Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-300 font-bold">
                      Aktueller Etappen-Fortschritt: Etappe {currentRiverStage} von 5
                    </span>
                    <span className="text-amber-300 font-black tabular-nums">
                      {(clan.warFame ?? 0).toLocaleString('de-DE')} /{' '}
                      {(clan.warTargetFame ?? 3000).toLocaleString('de-DE')} Kriegsruhm
                    </span>
                  </div>
                  <div className="w-full h-4 rounded-full bg-slate-950 border border-white/10 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500 transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((clan.warFame ?? 0) / (clan.warTargetFame ?? 3000)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 5 Stage Checkpoints */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                  {WAR_STAGES.map((st) => {
                    const currentFame = clan.warFame ?? 0;
                    const completed = currentFame >= st.targetFame;
                    const active = currentRiverStage === st.stage;
                    return (
                      <div
                        key={st.stage}
                        className={`p-3.5 rounded-2xl border font-mono text-xs transition-all ${
                          completed
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                            : active
                            ? 'bg-amber-950/40 border-amber-400/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-slate-950/70 border-white/10 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase">
                            Etappe {st.stage}
                          </span>
                          {completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : active ? (
                            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                        <div className="font-sans font-bold text-white text-xs line-clamp-1">
                          {st.name.replace(/^Etappe \d:\s*/, '')}
                        </div>
                        <div className="text-[10px] opacity-80 mt-1">
                          Ziel: {st.targetFame.toLocaleString('de-DE')} Ruhm
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dramatic Combat Report Banner */}
              {combatReport && (
                <div
                  className={`p-5 sm:p-6 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-3 animate-in fade-in duration-200 ${
                    combatReport.victory
                      ? 'bg-emerald-950/50 border-emerald-400/50 text-emerald-100'
                      : 'bg-amber-950/50 border-amber-400/50 text-amber-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <Swords className="w-4 h-4" />
                        <span>
                          GEFECHTSBERICHT · {combatReport.modeTitle} ·{' '}
                          {combatReport.victory ? 'SIEG!' : 'HARTER WIDERSTAND (TEILERFOLG)'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {combatReport.summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCombatReport(null)}
                      className="p-1.5 rounded-lg bg-slate-950/50 text-slate-300 hover:text-white"
                      aria-label="Gefechtsbericht schließen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs pt-1">
                    <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-black">
                      +{combatReport.fameEarned} Kriegsruhm
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-black">
                      +{combatReport.rewardNAT} NAT
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-black">
                      +{combatReport.rewardReputation} Ruf
                    </span>
                    {combatReport.rewardSkillPoints > 0 && (
                      <span className="px-3 py-1 rounded-xl bg-purple-500/25 border border-purple-400/50 text-purple-200 font-black">
                        +{combatReport.rewardSkillPoints} Skillpunkt
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 3 High-Difficulty Clan War Battle Modes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {WAR_MODES.map((m) => {
                  const decksLeft = clan.warDecksRemainingToday ?? 4;
                  const levelWarning = operatorLevel < m.recLevel;
                  return (
                    <div
                      key={m.id}
                      className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-br ${m.accentBg} backdrop-blur-xl border ${m.accentBorder} shadow-[0_8px_32px_rgba(0,0,0,0.45)] flex flex-col justify-between gap-5 transition-all duration-150`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-black uppercase border ${m.badgeStyle}`}
                          >
                            {m.difficulty} · Empf. Lv. {m.recLevel}+
                          </span>
                          <span className="font-mono text-[11px] font-bold text-amber-300">
                            1 Kriegsdeck
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-lg font-black text-white tracking-tight">
                            {m.title}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 font-mono text-xs">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            Belohnung bei Sieg:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold">
                              {m.fameRange}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 font-bold">
                              {m.rewardNatText}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-bold">
                              {m.rewardRepText}
                            </span>
                            {m.rewardSpText && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/40 font-bold">
                                {m.rewardSpText}
                              </span>
                            )}
                          </div>
                        </div>

                        {levelWarning && (
                          <div className="text-[11px] font-mono text-amber-300/90 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                            <span>
                              Dein Level (Lv. {operatorLevel}) liegt unter der Empfehlung (Lv.{' '}
                              {m.recLevel}+) — reduzierte Siegchance!
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={busy || decksLeft <= 0}
                        onClick={() =>
                          run(async () => {
                            const res = await startClanWarBattle(m.id, { operatorLevel });
                            setCombatReport({
                              victory: Boolean(res.victory),
                              modeTitle: m.title,
                              fameEarned: res.fameEarned ?? 150,
                              rewardNAT: res.rewardNAT ?? 250,
                              rewardReputation: res.rewardReputation ?? 60,
                              rewardSkillPoints: res.rewardSkillPoints ?? 0,
                              summary:
                                res.combatReport ||
                                `Kriegseinsatz "${m.title}" abgeschlossen! +${
                                  res.fameEarned ?? 150
                                } Kriegsruhm für [${clan.tag}].`,
                            });
                            onEarnRewards?.({
                              nat: res.rewardNAT,
                              reputation: res.rewardReputation,
                              skillPoints: res.rewardSkillPoints,
                            });
                          })
                        }
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_16px_rgba(245,158,11,0.25)] active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Swords className="w-4 h-4" />
                        <span>
                          {decksLeft > 0
                            ? 'Kriegsangriff starten'
                            : 'Alle 4 Kriegsdecks heute verbraucht'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Clankrieg-Rangliste (Taunus War League) */}
              <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Taunus-Clankrieg-Rangliste ({warLeaderboard.length} Clans)</span>
                  </h3>
                  <span className="font-mono text-[10px] text-amber-300 uppercase font-bold">
                    SORTIERT NACH KRIEGSTROPHÄEN & RUHM
                  </span>
                </div>

                <div className="space-y-2.5">
                  {warLeaderboard.map((entry, idx) => {
                    const isOurClan = entry.tag === clan.tag;
                    const entryStage = getRiverStageNumber(entry.warFame ?? 0);
                    return (
                      <div
                        key={entry.tag}
                        className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                          isOurClan
                            ? 'bg-amber-500/15 border-amber-400/50 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
                            : 'bg-slate-950/80 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg font-mono text-xs font-black flex items-center justify-center ${
                              idx === 0
                                ? 'bg-amber-400 text-slate-950'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 font-bold text-sm text-white">
                              <span className="font-mono text-amber-300 font-black">
                                [{entry.tag}]
                              </span>
                              <span>{entry.name}</span>
                              {isOurClan && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                  Dein Clan
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              Etappe {entryStage}/5 · {entry.memberCount} Mitglieder
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 font-mono text-xs">
                          <div className="text-right">
                            <div className="text-rose-300 font-black tabular-nums">
                              {(entry.warFame ?? 0).toLocaleString('de-DE')} Ruhm
                            </div>
                            <div className="text-[10px] text-slate-400">Flussrennen</div>
                          </div>
                          <div className="text-right">
                            <div className="text-amber-300 font-black tabular-nums">
                              🏆 {(entry.warTrophies ?? 1000).toLocaleString('de-DE')}
                            </div>
                            <div className="text-[10px] text-slate-400">Trophäen</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SUB-TAB 2: SCHWIERIGE CLANAUFGABEN (QUESTS)
             ================================================================= */}
          {clanSubTab === 'quests' && (
            <div className="space-y-6">
              <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-emerald-500/35 shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-2">
                <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>KOOPERATIVE CLANAUFGABEN · SCHWIERIGE HERAUSFORDERUNGEN</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Gemeinsame Squad-Direktiven im Sektor Neu-Anspach
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Jedes Clanmitglied trägt zum Fortschritt dieser 5 Hochrisiko-Aufgaben bei. Sobald ein Meilenstein zu 100% erfüllt ist, kann jedes Mitglied die Belohnung für seinen Operator einfordern!
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {(clan.quests || []).map((q: ClanQuest) => {
                  const currentProg = q.progress ?? 0;
                  const targetProg = Math.max(1, q.target ?? 1);
                  const pct = Math.min(100, Math.round((currentProg / targetProg) * 100));
                  const isCompleted = Boolean(q.completed || currentProg >= targetProg);
                  const diffMeta = formatQuestDifficulty(q.difficulty);
                  const isFundingQuest = q.category === 'funding';

                  return (
                    <div
                      key={q.id}
                      className={`p-5 sm:p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.45)] flex flex-col justify-between gap-5 transition-all ${
                        isCompleted
                          ? 'border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.15)]'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md font-mono text-[10px] font-black uppercase border ${diffMeta.style}`}
                            >
                              {diffMeta.label}
                            </span>
                            <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                              {q.title}
                            </h4>
                          </div>

                          <span className="font-mono text-xs font-black text-emerald-300 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10 tabular-nums shrink-0">
                            {pct}%
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{q.description}</p>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="text-slate-400">Clan-Fortschritt</span>
                            <span className="text-white font-bold tabular-nums">
                              {currentProg.toLocaleString('de-DE')} /{' '}
                              {targetProg.toLocaleString('de-DE')}
                            </span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-950 border border-white/10 overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                                  : 'bg-gradient-to-r from-cyan-500 to-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Reward Badges */}
                        <div className="flex flex-wrap items-center gap-2 font-mono text-xs pt-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">
                            Belohnung:
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 font-bold">
                            +{q.rewardNAT.toLocaleString('de-DE')} NAT
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-bold">
                            +{q.rewardReputation} Ruf
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold">
                            +{q.rewardWarFame} Kriegsruhm
                          </span>
                          {q.rewardSkillPoints > 0 && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/40 font-bold">
                              +{q.rewardSkillPoints} SP
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quest Action Button */}
                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-end gap-3">
                        {isCompleted ? (
                          q.claimedByMe ? (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Belohnung bereits eingefordert</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                run(async () => {
                                  const res = await claimClanQuestReward(q.id);
                                  onEarnRewards?.({
                                    nat: res.rewardNAT ?? q.rewardNAT,
                                    reputation: res.rewardReputation ?? q.rewardReputation,
                                    skillPoints: res.rewardSkillPoints ?? q.rewardSkillPoints,
                                  });
                                  showToast(
                                    `Clan-Belohnung für "${q.title}" eingefordert (+${
                                      res.rewardNAT ?? q.rewardNAT
                                    } NAT)!`
                                  );
                                })
                              }
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                            >
                              <Gift className="w-4 h-4" />
                              <span>Clan-Belohnung einfordern!</span>
                            </button>
                          )
                        ) : isFundingQuest ? (
                          <button
                            type="button"
                            disabled={busy || budget < 500}
                            onClick={() =>
                              run(async () => {
                                const res = await contributeClanQuest(q.id, 500);
                                onSpendNAT?.(res.costNAT ?? 500);
                                showToast('500 NAT in die Clan-Kriegskasse gespendet!');
                              })
                            }
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Coins className="w-4 h-4" />
                            <span>500 NAT in Kriegskasse spenden</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                try {
                                  const res = await contributeClanQuest(q.id);
                                  if (res.costNAT && res.costNAT > 0) {
                                    onSpendNAT?.(res.costNAT);
                                  }
                                  showToast(`Taktischer Beitrag zu "${q.title}" geleistet!`);
                                } catch (err) {
                                  const msg =
                                    err instanceof Error
                                      ? err.message
                                      : 'Taktischer Beitrag fehlgeschlagen.';
                                  showToast(msg);
                                  throw err;
                                }
                              })
                            }
                            className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-mono font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span>Taktischer Einsatz-Beitrag (80 NAT · Max. 2x/Tag)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              SUB-TAB 3: MITGLIEDER & ANFRAGEN (MEMBERS)
             ================================================================= */}
          {clanSubTab === 'members' && (
            <div className="space-y-6">
              {/* Pending Join Requests (for Leader / Co-Leader) */}
              {(clan.joinRequests?.length || 0) > 0 && (
                <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-amber-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-4">
                  <h3 className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Offene Beitrittsanfragen ({clan.joinRequests?.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {clan.joinRequests?.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl bg-slate-950/85 border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{req.username}</span>
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                              Lv. {req.operatorLevel}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            {req.score.toLocaleString('de-DE')} Pkt. · Welle {req.highestWave}
                          </div>
                        </div>

                        {canManageClan && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                run(async () => {
                                  await respondToJoinRequest(req.id, true);
                                  showToast(`${req.username} wurde in den Clan aufgenommen!`);
                                })
                              }
                              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer active:scale-[0.98]"
                              title="Anfrage annehmen"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                run(async () => {
                                  await respondToJoinRequest(req.id, false);
                                  showToast(`Anfrage von ${req.username} abgelehnt.`);
                                })
                              }
                              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer active:scale-[0.98]"
                              title="Anfrage ablehnen"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Roster & Direct Invite */}
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                {/* Member List */}
                <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase tracking-wider">
                      <Users className="h-4 w-4 text-cyan-400" />
                      <span>Squad-Mitglieder ({clan.members.length}/{clan.maxMembers ?? 50})</span>
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-300 font-bold">
                      [{clan.tag}] ROSTER
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {clan.members.map((member) => {
                      const roleMeta = formatRoleLabel(member.role);
                      const isMe = member.username.toLowerCase() === playerName.toLowerCase();
                      return (
                        <div
                          key={member.accountId}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950/85 border border-white/10 p-3.5 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                member.isOnline
                                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                                  : 'bg-slate-600'
                              }`}
                              title={member.isOnline ? 'Online' : 'Offline'}
                            />
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${roleMeta.style}`}
                            >
                              {roleMeta.label}
                            </span>
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {member.username}
                            </span>
                            {isMe && (
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                (Du)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right font-mono text-xs">
                              <div className="text-amber-300 font-bold tabular-nums">
                                {member.score.toLocaleString('de-DE')} Pkt
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {member.wins} Siege · {member.kills} Kills
                              </div>
                            </div>

                            {isLeader && !isMe && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    run(async () => {
                                      const nextRole: ClanMemberRole =
                                        member.role === 'member'
                                          ? 'elder'
                                          : member.role === 'elder'
                                          ? 'co_leader'
                                          : 'member';
                                      await updateClanMemberRole(member.accountId, nextRole);
                                      showToast(
                                        `Rolle von ${member.username} aktualisiert!`
                                      );
                                    })
                                  }
                                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs cursor-pointer"
                                  title="Befördern / Rolle wechseln"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    run(async () => {
                                      await kickClanMember(member.accountId);
                                      showToast(`${member.username} aus dem Clan entfernt.`);
                                    })
                                  }
                                  className="p-2 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs cursor-pointer"
                                  title="Mitglied entfernen"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Invite Operator Box & Open Invitations */}
                <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-cyan-400" />
                      <span>Operator direkt einladen</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Lade andere Spieler per Benutzername direkt in <strong className="text-white">[{clan.tag}] {clan.name}</strong> ein.
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="Benutzername eingeben …"
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/85 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        disabled={busy || !inviteName.trim()}
                        onClick={() =>
                          run(async () => {
                            await inviteToClan(inviteName.trim());
                            showToast(`Einladung an ${inviteName.trim()} gesendet!`);
                            setInviteName('');
                          })
                        }
                        className="rounded-xl bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-50 text-slate-950 px-4 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Einladen</span>
                      </button>
                    </div>
                  </div>

                  {/* Toggle Clan Directory Preview */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowDirectoryInMemberTab((prev) => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono font-bold text-cyan-300 hover:text-white cursor-pointer"
                    >
                      <span>Alle Clans in der Clan-Börse ansehen ({directory.length})</span>
                      {showDirectoryInMemberTab ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showDirectoryInMemberTab && (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {directory.map((d) => (
                          <div
                            key={d.tag}
                            className="p-2.5 rounded-xl bg-slate-950/90 border border-white/5 flex items-center justify-between text-xs font-mono"
                          >
                            <span className="text-white font-bold">
                              <span className="text-amber-300">[{d.tag}]</span> {d.name}
                            </span>
                            <span className="text-slate-400">
                              🏆 {(d.warTrophies ?? 1000).toLocaleString('de-DE')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SUB-TAB 4: EINSTELLUNGEN & FUNK (SETTINGS_CHAT)
             ================================================================= */}
          {clanSubTab === 'settings_chat' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column: Verschlüsselter Clan-Funk (Live-Chat) */}
              <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase tracking-wider">
                      <MessageCircle className="h-4 w-4 text-amber-400" />
                      <span>Verschlüsselter Clan-Funk (Live-Chat)</span>
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                      KANAL: [{clan.tag}]
                    </span>
                  </div>

                  {/* Chat Log Console */}
                  <div className="h-72 sm:h-80 space-y-2.5 overflow-y-auto rounded-2xl bg-slate-950/85 border border-white/10 p-4 font-sans shadow-inner">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400 font-mono space-y-2">
                        <Terminal className="w-6 h-6 text-slate-600" />
                        <p>
                          Noch keine Funksprüche vorhanden. Schreibe die erste taktische Meldung an deinen Squad!
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMe =
                          message.authorName.toLowerCase() === playerName.toLowerCase();
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
                              <span
                                className={
                                  isMe ? 'text-amber-300 font-bold' : 'text-cyan-300 font-bold'
                                }
                              >
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
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/85 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={busy || !messageText.trim()}
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] disabled:opacity-50 text-slate-950 px-5 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                      aria-label="Funkspruch absenden"
                    >
                      <Send className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Clan-Einstellungen (wie in Clash Royale) */}
              <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase tracking-wider">
                    <Settings className="h-4 w-4 text-cyan-400" />
                    <span>Clan-Einstellungen & Aufnahmeregeln</span>
                  </h3>
                  <span className="font-mono text-[10px] text-cyan-300 uppercase font-bold">
                    {canManageClan ? 'BEARBEITBAR' : 'NUR LESEN'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-300 uppercase font-bold">
                      Clan-Beschreibung / Motto
                    </label>
                    <input
                      value={settingsForm.description}
                      disabled={!canManageClan}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, description: e.target.value })
                      }
                      maxLength={160}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/85 px-4 py-2.5 text-xs text-white disabled:opacity-60"
                    />
                  </div>

                  {/* Badge Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-300 uppercase font-bold block">
                      Clan-Wappen
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {BADGE_OPTIONS.map((b) => {
                        const selected = settingsForm.badge === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            disabled={!canManageClan}
                            onClick={() => setSettingsForm({ ...settingsForm, badge: b.id })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed ${
                              selected
                                ? `${b.bg} ${b.border} ${b.color}`
                                : 'bg-slate-950/70 border-white/10 text-slate-400'
                            }`}
                          >
                            {renderBadgeIcon(b.id, 'w-5 h-5')}
                            <span className="font-mono text-[9px] font-bold">
                              {b.label.split('-')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-300 uppercase font-bold">
                        Beitrittsart
                      </label>
                      <select
                        value={settingsForm.joinType}
                        disabled={!canManageClan}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            joinType: e.target.value as ClanJoinType,
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        <option value="open">Offen</option>
                        <option value="invite_only">Auf Anfrage</option>
                        <option value="closed">Geschlossen</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-300 uppercase font-bold">
                        Mindest-Level
                      </label>
                      <select
                        value={settingsForm.minLevel}
                        disabled={!canManageClan}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            minLevel: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {[1, 3, 5, 10, 15, 20, 30].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Ab Level {lvl}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-300 uppercase font-bold">
                        Mindest-Kampfpunkte
                      </label>
                      <select
                        value={settingsForm.minScore}
                        disabled={!canManageClan}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            minScore: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {[0, 500, 1000, 2500, 5000, 10000].map((sc) => (
                          <option key={sc} value={sc}>
                            Min. {sc.toLocaleString('de-DE')} Pkt.
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-300 uppercase font-bold">
                        Mindest-Welle
                      </label>
                      <select
                        value={settingsForm.minWave}
                        disabled={!canManageClan}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            minWave: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {[1, 3, 5, 10, 15, 20].map((wv) => (
                          <option key={wv} value={wv}>
                            Ab Welle {wv}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {canManageClan && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await updateClanSettings(settingsForm);
                          showToast('Clan-Einstellungen erfolgreich gespeichert!');
                        })
                      }
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_16px_rgba(6,182,212,0.25)] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Clan-Einstellungen speichern
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
