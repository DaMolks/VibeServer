/**
 * mcp-schema.js
 * 
 * Ce fichier définit le schéma des commandes MCP pour l'autodocumentation
 * et l'autocomplétion dans les clients compatibles MCP.
 */

const { gitCommands, getMergedCommands } = require('./git-commands-schema');

// Définition des commandes MCP de base disponibles avec leurs schémas
const baseMcpCommands = {
  // Commandes de gestion de projets
  'create-project': {
    description: 'Crée un nouveau projet',
    parameters: [
      {
        name: 'name',
        type: 'string',
        description: 'Nom du projet à créer',
        required: true
      },
      {
        name: 'description',
        type: 'string',
        description: 'Description du projet (optionnelle)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Informations sur le projet créé',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' },
        project: { 
          type: 'object', 
          description: 'Détails du projet',
          properties: {
            name: { type: 'string', description: 'Nom du projet' },
            description: { type: 'string', description: 'Description du projet' },
            path: { type: 'string', description: 'Chemin du projet' }
          }
        }
      }
    },
    examples: [
      'create-project mon-app',
      'create-project portfolio "Portfolio personnel avec React"'
    ]
  },

  'list-projects': {
    description: 'Liste tous les projets disponibles',
    parameters: [],
    returns: {
      type: 'object',
      description: 'Liste des projets',
      properties: {
        projects: { 
          type: 'array', 
          description: 'Tableau des projets',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nom du projet' },
              description: { type: 'string', description: 'Description du projet' },
              created: { type: 'string', description: 'Date de création' },
              updated: { type: 'string', description: 'Date de dernière mise à jour' },
              isActive: { type: 'boolean', description: 'Indique si c\'est le projet actif' }
            }
          }
        }
      }
    },
    examples: ['list-projects']
  },

  'switch-project': {
    description: 'Change le projet actif',
    parameters: [
      {
        name: 'name',
        type: 'string',
        description: 'Nom du projet à activer',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: 'Confirmation du changement de projet',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' },
        currentProject: { type: 'string', description: 'Nom du projet actif' }
      }
    },
    examples: ['switch-project mon-app']
  },

  // Commandes de gestion de fichiers
  'create-file': {
    description: 'Crée un nouveau fichier avec un contenu optionnel',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Chemin du fichier à créer',
        required: true
      },
      {
        name: 'content',
        type: 'string',
        description: 'Contenu initial du fichier',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Confirmation de la création du fichier',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' },
        path: { type: 'string', description: 'Chemin du fichier créé' }
      }
    },
    examples: [
      'create-file README.md "# Mon projet"',
      'create-file src/index.js "console.log(\'Hello world\');"'
    ]
  },

  'list-files': {
    description: 'Liste les fichiers d\'un répertoire',
    parameters: [
      {
        name: 'directory',
        type: 'string',
        description: 'Chemin du répertoire à lister (défaut: racine du projet)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Liste des fichiers et répertoires',
      properties: {
        currentPath: { type: 'string', description: 'Chemin du répertoire listé' },
        files: { 
          type: 'array', 
          description: 'Tableau des fichiers et répertoires',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nom du fichier ou répertoire' },
              path: { type: 'string', description: 'Chemin relatif' },
              type: { type: 'string', description: 'Type (file ou directory)' },
              size: { type: 'number', description: 'Taille en octets' },
              modified: { type: 'string', description: 'Date de dernière modification' },
              isHidden: { type: 'boolean', description: 'Indique si c\'est un fichier caché' }
            }
          }
        }
      }
    },
    examples: [
      'list-files',
      'list-files src'
    ]
  },

  'read-file': {
    description: 'Lit le contenu d\'un fichier',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Chemin du fichier à lire',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: 'Contenu du fichier',
      properties: {
        path: { type: 'string', description: 'Chemin du fichier' },
        content: { type: 'string', description: 'Contenu du fichier' },
        size: { type: 'number', description: 'Taille en caractères' },
        lines: { type: 'number', description: 'Nombre de lignes' }
      }
    },
    examples: [
      'read-file package.json',
      'read-file src/App.js'
    ]
  },

  'update-file': {
    description: 'Met à jour le contenu d\'un fichier',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Chemin du fichier à mettre à jour',
        required: true
      },
      {
        name: 'content',
        type: 'string',
        description: 'Nouveau contenu du fichier',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: 'Confirmation de la mise à jour',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' },
        path: { type: 'string', description: 'Chemin du fichier mis à jour' },
        size: { type: 'number', description: 'Taille en caractères du nouveau contenu' }
      }
    },
    examples: [
      'update-file README.md "# Projet mis à jour"',
      'update-file config.json { "version": "1.0.1" }'
    ]
  },

  'delete-file': {
    description: 'Supprime un fichier ou un répertoire',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Chemin du fichier ou répertoire à supprimer',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: 'Confirmation de la suppression',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' },
        path: { type: 'string', description: 'Chemin du fichier ou répertoire supprimé' }
      }
    },
    examples: [
      'delete-file temp.js',
      'delete-file build'
    ]
  },

  'edit': {
    description: 'Édite des lignes spécifiques d\'un fichier',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Chemin du fichier à éditer',
        required: true
      },
      {
        name: 'lineRange',
        type: 'string',
        description: 'Plage de lignes à éditer (format: début-fin)',
        required: true
      },
      {
        name: 'content',
        type: 'string',
        description: 'Nouveau contenu pour remplacer les lignes spécifiées',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat de l\'édition',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        filePath: { type: 'string', description: 'Chemin du fichier édité' },
        startLine: { type: 'number', description: 'Ligne de début (0-indexed)' },
        endLine: { type: 'number', description: 'Ligne de fin (0-indexed)' },
        content: { type: 'string', description: 'Contenu des lignes spécifiées (si lecture seule)' },
        newLineCount: { type: 'number', description: 'Nombre de nouvelles lignes (si mise à jour)' },
        message: { type: 'string', description: 'Message de confirmation' }
      }
    },
    examples: [
      'edit main.js 10-15',
      'edit App.js 5-10 "const App = () => { return <div>Hello</div>; };"'
    ]
  },

  // Commandes utilitaires
  'exec': {
    description: 'Exécute une commande shell',
    parameters: [
      {
        name: 'command',
        type: 'string',
        description: 'Commande à exécuter',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat de la commande',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        command: { type: 'string', description: 'Commande exécutée' },
        stdout: { type: 'string', description: 'Sortie standard' },
        stderr: { type: 'string', description: 'Sortie d\'erreur' }
      }
    },
    examples: [
      'exec ls -la',
      'exec npm install express'
    ]
  },

  'help': {
    description: 'Affiche la liste des commandes disponibles',
    parameters: [],
    returns: {
      type: 'object',
      description: 'Aide sur les commandes',
      properties: {
        title: { type: 'string', description: 'Titre de l\'aide' },
        commands: { 
          type: 'array', 
          description: 'Liste des commandes disponibles',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nom de la commande' },
              description: { type: 'string', description: 'Description de la commande' }
            }
          }
        },
        currentProject: { type: 'string', description: 'Projet actuellement actif' }
      }
    },
    examples: ['help']
  }
};

// Fusionner les commandes de base avec les commandes Git
const mcpCommands = getMergedCommands(baseMcpCommands);

// Fonctions utilitaires
const getMcpCommandSchema = (commandName) => {
  return mcpCommands[commandName] || null;
};

const getAllMcpCommandSchemas = () => {
  return mcpCommands;
};

const getCommandHelp = (commandName) => {
  const command = mcpCommands[commandName];
  if (!command) return null;
  
  // Formater les paramètres pour l'affichage
  const paramsHelp = command.parameters.map(param => {
    const required = param.required ? '' : '?';
    return `${param.name}${required}: ${param.type} - ${param.description}`;
  });
  
  // Formater les exemples
  const examplesHelp = command.examples.map(ex => `  ${ex}`);
  
  return {
    name: commandName,
    description: command.description,
    usage: `${commandName} ${command.parameters.map(p => p.required ? `<${p.name}>` : `[${p.name}]`).join(' ')}`,
    parameters: paramsHelp,
    returns: `Returns: ${command.returns.description}`,
    examples: examplesHelp
  };
};

// Exporter toutes les fonctions et objets
module.exports = {
  mcpCommands,
  baseMcpCommands,
  gitCommands,
  getMcpCommandSchema,
  getAllMcpCommandSchemas,
  getCommandHelp
};
