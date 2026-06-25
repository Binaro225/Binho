# FinMaster AI - Comptable Personnel Intelligent

![FinMaster AI Logo](public/favicon.svg)

**FinMaster AI** est une application web moderne de gestion financière personnelle et commerciale, dotée d'une intelligence artificielle intégrée qui agit comme un véritable comptable personnel.

## 🚀 Fonctionnalités

### 📊 Tableau de bord
- Vue d'ensemble complète de vos finances
- Solde total, revenus, dépenses, bénéfices
- Épargne et dettes actuelles
- Produits en stock et alertes
- Graphiques interactifs et tendances financières

### 💰 Gestion des revenus
- Ajout, modification et suppression de revenus
- Catégorisation (salaire, freelance, vente, cadeau, commission, autre)
- Historique complet avec filtrage

### 💸 Gestion des dépenses
- Ajout, modification et suppression de dépenses
- Catégorisation (nourriture, transport, internet, santé, éducation, loyer, divertissement, autre)
- Détection des dépenses anormales
- Analyse des habitudes de consommation

### 📦 Gestion commerciale
- **Produits** : Ajout, modification, suppression avec gestion de stock
- **Ventes** : Enregistrement des ventes avec plusieurs articles
- **Stock** : Alertes automatiques de stock faible
- **Calculs** : Bénéfice unitaire, marge, chiffre d'affaires

### 🎯 Gestion de l'épargne
- Création d'objectifs d'épargne
- Suivi de la progression
- Date cible et montant cible
- Ajout manuel ou automatique à l'épargne

### 💳 Gestion des dettes
- Dettes données et reçues
- Suivi des remboursements
- Historique des paiements
- Alertes de dettes à échéance

### 📄 Rapports
- Génération automatique de rapports
- Périodes : quotidien, hebdomadaire, mensuel, annuel
- Export en PDF, Excel, CSV
- Analyse financière complète

### 🤖 Intelligence Artificielle
- **Assistant IA** : Compréhension naturelle des requêtes
- **Actions automatiques** : Ajout de revenus, dépenses, produits, ventes, etc.
- **Analyse financière** : Détection des tendances et conseils personnalisés
- **Mémoire** : L'IA retient vos préférences et habitudes

### 🔔 Notifications
- Alertes de stock faible
- Rappels d'objectifs d'épargne
- Avis de dettes à rembourser
- Détection de dépenses anormales

### 📱 PWA (Progressive Web App)
- Installation sur mobile comme une application native
- Fonctionnement hors ligne
- Notifications push

## 🛠 Technologies utilisées

- **Frontend** : React 19 + TypeScript + Vite
- **UI** : Tailwind CSS + Lucide React (icônes)
- **Graphiques** : Recharts
- **Backend** : Supabase (PostgreSQL + Auth)
- **IA** : Mistral AI API
- **PWA** : Vite PWA Plugin
- **Gestion d'état** : React Context + Hooks personnalisés

## 📥 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase
- Clé API Mistral AI

### Étapes

1. **Cloner le dépôt**
```bash
git clone https://github.com/Binaro225/Binho.git
cd Binho
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
Créer un fichier `.env` à la racine avec les variables suivantes :
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MISTRAL_API_KEY=your-mistral-api-key
```

4. **Configurer Supabase**
- Créer un projet Supabase
- Configurer les tables de la base de données (voir [Schema SQL](#))
- Activer l'authentification par email/mot de passe

5. **Démarrer l'application**
```bash
npm run dev
```

L'application sera disponible à l'adresse `http://localhost:3000`

## 🗃 Structure de la base de données

### Tables principales
- `users` : Utilisateurs
- `incomes` : Revenus
- `expenses` : Dépenses
- `products` : Produits
- `sales` : Ventes
- `sale_items` : Articles vendus
- `savings_goals` : Objectifs d'épargne
- `debts` : Dettes
- `debt_payments` : Paiements de dettes
- `notifications` : Notifications
- `action_logs` : Journal des actions

## 🎨 Interface Utilisateur

### Pages
- `/` : Tableau de bord
- `/incomes` : Revenus
- `/expenses` : Dépenses
- `/products` : Produits
- `/sales` : Ventes
- `/savings` : Épargne
- `/debts` : Dettes
- `/reports` : Rapports
- `/ai-assistant` : Assistant IA
- `/notifications` : Notifications
- `/settings` : Paramètres

### Authentification
- `/login` : Connexion
- `/register` : Inscription
- `/forgot-password` : Mot de passe oublié
- `/reset-password` : Réinitialisation du mot de passe

## 🤖 Utilisation de l'IA

L'assistant IA comprend les commandes naturelles comme :

- "Ajoute une dépense de 5 000 FCFA pour internet"
- "J'ai vendu 3 chargeurs à 2 000 FCFA"
- "Combien ai-je gagné ce mois-ci ?"
- "Quels produits se vendent le mieux ?"
- "Combien me reste-t-il en stock ?"
- "Analyse mes finances"
- "Comment économiser davantage ?"

L'IA peut :
- Ajouter/modifier/supprimer des données
- Générer des rapports
- Fournir des analyses financières
- Donner des conseils personnalisés

**Important** : L'IA demande toujours confirmation avant d'exécuter une action.

## 📦 Déploiement

### Vercel (recommandé)
```bash
npm run build
vercel
```

### Autres plateformes
L'application peut être déployée sur n'importe quelle plateforme supportant les applications React (Netlify, GitHub Pages, etc.).

## 📄 Licence

MIT License

## 🙏 Contribution

Les contributions sont les bienvenues ! Veuillez ouvrir une issue ou soumettre une pull request.

## 📞 Contact

Pour toute question ou suggestion, n'hésitez pas à nous contacter.

---

**FinMaster AI** - Votre comptable personnel intelligent

© 2024 FinMaster AI. Tous droits réservés.
