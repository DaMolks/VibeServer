# VibeServer

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

VibeServer est un serveur de développement local conçu pour l'intégration avec Claude et d'autres modèles IA via le protocole MCP (Model Context Protocol). Il permet à Claude de manipuler des fichiers, gérer des projets et exécuter des commandes directement sur votre système local.

## 🌟 Fonctionnalités principales

- **Gestion de projets** : Créez et organisez votre code en projets distincts
- **Manipulation de fichiers** : Créez, lisez, modifiez et supprimez des fichiers
- **Commandes MCP** : Interface de commandes simple pour l'interaction avec Claude
- **Intégration Git** : Commit de vos modifications directement depuis Claude
- **Console temps réel** : Suivez l'activité et les logs du serveur

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/DaMolks/VibeServer.git
cd VibeServer

# Installer les dépendances
npm install

# Configurer les variables d'environnement (optionnel)
cp .env.example .env

# Lancer le serveur
npm start
```

## ⚡ Démarrage rapide

Une fois le serveur démarré, vous pouvez accéder à :
- **API REST** : http://localhost:3000/api
- **Console Web** : http://localhost:3000/console.html

Pour utiliser VibeServer avec Claude via VibePMCP, suivez les instructions dans la documentation de [VibePMCP](https://github.com/DaMolks/VibePMCP).

## 📋 Commandes MCP disponibles

VibeServer prend en charge les commandes MCP suivantes :

| Commande | Description | Exemple |
|----------|-------------|---------|
| `help` | Affiche l'aide sur les commandes disponibles | `help` |
| `create-project` | Crée un nouveau projet | `create-project mon-app "Description du projet"` |
| `list-projects` | Liste tous les projets disponibles | `list-projects` |
| `switch-project` | Change le projet actif | `switch-project mon-app` |
| `create-file` | Crée un nouveau fichier | `create-file index.js "console.log('Hello world');"` |
| `list-files` | Liste les fichiers d'un répertoire | `list-files src` |
| `read-file` | Lit le contenu d'un fichier | `read-file package.json` |
| `update-file` | Met à jour le contenu d'un fichier | `update-file README.md "# Mon Projet"` |
| `delete-file` | Supprime un fichier ou répertoire | `delete-file temp.txt` |
| `edit` | Édite des lignes spécifiques d'un fichier | `edit main.js 10-15 "// Nouveau code"` |
| `exec` | Exécute une commande shell | `exec npm install express` |
| `git-commit` | Commit les changements avec Git | `git-commit "Ajout de fonctionnalités"` |

## 🔌 API REST

VibeServer expose plusieurs endpoints REST pour interagir avec le système de fichiers et les projets :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/status` | GET | Vérifier l'état du serveur |
| `/api/projects/list` | GET | Lister tous les projets |
| `/api/projects/create` | POST | Créer un nouveau projet |
| `/api/projects/get` | GET | Obtenir les détails d'un projet |
| `/api/files/list` | GET | Lister les fichiers d'un projet |
| `/api/files/read` | GET | Lire le contenu d'un fichier |
| `/api/files/write` | POST | Écrire un nouveau fichier |
| `/api/files/edit-lines` | PATCH | Éditer des lignes spécifiques |
| `/api/files/delete` | DELETE | Supprimer un fichier |
| `/api/mcp/execute` | POST | Exécuter une commande MCP |
| `/api/mcp/context` | GET | Obtenir le contexte MCP courant |
| `/api/logs` | GET | Récupérer les logs récents |

## 🔧 Configuration

Le serveur peut être configuré via le fichier `.env` ou des variables d'environnement :

```
# Port d'écoute du serveur (défaut: 3000)
PORT=3000

# Niveau de log (debug, info, warn, error)
LOG_LEVEL=info

# Répertoire des projets (chemin absolu ou relatif)
PROJECTS_DIR=./projects

# Répertoire des logs (défaut: ./logs)
LOGS_DIR=./logs
```

## 📁 Structure du projet

```
VibeServer/
├── projects/              # Répertoire contenant les projets
├── public/                # Fichiers statiques (console web)
│   ├── console.html       # Interface de console
│   ├── css/               # Feuilles de style
│   └── js/                # Scripts client
├── src/                   # Code source du serveur
│   ├── routes/            # Définition des routes API
│   │   ├── files.js       # Routes pour la gestion des fichiers
│   │   ├── logs.js        # Routes pour la gestion des logs
│   │   ├── mcp.js         # Routes pour les commandes MCP
│   │   └── projects.js    # Routes pour la gestion des projets
│   └── server.js          # Point d'entrée principal
├── .env.example           # Exemple de configuration
├── package.json           # Dépendances et scripts
└── README.md              # Documentation
```

## 🔒 Sécurité

Veuillez noter que VibeServer est conçu pour être utilisé dans un environnement de développement local et **n'est pas sécurisé pour une exposition sur Internet**. Il offre un accès complet au système de fichiers dans le répertoire des projets et peut exécuter des commandes arbitraires.

Recommandations de sécurité :
- Exécutez le serveur uniquement sur votre machine locale (`localhost`)
- Ne pas exposer le serveur sur Internet
- Limiter l'accès aux répertoires de projets spécifiques
- Examiner les commandes exécutées via la console

## 🔄 Intégration avec Claude

Pour intégrer VibeServer avec Claude, utilisez le proxy [VibePMCP](https://github.com/DaMolks/VibePMCP) qui implémente le protocole MCP (Model Context Protocol) et permet à Claude Desktop de communiquer avec VibeServer.

1. Installer et configurer [VibePMCP](https://github.com/DaMolks/VibePMCP)
2. Configurer Claude Desktop pour utiliser VibePMCP
3. Utiliser les commandes MCP directement dans les conversations avec Claude

Exemple d'interaction avec Claude :

```
User: Crée un projet "hello-world" avec une application Express simple

Claude: Je vais créer un projet Express simple pour vous. Laissez-moi configurer cela:

```mcp create-project hello-world "Application Express simple"```
```mcp switch-project hello-world```
```mcp create-file package.json { "name": "hello-world", "version": "1.0.0", "dependencies": { "express": "^4.18.2" } }```
```mcp create-file app.js const express = require('express'); const app = express(); const port = 3001; app.get('/', (req, res) => { res.send('Hello, World!'); }); app.listen(port, () => { console.log(`Serveur démarré sur http://localhost:${port}`); });```
```mcp exec npm install```
```mcp exec node app.js```
```

Votre projet a été créé et le serveur Express est en cours d'exécution sur http://localhost:3001!
```

## 🛠️ Développement

Pour contribuer au développement de VibeServer :

```bash
# Cloner le dépôt
git clone https://github.com/DaMolks/VibeServer.git
cd VibeServer

# Installer les dépendances de développement
npm install

# Lancer le serveur en mode développement (avec rechargement automatique)
npm run dev
```

## 📚 Documentation technique

Consultez les fichiers sources commentés pour plus de détails sur l'implémentation technique.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir des issues ou des pull requests.

---

Développé avec ❤️ pour faciliter l'interaction entre Claude et votre environnement de développement.