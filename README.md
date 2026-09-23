# W-Rooster Kalender App (De Linge / PCG)

Een moderne, snelle en mobielvriendelijke webapplicatie in TypeScript om het waterpolo tafeldienst- en scheidsrechtersrooster van **De Linge / PCG** om te zetten in persoonlijke wedstrijddiensten en met één klik te downloaden als `.ics`-bestand voor je agenda (Apple Agenda, Google Calendar, Microsoft Outlook).

---

## 🌟 Functionaliteiten

- **👤 Snel zoeken & filteren:** Zoek direct op je naam of kies uit de alfabetische dropdown.
- **🤽 Slimme naamverwerking:** 
  - Samengestelde vermeldingen zoals `Kyra + Nicky` worden automatisch gesplitst zodat beide vrijwilligers hun dienst in de agenda zien.
  - Vergelijkbare namen zoals `Nick` en `Nicky` blijven strikt gescheiden individuen.
- **📅 1-Klik Kalender Export (.ics):** Download een RFC 5545-compliant agendabestand met:
  - Correcte tijden en tijdzone (`Europe/Amsterdam`).
  - Wedstrijdduur en eindtijd.
  - Rolomschrijving (Scheidsrechter, W-tafel, Toezichthouder, Reanimatie).
  - Exacte zwembadlocatie (`LOCATION` veld).
- **🏷️ Rolbadges & Statistieken:** Direct inzicht in het aantal toegewezen diensten per rol.
- **⚡ 100% Statisch & Razendsnel:** Geen database of server nodig; geoptimaliseerd voor hosting op GitHub Pages.

---

## 🛠️ Technologie & Structuur

- **TypeScript** voor type-safety in zowel scripts als frontend.
- **Vite** voor snelle builds en bundling naar statische HTML/CSS/JS.
- **pdf-parse** & **tsx** voor lokale PDF extractie naar `public/data/rooster.json`.

```
w-rooster/
├── files/
│   └── w-rooster.pdf          # Origineel PDF-rooster
├── public/
│   └── data/
│       └── rooster.json       # Gestructureerde data voor de webapp
├── scripts/
│   └── parse-pdf.ts           # PDF parser & transformatie script
├── src/
│   ├── ics-builder.ts         # RFC 5545 .ics kalender generator
│   ├── main.ts                # Frontend applicatielogica
│   ├── style.css              # Responsive styling & thema
│   └── types.ts               # Gedeelde TypeScript interfaces
├── index.html                 # Entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Aan de slag

### 1. Installatie

Installeer de project-dependencies:

```bash
npm install
```

### 2. PDF Rooster parsen

Zet `files/w-rooster.pdf` om naar `public/data/rooster.json`:

```bash
npm run parse
```

### 3. Lokale Development Server

Start de lokale Vite ontwikkelserver:

```bash
npm run dev
```

Open de getoonde URL (standaard `http://localhost:5173`) in je browser.

### 4. Productie Build

Bouw de statische productie-assets in de map `dist/`:

```bash
npm run build
```

Je kunt de productiebuild lokaal testen met:

```bash
npm run preview
```

---

## 🔄 Nieuw PDF Rooster updaten

Wanneer er een nieuw rooster beschikbaar is (bijvoorbeeld voor de 2e seizoenshelft):

1. Vervang het bestand `files/w-rooster.pdf` door het nieuwe PDF-bestand.
2. Voer het parse-script uit:
   ```bash
   npm run parse
   ```
3. Test de webapp lokaal met `npm run dev`.
4. Bouw de productiebundel en commit de wijzigingen:
   ```bash
   npm run build
   git add files/w-rooster.pdf public/data/rooster.json
   git commit -m "Update w-rooster data"
   git push
   ```

---

## 🌐 GitHub Pages Deployment

Deze repository is ingericht voor deployment op GitHub Pages via GitHub Actions of via de `dist` branch:

1. Ga in je GitHub repository naar **Settings** ➔ **Pages**.
2. Onder **Build and deployment**:
   - Kies bij **Source**: **GitHub Actions** (gebruik de standaard Static HTML/Vite workflow), of kies **Deploy from a branch** en selecteer de `gh-pages` branch.
3. Zodra de workflow draait, is de website direct bereikbaar onder `https://<gebruiker>.github.io/w-rooster/`.
