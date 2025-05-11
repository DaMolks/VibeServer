/**
 * API MCP - Permet de récupérer dynamiquement les commandes MCP disponibles
 */

const express = require('express');
const router = express.Router();

// Liste des commandes MCP disponibles avec leurs paramètres
const MCP_COMMANDS = [
  // Commandes de base
  {
    name: 'help',
    description: 'Affiche la liste des commandes disponibles',
    parameters: []
  },
  {
    name: 'create-project',
    description: 'Crée un nouveau projet avec un dépôt Git',
    parameters: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'Nom du projet'
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        description: 'Description du projet'
      }
    ]
  },
  {
    name: 'list-projects',
    description: 'Liste tous les projets disponibles',
    parameters: []
  },
  {
    name: 'switch-project',
    description: 'Change le projet actif',
    parameters: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'Nom du projet'
      }
    ]
  },
  
  // Commandes de fichiers
  {
    name: 'create-file',
    description: 'Crée un nouveau fichier avec un contenu optionnel et l\'ajoute au staging Git',
    parameters: [
      {
        name: 'path',
        type: 'string',
        required: true,
        description: 'Chemin du fichier à créer'
      },
      {
        name: 'content',
        type: 'string',
        required: false,
        description: 'Contenu initial du fichier'
      }
    ]
  },
  {
    name: 'list-files',
    description: 'Liste les fichiers d\'un répertoire',
    parameters: [
      {
        name: 'directory',
        type: 'string',
        required: false,
        description: 'Répertoire à lister (par défaut: racine du projet)'
      }
    ]
  },
  {
    name: 'read-file',
    description: 'Lit le contenu d\'un fichier',
    parameters: [
      {
        name: 'path',
        type: 'string',
        required: true,
        description: 'Chemin du fichier à lire'
      }
    ]
  },
  {
    name: 'update-file',
    description: 'Met à jour le contenu d\'un fichier et l\'ajoute au staging Git',
    parameters: [
      {
        name: 'path',
        type: 'string',
        required: true,
        description: 'Chemin du fichier à mettre à jour'
      },
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'Nouveau contenu du fichier'
      }
    ]
  },
  {
    name: 'delete-file',
    description: 'Supprime un fichier ou un répertoire et le retire de Git',
    parameters: [
      {
        name: 'path',
        type: 'string',
        required: true,
        description: 'Chemin du fichier ou répertoire à supprimer'
      }
    ]
  },
  {
    name: 'edit',
    description: 'Édite des lignes spécifiques d\'un fichier et l\'ajoute au staging Git',
    parameters: [
      {
        name: 'path',
        type: 'string',
        required: true,
        description: 'Chemin du fichier à éditer'
      },
      {
        name: 'lineRange',
        type: 'string',
        required: true,
        description: 'Plage de lignes à éditer (format: début-fin)'
      },
      {
        name: 'content',
        type: 'string',
        required: false,
        description: 'Nouveau contenu pour les lignes'
      }
    ]
  },
  {
    name: 'exec',
    description: 'Exécute une commande shell',
    parameters: [
      {
        name: 'command',
        type: 'string',
        required: true,
        description: 'Commande à exécuter'
      }
    ]
  },
  
  // Commandes Git
  {
    name: 'git-init',
    description: 'Initialise un dépôt Git dans le projet courant',
    parameters: [
      {
        name: 'description',
        type: 'string',
        required: false,
        description: 'Description du dépôt'
      }
    ]
  },
  {
    name: 'git-commit',
    description: 'Crée un commit Git avec les fichiers stagés',
    parameters: [
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'Message de commit'
      }
    ]
  },
  {
    name: 'git-push',
    description: 'Pousse les commits vers le dépôt distant',
    parameters: [
      {
        name: 'remote',
        type: 'string',
        required: false,
        description: 'Nom du dépôt distant (par défaut: origin)'
      },
      {
        name: 'branch',
        type: 'string',
        required: false,
        description: 'Nom de la branche (par défaut: main)'
      }
    ]
  },
  {
    name: 'git-pull',
    description: 'Tire les changements depuis le dépôt distant',
    parameters: [
      {
        name: 'remote',
        type: 'string',
        required: false,
        description: 'Nom du dépôt distant (par défaut: origin)'
      },
      {
        name: 'branch',
        type: 'string',
        required: false,
        description: 'Nom de la branche (par défaut: main)'
      }
    ]
  },
  {
    name: 'git-status',
    description: 'Affiche le statut du dépôt Git',
    parameters: []
  },
  {
    name: 'git-remote',
    description: 'Configure un dépôt distant',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'URL du dépôt distant ou sous-commande (add, set-url)'
      },
      {
        name: 'name',
        type: 'string',
        required: false,
        description: 'Nom du dépôt distant (par défaut: origin)'
      }
    ]
  },
  {
    name: 'git-branch',
    description: 'Crée une nouvelle branche ou liste les branches existantes',
    parameters: [
      {
        name: 'name',
        type: 'string',
        required: false,
        description: 'Nom de la branche à créer'
      },
      {
        name: 'checkout',
        type: 'boolean',
        required: false,
        description: 'Si true, se positionne sur la nouvelle branche (par défaut: true)'
      }
    ]
  },
  {
    name: 'git-checkout',
    description: 'Change de branche',
    parameters: [
      {
        name: 'branch',
        type: 'string',
        required: true,
        description: 'Nom de la branche'
      }
    ]
  },
  {
    name: 'git-merge',
    description: 'Fusionne une branche dans la branche courante',
    parameters: [
      {
        name: 'branch',
        type: 'string',
        required: true,
        description: 'Nom de la branche à fusionner'
      }
    ]
  },
  {
    name: 'git-log',
    description: 'Affiche l\'historique des commits',
    parameters: [
      {
        name: 'count',
        type: 'number',
        required: false,
        description: 'Nombre de commits à afficher (par défaut: 10)'
      }
    ]
  },
  {
    name: 'git-clone',
    description: 'Clone un dépôt distant dans un nouveau projet',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'URL du dépôt distant'
      },
      {
        name: 'projectName',
        type: 'string',
        required: true,
        description: 'Nom du projet à créer'
      }
    ]
  },
  {
    name: 'git-diff',
    description: 'Affiche les différences pour un fichier ou pour tout le projet',
    parameters: [
      {
        name: 'filePath',
        type: 'string',
        required: false,
        description: 'Chemin du fichier (par défaut: tous les fichiers)'
      }
    ]
  }
];

// Route pour récupérer la liste des commandes
router.get('/commands', (req, res) => {
  res.json({ commands: MCP_COMMANDS });
});

// Route pour récupérer les détails d'une commande spécifique
router.get('/commands/:name', (req, res) => {
  const commandName = req.params.name;
  const command = MCP_COMMANDS.find(cmd => cmd.name === commandName);
  
  if (command) {
    res.json(command);
  } else {
    res.status(404).json({ error: `Command '${commandName}' not found` });
  }
});

module.exports = router;