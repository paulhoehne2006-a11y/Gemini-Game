export interface Facility {
  id: string;
  name: string;
  location: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  incomePerSec: number;
  perkDescription: string;
  category: 'tourism' | 'tech' | 'energy' | 'agriculture' | 'transport' | 'leisure';
  icon: string;
}

export interface District {
  id: string;
  name: string;
  zipCode: string;
  unlocked: boolean;
  requiredWins: number;
  unlockCost: number;
  facilities: string[];
  description: string;
}

export const INITIAL_FACILITIES: Record<string, Facility> = {
  hessenpark: {
    id: 'hessenpark',
    name: 'Freilichtmuseum Hessenpark',
    location: 'Laubweg / Am Hessenpark',
    level: 1,
    maxLevel: 10,
    baseCost: 90,
    costMultiplier: 1.75,
    incomePerSec: 1,
    perkDescription: '+10% Arena-Siegprämie und Windmühlen-Deckung.',
    category: 'tourism',
    icon: 'Landmark',
  },
  breitband: {
    id: 'breitband',
    name: 'Breitband Taunus Netze',
    location: 'Gewerbegebiet Neu-Anspach',
    level: 0,
    maxLevel: 10,
    baseCost: 150,
    costMultiplier: 1.75,
    incomePerSec: 1,
    perkDescription: '+8% Bewegungs- und Sprint-Tempo im Battle Royale.',
    category: 'tech',
    icon: 'Wifi',
  },
  stadtwerke: {
    id: 'stadtwerke',
    name: 'Stadtwerke Neu-Anspach (Taunuskraft)',
    location: 'Bahnhofstraße',
    level: 0,
    maxLevel: 10,
    baseCost: 240,
    costMultiplier: 1.8,
    incomePerSec: 2,
    perkDescription: 'Schaltet Handkäs-Minen und -15% Waffen-Abklingzeit frei.',
    category: 'energy',
    icon: 'Zap',
  },
  kelterei: {
    id: 'kelterei',
    name: 'Traditions-Kelterei & Äppler-Mosterei',
    location: 'Streuobstwiesen Anspach',
    level: 0,
    maxLevel: 10,
    baseCost: 380,
    costMultiplier: 1.82,
    incomePerSec: 2,
    perkDescription: 'Schaltet Äppler-Spritzer frei; regeneriert stetig Lebenspunkte.',
    category: 'agriculture',
    icon: 'Beer',
  },
  taunusbahn: {
    id: 'taunusbahn',
    name: 'Bahnhof Neu-Anspach (Taunusbahn)',
    location: 'Am Bahnhof 1',
    level: 0,
    maxLevel: 10,
    baseCost: 560,
    costMultiplier: 1.85,
    incomePerSec: 3,
    perkDescription: '+40% mehr Munitions- und Vorratskisten in den Arenen.',
    category: 'transport',
    icon: 'TrainTrack',
  },
  waldschwimmbad: {
    id: 'waldschwimmbad',
    name: 'Waldschwimmbad Neu-Anspach',
    location: 'Am Waldrand',
    level: 0,
    maxLevel: 10,
    baseCost: 820,
    costMultiplier: 1.9,
    incomePerSec: 4,
    perkDescription: '+35 Max-HP & kühlender Wasserschild gegen Apfelgeschosse.',
    category: 'leisure',
    icon: 'Waves',
  },
};

export function getPassiveShiftVaultCap(facilities: Record<string, Facility>): number {
  const totalLevels = Object.values(facilities).reduce((sum, f) => sum + (f.level || 0), 0);
  return 120 + totalLevels * 28;
}

export const DISTRICTS: District[] = [
  {
    id: 'anspach',
    name: 'Anspach (Zentrum & Bürgerhaus)',
    zipCode: '61267',
    unlocked: true,
    requiredWins: 0,
    unlockCost: 0,
    facilities: ['hessenpark', 'breitband'],
    description: 'Das historische Herz von Neu-Anspach mit Rathaus, Marktplatz und regem Vereinsleben.',
  },
  {
    id: 'westerfeld',
    name: 'Westerfeld',
    zipCode: '61267',
    unlocked: false,
    requiredWins: 2,
    unlockCost: 500,
    facilities: ['stadtwerke', 'taunusbahn'],
    description: 'Wichtiger Verkehrsknotenpunkt mit Taunusbahn-Gleisanschluss und modernen Stadtwerken.',
  },
  {
    id: 'hausen',
    name: 'Hausen-Arnsbach',
    zipCode: '61267',
    unlocked: false,
    requiredWins: 4,
    unlockCost: 1000,
    facilities: ['kelterei'],
    description: 'Heimat der uralten Streuobstwiesen und regionalen Apfelwein-Tradition.',
  },
  {
    id: 'rod',
    name: 'Rod am Berg',
    zipCode: '61267',
    unlocked: false,
    requiredWins: 6,
    unlockCost: 2000,
    facilities: ['waldschwimmbad'],
    description: 'Höchster Ortsteil mit atemberaubendem Blick auf den Großen Feldberg und das Waldschwimmbad.',
  },
];
