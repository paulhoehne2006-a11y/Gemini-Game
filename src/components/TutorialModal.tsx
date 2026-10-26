import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Coins,
  Award,
  Zap,
  Crosshair,
  Wrench,
  GitBranch,
  Building2,
  Shield,
  Trophy,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  X,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Swords,
  Smartphone,
  Flame,
  Map,
  Users,
  Radio,
  Gift,
} from 'lucide-react';
import { AppTab } from './TopBar';
import { soundFx } from '../audio/soundFx';

export interface TutorialModalProps {
  isOpen: boolean;
  isMinimized?: boolean;
  playerName: string;
  rewardClaimed: boolean;
  onMinimizeToggle: (minimized: boolean) => void;
  onClose: () => void;
  onCompleteAndClaimReward: () => void;
  onNavigateTab?: (tab: AppTab) => void;
  onOpenProfileModal?: () => void;
}

interface BulletCard {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  description: string;
  highlightColor: string;
}

interface ChapterData {
  step: number;
  shortTitle: string;
  title: string;
  subtitle: string;
  accentColor: string;
  icon: React.ReactNode;
  cards: BulletCard[];
  proTip: string;
  actionButton?: {
    label: string;
    targetTab?: AppTab;
    openProfile?: boolean;
  };
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  isMinimized,
  playerName,
  rewardClaimed,
  onMinimizeToggle,
  onClose,
  onCompleteAndClaimReward,
  onNavigateTab,
  onOpenProfileModal,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [internalMinimized, setInternalMinimized] = useState<boolean>(false);

  useEffect(() => {
    if (isMinimized !== undefined) {
      setInternalMinimized(isMinimized);
    }
  }, [isMinimized]);

  if (!isOpen) return null;

  const effectiveMinimized = isMinimized !== undefined ? isMinimized : internalMinimized;

  const handleMinimize = (minimized: boolean) => {
    soundFx.playUiClick();
    setInternalMinimized(minimized);
    onMinimizeToggle(minimized);
  };

  const chapters: ChapterData[] = [
    {
      step: 1,
      shortTitle: 'Grundlagen',
      title: 'Willkommen in 61267 Neu-Anspach (Grundlagen & Währungen)',
      subtitle:
        'Das große Taunus-Derby: Verteidige 61267 Neu-Anspach gegen die Rivalen aus 61273 Wehrheim und baue dein Kommunal-Imperium auf.',
      accentColor: 'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/30',
      icon: <Coins className="w-6 h-6 text-amber-400" />,
      cards: [
        {
          icon: <Swords className="w-5 h-5 text-red-400" />,
          badge: 'TAUNUS-DERBY',
          title: '61267 Neu-Anspach vs. 61273 Wehrheim',
          description:
            'Sichere die Ortsteile Anspach, Hausen-Arnsbach, Westerfeld und Rod am Berg gegen feindliche Wellen aus Wehrheim (Obernhain, Pfaffenwiesbach & Friedrichsthal).',
          highlightColor: 'border-red-500/25 bg-red-950/20',
        },
        {
          icon: <Coins className="w-5 h-5 text-amber-400" />,
          badge: 'HAUPTWÄHRUNG',
          title: '💰 NAT (Neu-Anspacher Taler)',
          description:
            'Deine Hauptwährung für Waffen-Upgrades, Gebäude im Tycoon, Karten-Freischaltungen und die eigene Clan-Gründung (1.000 NAT).',
          highlightColor: 'border-amber-500/25 bg-amber-950/20',
        },
        {
          icon: <Award className="w-5 h-5 text-purple-400" />,
          badge: 'DIENSTGRAD & PASS',
          title: '⭐ Ruf (Reputation)',
          description:
            'Steigert deinen offiziellen Taunus-Dienstgrad (vom Feldberg-Rekruten bis zur Taunus-Legende) und schaltet Meilensteine im Season-Battle-Pass frei.',
          highlightColor: 'border-purple-500/25 bg-purple-950/20',
        },
        {
          icon: <Zap className="w-5 h-5 text-cyan-400" />,
          badge: 'FORTSCHRITT',
          title: '⚡ Skillpunkte (SP) & Operator-Level',
          description:
            'Verdienst du durch Siege, Level-Ups und Tagesbefehle für deinen Skilltree. Ab Operator-Level 3 kannst du außerdem eigene Clans gründen!',
          highlightColor: 'border-cyan-500/25 bg-cyan-950/20',
        },
      ],
      proTip:
        'Am Ende dieses kurzen Bootcamps (Kapitel 8) erhältst du sofort dein Starter-Paket mit +500 NAT, +150 Ruf und +1 Skillpunkt (SP) geschenkt!',
    },
    {
      step: 2,
      shortTitle: 'Gefecht & Steuerung',
      title: 'Gefechts-Einsatz & Steuerung (3D-Kampf & Taktische Streifen)',
      subtitle:
        'Egal ob am Desktop-PC im 3D-Shooter oder unterwegs auf dem Smartphone in der Taktik-Zentrale: Jeder Einsatz bringt volle Beute.',
      accentColor: 'from-red-500/20 via-amber-500/10 to-transparent border-red-500/30',
      icon: <Crosshair className="w-6 h-6 text-red-400" />,
      cards: [
        {
          icon: <Crosshair className="w-5 h-5 text-red-400" />,
          badge: 'PC 3D-EINSATZ',
          title: 'Taktische Ego- & Schulter-Steuerung',
          description:
            'WASD = Bewegung • Shift = Sprint • Leertaste = Sprung • Linksklick = Feuern • R = Nachladen • Tasten 1–3 = Waffenwechsel zwischen Primär-, Sekundär- und Spezialwaffe.',
          highlightColor: 'border-red-500/25 bg-red-950/20',
        },
        {
          icon: <Flame className="w-5 h-5 text-amber-400" />,
          badge: 'ROGUELITE-WELLEN',
          title: 'Wellen-Überleben & Taktische Perks',
          description:
            'Überlebe eskalierende Wehrheimer Angriffswellen. Nach jeder Welle wählst du mächtige Roguelite-Wellen-Perks (z. B. Explosive Bembel-Munition oder Kettenblitz).',
          highlightColor: 'border-amber-500/25 bg-amber-950/20',
        },
        {
          icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
          badge: 'MOBILE TAKTIK-ZENTRALE',
          title: 'Bürgerwehr-Streifen entsenden',
          description:
            'Im Mobile-Modus oder für schnelle Einsätze entsendest du Bürgerwehr-Streifen direkt auf der Einsatzkarte für sofortige NAT-Beute, Waffen-XP und Kampfpunkte.',
          highlightColor: 'border-emerald-500/25 bg-emerald-950/20',
        },
      ],
      proTip:
        'Achte im 3D-Einsatz auf Kopftreffer (Headshots) und Serien-Kills: Sie füllen deinen Kombo-Multiplikator und bescheren dir deutlich mehr NAT pro Gegner.',
      actionButton: {
        label: 'Einsatz-Zentrale ansehen',
        targetTab: 'battle',
      },
    },
    {
      step: 3,
      shortTitle: 'Waffenschmiede',
      title: 'Waffenschmiede & Pack-a-Punch (Arsenal V5)',
      subtitle:
        'Rüste deine Bewaffnung im 5-Slot Büchsenmacher auf und entfessle in der Pack-a-Punch Schmiede übernatürliche Feuerkraft.',
      accentColor: 'from-orange-500/20 via-amber-500/10 to-transparent border-orange-500/30',
      icon: <Wrench className="w-6 h-6 text-orange-400" />,
      cards: [
        {
          icon: <Wrench className="w-5 h-5 text-orange-400" />,
          badge: '5-SLOT BÜCHSENMACHER',
          title: 'Maßgeschneiderte Aufsätze für jede Waffe',
          description:
            'Modifiziere Visier, Lauf, Magazin, Schaft und Munition für dein XM4 Bembel-Sturmgewehr, die Taunus-Schrotflinte und das Feldberg-Scharfschützengewehr.',
          highlightColor: 'border-orange-500/25 bg-orange-950/20',
        },
        {
          icon: <Sparkles className="w-5 h-5 text-amber-400" />,
          badge: 'RARITÄT & CAMOS',
          title: 'Raritäts-Stufen (I–V) & Waffen-Level (1–30)',
          description:
            'Jeder Treffer steigert dein Waffen-Level bis Stufe 30. Erhöhe die Raritäts-Stufe von Gewöhnlich (I) bis Legendär (V) und schalte prestigeträchtige Meister-Tarnungen (Camos) frei.',
          highlightColor: 'border-amber-500/25 bg-amber-950/20',
        },
        {
          icon: <Flame className="w-5 h-5 text-fuchsia-400" />,
          badge: 'PACK-A-PUNCH I–III',
          title: 'Die Pack-a-Punch Schmiede',
          description:
            'Verstärke deine Waffen in drei Stufen (Stufe I–III) für massiven Schadens-Boost, vergrößerte Magazine und explosive Spezialeffekte gegen Boss-Wellen.',
          highlightColor: 'border-fuchsia-500/25 bg-fuchsia-950/20',
        },
      ],
      proTip:
        'Investiere deine ersten NAT in das Magazin und den Lauf deines XM4 Bembel-Sturmgewehrs – höhere Feuerrate und weniger Nachladepausen retten dir in Welle 5+ das Leben!',
      actionButton: {
        label: 'Zur Waffenschmiede',
        targetTab: 'gunsmith',
      },
    },
    {
      step: 4,
      shortTitle: 'Skilltree',
      title: 'Operator-Skilltree (12 Spezialisierungen)',
      subtitle:
        'Verteile deine verdienten Skillpunkte (SP) auf 3 taktische Talentbäume und forme deinen persönlichen Taunus-Operator.',
      accentColor: 'from-cyan-500/20 via-blue-500/10 to-transparent border-cyan-500/30',
      icon: <GitBranch className="w-6 h-6 text-cyan-400" />,
      cards: [
        {
          icon: <Swords className="w-5 h-5 text-red-400" />,
          badge: 'PFAD 1 • STURMTRUPP',
          title: '🔴 Angriff (Sturmtrupp)',
          description:
            'Erhöht deinen Grund-Waffenschaden, deine kritische Trefferchance sowie den Kopfschuss-Multiplikator für kompromisslose Offensive.',
          highlightColor: 'border-red-500/25 bg-red-950/20',
        },
        {
          icon: <Shield className="w-5 h-5 text-blue-400" />,
          badge: 'PFAD 2 • BOLLWERK',
          title: '🛡️ Verteidigung (Bollwerk)',
          description:
            'Verstärkt deine maximale Kevlar-Rüstung, beschleunigt die passive HP-Regeneration und senkt den erlittenen Schaden durch Wehrheimer Elite-Gegner.',
          highlightColor: 'border-blue-500/25 bg-blue-950/20',
        },
        {
          icon: <Coins className="w-5 h-5 text-amber-400" />,
          badge: 'PFAD 3 • LOGISTIK',
          title: '🟡 Taktik & Wirtschaft (Logistik)',
          description:
            'Steigert deine NAT-Beute pro Kill, beschleunigt den Waffen-XP-Gewinn und verkürzt deine Nachladegeschwindigkeit im Gefecht.',
          highlightColor: 'border-amber-500/25 bg-amber-950/20',
        },
      ],
      proTip:
        'Ein früher Punkt im gelben Logistik-Zweig („Steuer-Optimierung“) lohnt sich besonders, weil du dadurch bei jedem Einsatz dauerhaft mehr NAT-Beute kassierst.',
      actionButton: {
        label: 'Zum Skilltree',
        targetTab: 'skilltree',
      },
    },
    {
      step: 5,
      shortTitle: 'Maps & Tycoon',
      title: 'Maps & Kommunal-Tycoon (Passives Einkommen)',
      subtitle:
        'Baue die Infrastruktur von 61267 Neu-Anspach aus, kassiere jede Sekunde passives Einkommen und erobere 7 Einsatzgebiete.',
      accentColor: 'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/30',
      icon: <Building2 className="w-6 h-6 text-emerald-400" />,
      cards: [
        {
          icon: <Building2 className="w-5 h-5 text-emerald-400" />,
          badge: 'PASSIVES EINKOMMEN (+NAT/s)',
          title: 'Kommunal-Tycoon Infrastruktur',
          description:
            'Errichte und verbessere echte Neu-Anspacher Wahrzeichen wie die Apfelwein-Kelterei, das Waldschwimmbad und das Taunus-Breitband – sie generieren jede Sekunde automatisch Taler (+NAT/s)!',
          highlightColor: 'border-emerald-500/25 bg-emerald-950/20',
        },
        {
          icon: <Map className="w-5 h-5 text-amber-400" />,
          badge: '7 EINSATZGEBIETE',
          title: 'Vom Hessenpark bis zum Großen Feldberg',
          description:
            'Schalte nach und nach alle 7 historischen und taktischen Sektoren im Hochtaunus frei. Jedes Gebiet bietet eigene Gefahren und steigende Beute-Multiplikatoren.',
          highlightColor: 'border-amber-500/25 bg-amber-950/20',
        },
        {
          icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
          badge: 'KARTEN-LEVEL (LV. 1–10)',
          title: 'Gebiete aufwerten für maximale Ausbeute',
          description:
            'Investiere NAT in das Karten-Level (Stufe 1 bis 10): Höhere Karten-Level bringen stärkere Gegner, aber vervielfachen deine NAT- und Ruf-Belohnungen drastisch.',
          highlightColor: 'border-cyan-500/25 bg-cyan-950/20',
        },
      ],
      proTip:
        'Kaufe schon vor deinem ersten großen Gefecht die ersten Stufen im Kommunal-Tycoon – während du im Einsatz kämpfst, füllt sich deine Stadtkasse im Hintergrund weiter!',
      actionButton: {
        label: 'Maps & Tycoon ansehen',
        targetTab: 'tycoon',
      },
    },
    {
      step: 6,
      shortTitle: 'Clans & Kriege',
      title: 'Das neue Clash-Royale-Clansystem (Clan-Börse, Kriege & Aufgaben)',
      subtitle:
        'Verbünde dich mit anderen Taunus-Operatoren, kämpfe im 5-Etappen-Sektorenkrieg und sichere dir legendäre Kriegstruhen.',
      accentColor: 'from-purple-500/20 via-indigo-500/10 to-transparent border-purple-500/30',
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      cards: [
        {
          icon: <Users className="w-5 h-5 text-emerald-400" />,
          badge: 'AB LEVEL 1 KOSTENLOS',
          title: '🔍 Clan-Börse & Beitrittsanfragen',
          description:
            'Durchsuche alle aktiven Taunus-Clans in der Clan-Börse! Tritt ab Level 1 kostenlos einem offenen Clan (z. B. [HESSEN]) bei oder sende eine Beitrittsanfrage an Elite-Clans.',
          highlightColor: 'border-emerald-500/25 bg-emerald-950/20',
        },
        {
          icon: <Shield className="w-5 h-5 text-amber-400" />,
          badge: 'AB LEVEL 3 • 1.000 NAT',
          title: '🛡️ Eigenen Clan gründen & Regeln festlegen',
          description:
            'Ab Operator-Level 3 und für 1.000 NAT gründest du deinen eigenen Clan und bestimmst die Beitrittsregeln: Offen, Auf Anfrage, Geschlossen, Mindest-Level, Mindest-Punkte und Mindest-Welle.',
          highlightColor: 'border-amber-500/25 bg-amber-950/20',
        },
        {
          icon: <Swords className="w-5 h-5 text-purple-400" />,
          badge: '4/4 KRIEGSDECKS & 5 AUFGABEN',
          title: '⚔️ Schwierige Clankriege & 🎯 Clanaufgaben',
          description:
            'Nutze täglich deine 4/4 Kriegsdecks im anspruchsvollen 5-Etappen-Taunus-Sektorenkrieg gegen Wehrheimer Großkampfgruppen und löst gemeinsam 5 kooperative Clanaufgaben!',
          highlightColor: 'border-purple-500/25 bg-purple-950/20',
        },
      ],
      proTip:
        'Du bist noch Level 1? Tritt in der Clan-Börse sofort kostenlos einem offenen Clan bei, um direkt bei den Clanaufgaben und Kriegsdecks mitzukassieren!',
      actionButton: {
        label: 'Zur Clan-Börse',
        targetTab: 'clan',
      },
    },
    {
      step: 7,
      shortTitle: 'Missionen & Koop',
      title: 'Tagesbefehle, Koop-Lobby & Live-Leaderboard',
      subtitle:
        'Sichere dir tägliche Boni, spiele im 4-Spieler-Koop mit Freunden und klettere an die Spitze der 61267-Bestenliste.',
      accentColor: 'from-blue-500/20 via-cyan-500/10 to-transparent border-blue-500/30',
      icon: <Trophy className="w-6 h-6 text-blue-400" />,
      cards: [
        {
          icon: <Gift className="w-5 h-5 text-amber-400" />,
          badge: 'TÄGLICHE BELOHNUNGEN',
          title: 'Tägliche Einsatzbefehle & Großer Tagesbonus',
          description:
            'Schließe jeden Tag 3 rotierende Einsatzbefehle ab. Sobald alle 3 erfüllt sind, schaltest du den großen Tagesbonus mit extra NAT, Ruf und Skillpunkten frei!',
          highlightColor: 'border-amber-500/25 bg-amber-950/20',
        },
        {
          icon: <Radio className="w-5 h-5 text-cyan-400" />,
          badge: 'KOOP-MULTIPLAYER',
          title: 'Freunde-Lobby mit 6-stelligem Raumcode',
          description:
            'Erstelle im Koop-Tab eine Einsatz-Lobby oder gib den 6-stelligen Raumcode deiner Freunde ein, um gemeinsam Wellen zu verteidigen und Team-Buffs zu kombinieren.',
          highlightColor: 'border-cyan-500/25 bg-cyan-950/20',
        },
        {
          icon: <Trophy className="w-5 h-5 text-emerald-400" />,
          badge: 'HALL OF FAME',
          title: 'Echtzeit-Leaderboard & Kampfbericht',
          description:
            'Vergleiche deinen Punktestand, deine höchste überlebte Welle und dein Clan-Kürzel live mit den besten Verteidigern aus ganz Neu-Anspach.',
          highlightColor: 'border-emerald-500/25 bg-emerald-950/20',
        },
      ],
      proTip:
        'Ein Klick auf das „Missionen“-Abzeichen oben in der Kopfleiste öffnet jederzeit deine aktuellen Tagesbefehle.',
      actionButton: {
        label: 'Bestenliste ansehen',
        targetTab: 'leaderboard',
      },
    },
    {
      step: 8,
      shortTitle: 'Starter-Paket',
      title: 'Account-Verknüpfung & Dein Starter-Paket (+500 NAT, +150 Ruf, +1 SP)',
      subtitle: `Bereit für den Einsatz, Operator ${playerName || 'Rekrut'}! Sichere deinen Spielstand und fordere deine Bootcamp-Belohnung ein.`,
      accentColor: 'from-emerald-500/25 via-amber-500/15 to-transparent border-emerald-500/40',
      icon: <GraduationCap className="w-6 h-6 text-emerald-400" />,
      cards: [
        {
          icon: <UserCheck className="w-5 h-5 text-cyan-400" />,
          badge: 'PROFIL & CLOUD-SAVE',
          title: 'Benutzername & Alte Accounts verknüpfen',
          description:
            'Über das Profil-Menü oben in der Leiste kannst du jederzeit deinen Spielernamen anpassen oder einen bestehenden alten Passwort-Account nahtlos mit Google verknüpfen.',
          highlightColor: 'border-cyan-500/25 bg-cyan-950/20',
        },
        {
          icon: <GraduationCap className="w-5 h-5 text-amber-400" />,
          badge: 'JEDERZEIT ABRUFBAR',
          title: 'Bootcamp-Handbuch immer griffbereit',
          description:
            'Du kannst dieses Tutorial jederzeit wieder über das Startmenü oder dein Profil öffnen, falls du Details zu Waffen, Clans oder Tycoon-Gebäuden nachschlagen möchtest.',
          highlightColor: 'border-amber-500/25 bg-amber-950/20',
        },
      ],
      proTip:
        'Nutze deine +500 NAT und +1 SP aus dem Starter-Paket direkt für dein erstes Tycoon-Gebäude und deinen ersten Skilltree-Knoten!',
      actionButton: onOpenProfileModal
        ? {
            label: 'Profil & Account-Verknüpfung ansehen',
            openProfile: true,
          }
        : undefined,
    },
  ];

  const activeChapter = chapters[currentStep - 1] || chapters[0];

  const handleInspectInGame = () => {
    soundFx.playUiClick();
    if (activeChapter.actionButton?.openProfile && onOpenProfileModal) {
      handleMinimize(true);
      onOpenProfileModal();
      return;
    }
    if (activeChapter.actionButton?.targetTab && onNavigateTab) {
      onNavigateTab(activeChapter.actionButton.targetTab);
      handleMinimize(true);
    }
  };

  // Minimized floating pill so user can freely inspect the app and resume tutorial at any time
  if (effectiveMinimized) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 pointer-events-auto">
        <button
          type="button"
          data-testid="tutorial-minimized-pill"
          onClick={() => handleMinimize(false)}
          className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-amber-500/50 text-white shadow-[0_12px_35px_rgba(0,0,0,0.75),0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-400 hover:bg-slate-800/95 transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <GraduationCap className="w-4 h-4" />
          </span>
          <div className="text-left">
            <div className="text-xs font-black tracking-wide text-amber-300 uppercase">
              🎓 Tutorial fortsetzen (Schritt {currentStep}/8)
            </div>
            <div className="text-[11px] text-slate-300 truncate max-w-[210px]">
              {activeChapter.shortTitle} • Klicken zum Maximieren
            </div>
          </div>
          <Maximize2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-14 bottom-16 z-40 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-modal-title"
        data-testid="onboarding-tutorial-modal"
        className="pointer-events-auto w-full max-w-4xl max-h-full flex flex-col rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(245,158,11,0.12)] overflow-hidden text-slate-100"
      >
        {/* Top Header Bar */}
        <div
          className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-gradient-to-r ${activeChapter.accentColor} border-b border-white/10 shrink-0`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              {activeChapter.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black tracking-widest uppercase">
                  KAPITEL {currentStep} VON 8
                </span>
                <span className="text-[11px] font-semibold text-slate-400 truncate">
                  61267 Neu-Anspach • Interaktives Bootcamp
                </span>
              </div>
              <h2
                id="tutorial-modal-title"
                className="text-base sm:text-lg font-black tracking-tight text-white truncate mt-0.5"
              >
                {activeChapter.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="tutorial-minimize-btn"
              onClick={() => handleMinimize(true)}
              title="Tutorial minimieren & Spiel ansehen"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-xs font-bold text-slate-200 transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Minimieren</span>
            </button>
            <button
              type="button"
              data-testid="tutorial-close-btn"
              onClick={() => {
                soundFx.playUiClick();
                onClose();
              }}
              title="Tutorial überspringen / schließen"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-red-950/70 hover:border-red-500/40 border border-white/10 text-xs font-bold text-slate-300 hover:text-red-200 transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <span className="hidden md:inline">Später / Schließen</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Chapter Selector Pills */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-white/10 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 min-w-max">
            {chapters.map((ch) => {
              const isActive = ch.step === currentStep;
              const isCompleted = ch.step < currentStep;
              return (
                <button
                  key={ch.step}
                  type="button"
                  data-testid={`tutorial-chapter-tab-${ch.step}`}
                  onClick={() => {
                    soundFx.playUiClick();
                    setCurrentStep(ch.step);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : isCompleted
                        ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50'
                        : 'bg-slate-900/90 text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isActive
                        ? 'bg-slate-950 text-amber-400'
                        : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {ch.step}
                  </span>
                  <span>{ch.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Chapter Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Subtitle & Inspect Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/50 border border-white/10 rounded-xl p-3.5">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-[68ch]">
              {activeChapter.subtitle}
            </p>
            {activeChapter.actionButton && (
              <button
                type="button"
                data-testid={`tutorial-inspect-step-${currentStep}-btn`}
                onClick={handleInspectInGame}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide transition-all duration-150 active:scale-[0.98]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{activeChapter.actionButton.label}</span>
              </button>
            )}
          </div>

          {/* Explanation Bullet Cards */}
          <div
            className={`grid grid-cols-1 ${
              activeChapter.cards.length === 4 ? 'md:grid-cols-2' : 'md:grid-cols-3'
            } gap-3`}
          >
            {activeChapter.cards.map((card, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${card.highlightColor} flex flex-col justify-between gap-2.5 transition-all duration-150`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-950/80 border border-white/10 flex items-center justify-center shrink-0">
                      {card.icon}
                    </div>
                    {card.badge && (
                      <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-white/10 text-[10px] font-black tracking-wider text-slate-300 uppercase">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-white leading-snug">{card.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{card.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Special Starter Package Reward Box on Chapter 8 */}
          {currentStep === 8 && (
            <div
              data-testid="tutorial-starter-reward-box"
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900/90 to-amber-950/60 border border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.15)] space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Offizielles Neu-Anspach Starter-Paket
                  </span>
                </div>
                {rewardClaimed ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Bereits gutgeschrieben
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    Bereit zur Abholung!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-3">
                  <Coins className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-sm font-black text-amber-300">+500 NAT</div>
                    <div className="text-[11px] text-slate-400">Startkapital für Waffen & Tycoon</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 flex items-center gap-3">
                  <Award className="w-6 h-6 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-sm font-black text-purple-300">+150 Ruf-Punkte</div>
                    <div className="text-[11px] text-slate-400">Sofortiger Dienstgrad-Schub</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-sm font-black text-cyan-300">+1 Skillpunkt (SP)</div>
                    <div className="text-[11px] text-slate-400">Direkt im Skilltree einsetzbar</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Praxis-Tipp für Neu-Anspach Callout */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-xs leading-relaxed text-amber-100">
              <span className="font-black text-amber-300 uppercase tracking-wider block mb-0.5">
                Praxis-Tipp für Neu-Anspach
              </span>
              {activeChapter.proTip}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950/90 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <button
              type="button"
              data-testid="tutorial-prev-btn"
              disabled={currentStep <= 1}
              onClick={() => {
                soundFx.playUiClick();
                setCurrentStep((prev) => Math.max(1, prev - 1));
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 disabled:opacity-40 disabled:pointer-events-none border border-white/10 text-xs font-bold text-slate-200 transition-all duration-150 active:scale-[0.98]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Zurück</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                Schritt <strong className="text-white">{currentStep}</strong> von 8
              </span>
              <div className="hidden md:flex items-center gap-1 ml-1">
                {chapters.map((ch) => (
                  <button
                    key={ch.step}
                    type="button"
                    aria-label={`Zu Kapitel ${ch.step} wechseln`}
                    onClick={() => {
                      soundFx.playUiClick();
                      setCurrentStep(ch.step);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      ch.step === currentStep
                        ? 'w-5 bg-amber-400'
                        : ch.step < currentStep
                          ? 'w-2 bg-emerald-400/70'
                          : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end">
            {currentStep < 8 ? (
              <button
                type="button"
                data-testid="tutorial-next-btn"
                onClick={() => {
                  soundFx.playUiClick();
                  setCurrentStep((prev) => Math.min(8, prev + 1));
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-[0_8px_25px_rgba(245,158,11,0.35)] transition-all duration-150 active:scale-[0.98]"
              >
                <span>Weiter zu Kapitel {currentStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                data-testid="tutorial-claim-reward-btn"
                onClick={() => {
                  if (!rewardClaimed) {
                    soundFx.playLevelUp();
                    onCompleteAndClaimReward();
                  } else {
                    soundFx.playUiClick();
                    onClose();
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_10px_30px_rgba(16,185,129,0.4)] transition-all duration-150 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {!rewardClaimed
                    ? '🎓 Tutorial abschließen & Starter-Paket (+500 NAT, +150 Ruf, +1 SP) einfordern!'
                    : 'Tutorial beenden & Einsatz starten'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
