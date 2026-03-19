# OHADA Draft

**Application de génération de documents juridiques OHADA**

Application desktop professionnelle permettant aux cabinets d'avocats et services juridiques de générer automatiquement des documents corporate conformes au droit OHADA, à partir de formulaires intelligents et de modèles Word dynamiques.

> ⚠️ **Avertissement** : Ce logiciel est un outil d'assistance à la rédaction. Tout document généré doit être relu et validé par un professionnel du droit avant utilisation.

---

## Fonctionnalités

### Gestion des dossiers
- Création et gestion de clients (personnes physiques et morales)
- Gestion de sociétés avec informations complètes (capital, siège, objet social...)
- Gestion des associés/actionnaires avec répartition du capital
- Gestion des dirigeants (gérants, DG, PCA, administrateurs)

### Génération de documents
- Assistant de génération par étapes (wizard)
- Modèles Word (.docx) avec variables dynamiques
- Listes dynamiques (associés, résolutions...)
- Clauses conditionnelles (société unipersonnelle, type d'apport...)
- Montants en chiffres et en lettres (français)
- Export .docx professionnel

### Modèles inclus (MVP SARL)
1. **Statuts SARL** — Statuts complets avec tous les articles essentiels
2. **PV de Constitution** — Procès-verbal de l'assemblée générale constitutive
3. **Déclaration de Souscription et de Versement** — Tableau de répartition du capital
4. **Acte de Nomination du Gérant** — Nomination avec acceptation de fonctions
5. **PV d'AGE (Modification Statutaire)** — Assemblée générale extraordinaire
6. **Acte de Cession de Parts Sociales** — Cession entre parties avec agrément

### Autres fonctionnalités
- Bibliothèque de modèles avec catégorisation
- Historique des documents générés
- Paramètres du cabinet (nom, adresse, pied de page)
- Calcul automatique du nombre de parts
- Avertissement juridique permanent

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework desktop | Electron |
| Interface | React 18 + TypeScript |
| Build | Vite |
| CSS | Tailwind CSS |
| Base de données | SQLite (better-sqlite3) |
| Génération Word | docxtemplater + PizZip |
| Icônes | Lucide React |
| Packaging | electron-builder |

---

## Prérequis

- **Node.js** >= 18
- **npm** >= 9
- **Windows** (pour le packaging final), macOS ou Linux pour le développement

---

## Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd DRAFT-OHADA

# Installer les dépendances
npm install

# Générer les templates Word
node scripts/generate-templates.js

# Lancer en mode développement
npm run electron:dev
```

---

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur Vite seul |
| `npm run electron:dev` | Lance l'application Electron en dev |
| `npm run build:vite` | Build le frontend |
| `npm run electron:build` | Build + package Windows (installateur NSIS) |
| `npm run electron:build:dir` | Build + package Windows (dossier) |
| `node scripts/generate-templates.js` | Régénère les templates Word |

---

## Build Windows

```bash
# Build complet avec installateur Windows
npm run electron:build

# Le fichier .exe sera généré dans le dossier release/
```

---

## Architecture du projet

```
DRAFT-OHADA/
├── electron/                  # Process principal Electron
│   ├── main.ts               # Point d'entrée Electron + IPC handlers
│   ├── preload.ts            # Bridge renderer ↔ main
│   ├── database.ts           # Service SQLite (schéma + CRUD)
│   ├── document-generator.ts # Moteur de génération docx
│   └── template-manager.ts   # Gestion des templates
│
├── src/                       # Interface React (renderer)
│   ├── main.tsx              # Point d'entrée React
│   ├── App.tsx               # Routes
│   ├── index.css             # Styles Tailwind + composants
│   ├── components/           # Composants réutilisables
│   │   ├── Layout.tsx        # Layout principal avec sidebar
│   │   ├── Sidebar.tsx       # Navigation latérale
│   │   ├── DisclaimerBanner.tsx
│   │   ├── Modal.tsx
│   │   ├── EmptyState.tsx
│   │   ├── StatCard.tsx
│   │   └── LoadingSpinner.tsx
│   ├── pages/                # Pages de l'application
│   │   ├── Dashboard.tsx     # Tableau de bord
│   │   ├── ClientsPage.tsx   # Gestion des clients
│   │   ├── CompanyPage.tsx   # Liste des sociétés
│   │   ├── CompanyDetailPage.tsx  # Détail société + associés + dirigeants
│   │   ├── GenerateDocumentPage.tsx  # Assistant de génération (wizard)
│   │   ├── TemplatesPage.tsx # Bibliothèque de modèles
│   │   ├── HistoryPage.tsx   # Historique des documents
│   │   └── SettingsPage.tsx  # Paramètres du cabinet
│   └── types/
│       └── electron.d.ts     # Types TypeScript pour l'API Electron
│
├── templates/                 # Templates Word (.docx) éditables
│   ├── statuts-sarl.docx
│   ├── pv-constitution-sarl.docx
│   ├── declaration-souscription.docx
│   ├── nomination-gerant.docx
│   ├── pv-age-modification.docx
│   └── cession-parts.docx
│
├── scripts/
│   └── generate-templates.js # Script de génération des templates
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Système de variables

Les templates utilisent la syntaxe **docxtemplater** :

| Variable | Description |
|----------|-------------|
| `{company_name}` | Dénomination sociale |
| `{legal_form}` | Forme juridique (SARL, SA...) |
| `{legal_form_full}` | Nom complet de la forme |
| `{capital_amount_formatted}` | Capital formaté (1 000 000) |
| `{capital_amount_words}` | Capital en lettres |
| `{share_value_formatted}` | Valeur nominale formatée |
| `{total_shares_formatted}` | Nombre de parts formaté |
| `{headquarters_address}` | Adresse du siège |
| `{headquarters_city}` | Ville du siège |
| `{business_object}` | Objet social |
| `{duration}` | Durée de la société |
| `{rccm}` | Numéro RCCM |
| `{current_date}` | Date du jour (format long) |
| `{current_year}` | Année en cours |

### Listes dynamiques

```
{#shareholders}
  {display_name} — {shares_count_formatted} parts
{/shareholders}

{#managers}
  {display_name} — {title}
{/managers}
```

### Variables calculées automatiquement

- `is_single_shareholder` / `is_multiple_shareholders`
- `shareholders_count` / `managers_count`
- `*_formatted` (formatage numérique avec espaces)
- `*_words` (conversion en toutes lettres français)
- `has_nature_contributions` / `has_only_numeraire`
- `first_manager` (premier gérant)

---

## Personnalisation des templates

Les templates .docx dans le dossier `templates/` sont **remplaçables sans recompilation**. Pour personnaliser un template :

1. Ouvrez le fichier .docx dans Microsoft Word
2. Modifiez la mise en page, les styles, le texte
3. Conservez les variables entre accolades `{variable}`
4. Sauvegardez le fichier au même emplacement

En production, les templates sont copiés dans le dossier `resources/` de l'application.

---

## Base de données

SQLite locale stockée dans le dossier utilisateur (`%APPDATA%/ohada-draft/`). Tables principales :

- `clients` — Clients du cabinet
- `companies` — Sociétés
- `shareholders` — Associés/actionnaires
- `managers` — Dirigeants
- `templates` — Catalogue de modèles
- `generated_documents` — Historique des générations
- `settings` — Paramètres du cabinet

---

## Roadmap

### v1.1
- [ ] Export PDF
- [ ] Impression directe
- [ ] Import/export JSON des dossiers
- [ ] Duplication de dossiers

### v1.2
- [ ] Pack complet de constitution (génération multiple)
- [ ] Éditeur visuel de templates
- [ ] Gestion des versions de modèles
- [ ] Moteur de snippets juridiques

### v1.3
- [ ] Support SA, SAS, SNC
- [ ] Commissaires aux comptes
- [ ] Registre des bénéficiaires effectifs
- [ ] Multi-juridiction (par pays OHADA)

### v2.0
- [ ] Multi-utilisateurs avec authentification
- [ ] Synchronisation cloud optionnelle
- [ ] Génération de rapports
- [ ] API REST pour intégrations

---

## Licence

MIT

---

*Développé pour les professionnels du droit en Afrique francophone.*
