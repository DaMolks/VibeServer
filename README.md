# VibeServer

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

VibeServer est un serveur backend qui fournit une API pour la manipulation de fichiers et projets, conçu pour être utilisé avec [VibePMCP](https://github.com/DaMolks/VibePMCP) et [Claude Desktop](https://claude.ai/desktop).

## 🌟 Caractéristiques principales

- **API REST complète** : API RESTful pour la gestion de fichiers et projets
- **Édition partielle de fichiers** : Manipulation précise de sections spécifiques des fichiers
- **Gestion de projets** : Organisation des fichiers par projets pour un meilleur contrôle
- **Intégration Git** : Support des opérations Git basiques
- **Exécution de commandes** : Possibilité d'exécuter des commandes shell sécurisées

## 🚀 Pourquoi VibeServer ?

VibeServer fournit un backend robuste pour la manipulation de fichiers et la gestion de projets, permettant à des assistants IA comme Claude d'interagir efficacement avec votre environnement de développement. Ce serveur peut fonctionner de façon indépendante, mais est optimisé pour être utilisé avec VibePMCP, qui agit comme un proxy vers Claude Desktop.

## 💻 Architecture

```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│               │      │               │      │               │
│ Claude Desktop│◄────►│   VibePMCP    │◄────►│  VibeServer   │
│    (Client)   │ MCP  │    (Proxy)    │ HTTP │   (Backend)   │
│               │      │               │      │               │
└───────────────┘      └───────────────┘      └───────────────┘
```

VibeServer est la partie backend qui gère réellement les fichiers, projets et commandes sur votre système.

## 📋 API Endpoints

### Projets

| Méthode | Endpoint                      | Description                                        |
|---------|-------------------------------|----------------------------------------------------|
| GET     | `/api/projects/list`          | Liste tous les projets disponibles                 |
| POST    | `/api/projects/create`        | Crée un nouveau projet                             |
| DELETE  | `/api/projects/delete`        | Supprime un projet existant                        |

### Fichiers

| Méthode | Endpoint                      | Description                                        |
|---------|-------------------------------|----------------------------------------------------|
| GET     | `/api/files/list`             | Liste les fichiers d'un répertoire                 |
| GET     | `/api/files/read`             | Lit le contenu d'un fichier                        |
| POST    | `/api/files/write`            | Écrit dans un fichier                              |
| PATCH   | `/api/files/edit-lines`       | Modifie des lignes spécifiques d'un fichier        |
| DELETE  | `/api/files/delete`           | Supprime un fichier                                |

### MCP (Model Context Protocol)

| Méthode | Endpoint                      | Description                                        |
|---------|-------------------------------|----------------------------------------------------|
| POST    | `/api/mcp/execute`            | Exécute une commande MCP                           |
| GET     | `/api/mcp/context`            | Récupère le contexte MCP actuel                    |

## 🔧 Installation

```bash
# Cloner le dépôt
git clone https://github.com/DaMolks/VibeServer.git
cd VibeServer

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Modifiez .env selon vos besoins

# Démarrer le serveur
npm run start
```

## ⚡ Démarrage rapide

```bash
# Démarrer le serveur en mode développement
npm run dev

# Démarrer le serveur en mode production
npm run start
```

## 📊 Exemple d'utilisation

### Créer un projet

```bash
curl -X POST http://localhost:3000/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mon-projet",
    "description": "Description de mon projet"
  }'
```

### Lire un fichier

```bash
curl -X GET "http://localhost:3000/api/files/read?project=mon-projet&path=README.md"
```

### Modifier des lignes spécifiques

```bash
curl -X PATCH http://localhost:3000/api/files/edit-lines \
  -H "Content-Type: application/json" \
  -d '{
    "project": "mon-projet",
    "path": "src/app.js",
    "startLine": 10,
    "endLine": 15,
    "newContent": "// Nouveau code\nfunction hello() {\n  return \"world\";\n}"
  }'
```

### Exécuter une commande MCP

```bash
curl -X POST http://localhost:3000/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "list-projects"
  }'
```

## 🏗️ Structure du projet

```
VibeServer/
├── src/                 # Code source
│   ├── routes/          # Routes de l'API
│   │   ├── projects.js  # Routes pour les projets
│   │   ├── files.js     # Routes pour les fichiers
│   │   └── mcp.js       # Routes pour le protocole MCP
│   ├── server.js        # Configuration du serveur Express
│   ├── database.js      # Gestion de la base de données pour l'historique
│   └── utils/           # Utilitaires divers
├── projects/            # Dossier où sont stockés les projets
├── database.db          # Base de données SQLite pour l'historique
├── public/              # Contenu statique
│   └── index.html       # Page d'accueil simple
└── tests/               # Tests automatisés
```

## 🔌 Intégration avec VibePMCP et Claude Desktop

VibeServer est conçu pour fonctionner avec [VibePMCP](https://github.com/DaMolks/VibePMCP), qui fait le pont entre Claude Desktop et ce serveur. Pour une intégration complète :

1. Installez et configurez VibeServer
2. Installez et configurez VibePMCP en pointant vers votre instance VibeServer
3. Configurez Claude Desktop pour utiliser VibePMCP

Consultez la [documentation d'intégration](./docs/INTEGRATION.md) pour des instructions détaillées.

## 🛡️ Sécurité

VibeServer exécute des commandes shell et manipule des fichiers, ce qui présente des risques de sécurité potentiels. Par défaut, le serveur :

- Limite les chemins de fichiers accessibles
- Restreint les commandes shell autorisées
- N'expose pas de fonctionnalités sensibles sans authentification

Pour des déploiements en production, nous recommandons vivement de :
- Activer l'authentification API
- Limiter l'accès réseau au serveur
- Exécuter le serveur avec des privilèges minimaux

## 🧩 Extensibilité

VibeServer est conçu pour être extensible :

- Système de plugins pour ajouter de nouvelles fonctionnalités
- API bien documentée pour l'intégration avec d'autres services
- Architecture modulaire facilitant les modifications

Pour créer des extensions, consultez le [guide d'extensibilité](./docs/EXTENDING.md).

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour les directives.

---

Développé avec ❤️ pour faciliter l'interaction entre les assistants IA et les environnements de développement.
