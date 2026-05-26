# Sentiment Pulse v2.5

Dashboard d'analyse de sentiment client utilisant plusieurs modèles d'IA (Gemini, OpenAI, Anthropic via OpenRouter).

## Fonctionnalités

- **Analyse Multi-Modèles** : Choisissez entre Gemini (Google) ou une variété de modèles via OpenRouter.
- **Filtre Gratuit/Payant** : Basculez facilement entre les modèles gratuits et les modèles premium (GPT-4o, Claude 3.5 Sonnet).
- **Rapports Détaillés** : Score global, tendances, nuage de mots-clés et recommandations exploitables.
- **Interface Moderne** : Design bento, réactif et animé.

## Installation et Lancement local

**Prérequis :** Node.js (v18+)

1.  **Installer les dépendances :**
    ```bash
    npm install
    ```

2.  **Configurer les variables d'environnement :**
    Créez un fichier `.env` à la racine (ou utilisez `.env.local`) et ajoutez vos clés API :
    ```env
    GEMINI_API_KEY="votre_clé_gemini"
    OPENROUTER_API_KEY="votre_clé_openrouter"
    ```

3.  **Lancer l'application :**
    ```bash
    npm run dev
    ```
    L'application sera accessible sur `http://localhost:3000`.

## Utilisation

1. Sélectionnez un jeu de données prédéfini ou collez vos propres avis clients dans la zone de texte.
2. Choisissez le modèle d'IA souhaité. Utilisez le bouton **Free / All Models** pour filtrer par coût.
3. Cliquez sur **Generate AI Sentiment Report**.
4. Explorez les graphiques, le nuage de mots et les recommandations générées.

## Technologies

- **Frontend** : React 19, Tailwind CSS, Lucide React, Motion, Recharts.
- **Backend** : Express, OpenAI SDK, Google Generative AI SDK.
- **Outils** : Vite, TypeScript.
