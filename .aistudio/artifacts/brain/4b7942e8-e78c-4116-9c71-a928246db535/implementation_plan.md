# Neu-Anspach 3D Battle Royale — Grafik-, Map- & Gameplay-Komplettüberarbeitung

Dieses Upgrade verwandelt das Spiel in einen atmosphärischen, grafisch realistischen 3D-Third-Person-Shooter mit sieben detailgetreuen Schauplätzen aus Neu-Anspach, begehbaren Gebäuden und Dächern, zerstörbaren Umgebungs-Objekten, Loot-Kisten mit Waffen-Aufsätzen sowie detaillierten 3D-Charakteren samt sichtbaren Waffenmodellen.

## User Review & Critical Decisions

> [!IMPORTANT]
> Alle gewünschten Schwerpunkte aus deiner Auswahl wurden direkt in die Architektur übernommen:
> - **Confirmed Decision 1 (7 Originale Neu-Anspach Maps)**: Die vier bestehenden Maps (*Freilichtmuseum Hessenpark*, *Waldschwimmbad*, *Bahnhof Taunusbahn*, *Bürgerhaus & Rathaus*) werden maßstabsgetreu ausgebaut und um **drei neue Wahrzeichen** ergänzt: **Taunus-Center (Einkaufszentrum & Parkdeck)**, **Adolf-Reichwein-Schule (Schulcampus & Sporthallen)** und **Feldbergblick (Taunuskamm mit Blick zum Großen Feldberg)**.
> - **Confirmed Decision 2 (Realistische 3D-Grafik & PBR-Texturen)**: Einsatz von physikalisch basiertem Rendering (PBR), prozeduralen hochauflösenden Oberflächentexturen (Kopfsteinpflaster, Fachwerk, Asphalt, Fliesen, Ziegel), `RoomEnvironment`-Lichtreflexionen, ACES Filmic Tone Mapping und weichen Echtzeit-Schatten.
> - **Confirmed Decision 3 (Taktisches Gameplay & 3D-Modelle)**: Begehbare Innenräume und über Rampen/Treppen erreichbare Dächer, realistische 3D-Autos als Deckung, zerstörbare Kisten/Fässer, Loot-Truhen mit 4 Waffen-Aufsätzen (Visier, Lauf, Verschluss, Magazin) sowie gegliederte 3D-Charaktere mit sichtbaren, wechselbaren 3D-Waffen in der Hand.

---

## 1. Overview & Core Concept

- **What It Does**: Ein fesselndes Wellen-Battle-Royale in einer authentischen 3D-Nachbildung von Neu-Anspach (61267). Spieler kämpfen in der Fortnite-Schulterperspektive auf sieben markanten Schauplätzen der Stadt, nutzen Autos, Häuser und Dächer als taktische Höhen- und Sichtdeckung, schießen Kisten für Waffen-Upgrades frei und verteidigen die Stadt gegen vorrückende Angriffswellen.
- **Target Audience / Persona**: Spieler, die schnelle, direkte Third-Person-Shooter-Action mit lokalem Wiedererkennungswert (Neu-Anspach / Hochtaunus) und spürbarer Progression suchen.
- **Key Value**: Echte räumliche Tiefe durch begehbare Gebäude und Höhenstufen (Dächer, Sprungturm, Parkdeck), realistisches Waffen-Feedback und hoher Wiederspielwert durch plünderbare Waffen-Aufsätze.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Map-Auswahl (7 Schauplätze aus Neu-Anspach)**:
   - Direkt über die Schnellauswahl-Leiste oder das Stadt-Menü wählt der Spieler zwischen allen 7 Neu-Anspacher Maps:
     1. *Freilichtmuseum Hessenpark*: Marktplatz, drehende Holländerwindmühle, begehbare Fachwerkscheunen, Dorfbrunnen und Biergarten-Bänke.
     2. *Waldschwimmbad Neu-Anspach*: 50m-Schwimmerbecken mit animierter Wasseroberfläche, begehbarer 3m/5m-Sprungturm, Umkleide-Trakt, Kiosk-Terrasse und Beachvolleyballfeld.
     3. *Bahnhof Neu-Anspach (Taunusbahn RB15)*: Detaillierter roter Lint-Triebwagen auf den Gleisen, Fußgängerüberweg, Bahnsteig mit Überdachung, P+R-Parkplatz mit 3D-Autos und Bahnhofsvorplatz.
     4. *Bürgerhaus & Rathausplatz*: Großes Bürgerhaus mit begehbarer Terrasse, Uhrturm, Wochenmarkt-Ständen (zerstörbar), Brunnen und geparkten Einsatzfahrzeugen.
     5. *Taunus-Center & Neue Mitte (NEU)*: Das bekannte Einkaufszentrum mit Ladenpassage, Glasvordächern, Lieferhof, Parkdeck-Auffahrt aufs obere Deck und zahlreichen geparkten PKWs.
     6. *Adolf-Reichwein-Schule / ARS (NEU)*: Großer Schulhof mit Pausenhalle, begehbarer Flachdach-Mensa, Sporthallen-Trakt, Buswendeschleife mit Schulbus und Tischtennisplatten als Deckung.
     7. *Feldbergblick & Taunuskamm (NEU)*: Höhenlage oberhalb von Anspach mit Blick auf die Silhouette des Großen Feldbergs samt Fernmeldeturm, Wanderparkplatz, Schutzhütte, Aussichtsturm und Felsformationen.
2. **Taktischer Häuser- & Dachkampf**:
   - Gebäude besitzen offene Türen und Fensterbögen. Über Außentreppen, Parkdeck-Rampen oder Gerüste gelangt der Spieler auf Flachdächer, den Sprungturm oder Aussichtstürme, um von oben mit Höhenvorteil zu feuern.
3. **Zerstörbare Objekte & Loot-Kisten mit Waffen-Aufsätzen**:
   - Überall auf der Map stehen zerstörbare Holzkisten, Äppler-Fässer und Barrikaden. Werden sie zerschossen, splittern sie mit Partikeleffekten auseinander und lassen Heilung, Munition oder **goldene Waffen-Aufsatz-Kisten** fallen.
   - Vier sammelbare Waffen-Aufsätze (im HUD live angezeigt):
     - **Taktisches Visier (Optik)**: Höherer Rechtsklick-Zoom & reduzierte Streuung.
     - **Schwerer Präzisionslauf (Barrel)**: +25 % Projektilschaden & +30 % Geschossgeschwindigkeit.
     - **Schnellfeuer-Bolzen (Trigger)**: +25 % Feuerrate bei Dauerfeuer.
     - **Trommelmagazin / Splitterkern (Mag)**: Zusätzliche Projektile & vergrößerter Explosionsradius.

### Visual Identity & Theme
- **Aesthetic Direction**: Realistische Outdoor-3D-Optik im Stil moderner taktischer Battle-Royale-Titel, kombiniert mit klarem, kontrastreichem Dark-Slategrey-HUD (`bg-slate-950/75 backdrop-blur-md border-white/10`).
- **Color Palette & Mood**:
  - *3D-Welt*: Natürliche Taunus-Farbgebung – Schiefergrau, warmes Eichen-Fachwerk (`#3B2314`), hessisches Ziegelrot (`#A83820`), dichtes Fichtengrün (`#1E3F20`), realistischer Asphalt (`#2B2D33`) und sonnendurchflutetes Tageslicht mit atmosphärischem Horizont-Dunst.
  - *HUD & UI*: 60 % transparenter Viewport, 30 % abgedunkelte HUD-Flächen (`#090D16`), 10 % scharfe Akzentfarben (Bernstein-Gold `#F59E0B` für Wellen & Aufsätze, Smaragd `#10B981` für HP, Cyan `#38BDF8` für Schild & Ausdauer).
- **Typography & Hierarchy**: Klare geometrische Sans-Schrift für schnelle Lesbarkeit im Gefecht, kombiniert mit tabellarischen Ziffern (`tabular-nums`) für HP, Munition, Wellen-Zähler, Distanz und Waffen-Upgrades.
- **Interactive Feedback & Motion**:
  - Sichtbares 3D-Waffenmodell an der rechten Schulter/Hand des Spielers mit Echtzeit-Rückstoß, Mündungsfeuer-Lichtblitz (`PointLight`-Flash) und Patronenhülsen-/Leuchtspur-Effekt.
  - Treffer-Funken an Autos/Steinen und Holzsplitter bei zerstörbaren Objekten.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Prozedurale High-DPI PBR-Texturen statt externer Bilddateien**
  - *Chosen Approach*: Alle Oberflächen- und Normal-Maps (Fachwerk, Kopfsteinpflaster, Asphalt-Markierungen, Ziegeldach, Schwimmbadfliesen, Autolack) werden beim Start per HTML5-Canvas erzeugt, mit `SRGBColorSpace` und maximaler Anisotropie versehen.
  - *Why*: Garantiert 0 Ladefehler (keine 404-Assets), sofortige Ladezeiten und gestochen scharfe Texturen auch aus flachen Kamerawinkeln.
- **Decision 2: Echte 3D-Höhenphysik (Y-Achse) für Dächer, Treppen und Sprungturm**
  - *Chosen Approach*: Erweiterung der Kollisions-Engine um begehbare Höhenplattformen (`WalkableSurface`: Min/Max X/Z + Zielhöhe Y sowie Rampen-Interpolation).
  - *Why*: Ermöglicht echtes Battle-Royale-Gefühl, bei dem man auf das Parkdeck des Taunus-Centers, das Mensa-Dach der ARS oder den 5m-Sprungturm im Waldschwimmbad klettern und von oben herabschießen kann.
- **Decision 3: Sichtbare, modulare 3D-Waffen- & Charakter-Hierarchie**
  - *Chosen Approach*: Jeder Charakter (Spieler, Verbündeter, Gegner) erhält bewegliche Gliedmaßen-Gruppen und einen `weaponMount`-Knoten an der rechten Hand, in dem das aktuell gewählte 3D-Waffenmodell (Sturmgewehr, SMG, Schrot-Spritzer, Granatwerfer) inkl. freigeschalteter Aufsätze gerendert wird.
  - *Why*: In der Fortnite-Schulterperspektive sieht der Spieler seine Waffe und die ausgerüsteten Aufsätze direkt am Charakter.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       React Application & HUD Layer                      │
│  ┌────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ TopBar & Map Bar   │  │ Battle HUD Overlay   │  │ Attachment &     │  │
│  │ (7 Anspach Arenas) │  │ (Wave, HP, Crosshair)│  │ Weapon Loadout   │  │
│  └─────────┬──────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└────────────┼────────────────────────┼───────────────────────┼────────────┘
             │                        │                       │
             ▼                        ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Three.js Realistic 3D Engine Core                     │
│                                                                          │
│  ┌──────────────────────────┐      ┌──────────────────────────────────┐  │
│  │ Procedural PBR Texture & │      │ 7 Neu-Anspach Arena Builders     │  │
│  │ Material Library         │─────▶│ • Hessenpark  • Waldschwimmbad   │  │
│  │ (Cobble, Asphalt, Timber,│      │ • Taunusbahn  • Bürgerhaus       │  │
│  │  Tiles, Car Metallic)    │      │ • Taunus-Center • ARS Schule     │  │
│  └──────────────────────────┘      │ • Feldbergblick                  │  │
│                                    └────────────────┬─────────────────┘  │
│                                                     │                    │
│  ┌──────────────────────────┐      ┌────────────────▼─────────────────┐  │
│  │ 3D Character & Weapon    │      │ 3D World Physics & Interactions  │  │
│  │ Rig Builder              │      │ • Walkable Roofs, Stairs & Ramps │  │
│  │ • Articulated Limbs      │      │ • Enterable Buildings & Windows  │  │
│  │ • 4 3D Gun Models + Mods │      │ • 3D Cars & Tactical Cover       │  │
│  │ • Muzzle Light & Recoil  │      │ • Destructible Crates & Loot     │  │
│  └──────────────────────────┘      └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **`ArenaBuildResult`**: Liefert neben `obstacles: THREE.Box3[]` nun auch `walkableSurfaces: WalkableSurface[]` (für Treppen, Rampen, Dächer, Sprungturm) sowie `destructibles: DestructibleProp[]` (Kisten, Fässer, Marktstände mit HP und Loot-Drop).
- **`WeaponAttachmentsState`**: Speichert die in der Runde gesammelten Waffen-Upgrades (`scopeLevel`, `barrelLevel`, `boltLevel`, `magLevel`), die Schaden, Feuerrate, Geschossgeschwindigkeit, Zoom-FOV und das 3D-Waffenmodell live verstärken.

### Interactive Component & State Mapping
- **Map-Wechsel (7 Arenen)**: Klick auf eine der 7 Neu-Anspacher Maps baut sofort die spezifische 3D-Topografie inkl. Wahrzeichen, begehbarer Gebäude, Autos und zerstörbarer Objekte auf.
- **Dach- & Gebäudebewegung**: Während `updatePlayer(delta)` prüft die Physik-Engine neben horizontalen Hindernissen auch `walkableSurfaces`, sodass der Spieler fließend Treppen/Rampen hinaufläuft und von Dächern springen kann.
- **Zerstörung & Loot-Pickup**: Treffen Projektile ein `DestructibleProp`, sinken dessen HP bis zur Splitter-Explosion; gespawnte Waffen-Aufsatz-Kisten rüsten beim Durchlaufen sofort das aktive Gewehr auf und aktualisieren die HUD-Anzeige.
