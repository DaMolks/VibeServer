/**
 * git-commands-schema.js
 * 
 * Ce fichier définit le schéma des commandes Git MCP pour l'autodocumentation
 * et l'autocomplétion dans les clients compatibles MCP.
 */

const gitCommands = {
  'git-init': {
    description: 'Initialise un dépôt Git dans un projet',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet à initialiser',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat de l\'initialisation',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' }
      }
    },
    examples: [
      'git-init mon-app'
    ]
  },

  'git-commit': {
    description: 'Crée un commit avec tous les changements dans le dépôt',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet (optionnel si un projet est actif)',
        required: false
      },
      {
        name: 'message',
        type: 'string',
        description: 'Message de commit',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat du commit',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' },
        details: { 
          type: 'object', 
          description: 'Détails du commit',
          properties: {
            commit: { type: 'string', description: 'Identifiant du commit' },
            branch: { type: 'string', description: 'Branche courante' },
            summary: { type: 'object', description: 'Résumé des changements' }
          }
        }
      }
    },
    examples: [
      'git-commit "Ajout de la fonctionnalité X"',
      'git-commit mon-app "Correction de bugs"'
    ]
  },

  'git-branches': {
    description: 'Liste toutes les branches du dépôt',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet (optionnel si un projet est actif)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Liste des branches',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        branches: { type: 'array', description: 'Liste des branches', items: { type: 'string' } },
        current: { type: 'string', description: 'Branche courante' }
      }
    },
    examples: [
      'git-branches',
      'git-branches mon-app'
    ]
  },

  'git-branch': {
    description: 'Crée une nouvelle branche dans le dépôt',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet (optionnel si un projet est actif)',
        required: false
      },
      {
        name: 'branch',
        type: 'string',
        description: 'Nom de la branche à créer',
        required: true
      },
      {
        name: 'checkout',
        type: 'boolean',
        description: 'Se positionner sur la nouvelle branche (défaut: true)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat de la création de branche',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' },
        checkout: { type: 'string', description: 'Information sur le positionnement' }
      }
    },
    examples: [
      'git-branch feature-x',
      'git-branch mon-app feature-x false'
    ]
  },

  'git-checkout': {
    description: 'Change de branche dans le dépôt',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet (optionnel si un projet est actif)',
        required: false
      },
      {
        name: 'branch',
        type: 'string',
        description: 'Nom de la branche cible',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat du changement de branche',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' }
      }
    },
    examples: [
      'git-checkout main',
      'git-checkout mon-app feature-x'
    ]
  },

  'git-remote': {
    description: 'Configure un dépôt distant pour le projet',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet (optionnel si un projet est actif)',
        required: false
      },
      {
        name: 'url',
        type: 'string',
        description: 'URL du dépôt distant',
        required: true
      },
      {
        name: 'name',
        type: 'string',
        description: 'Nom du dépôt distant (défaut: origin)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat de la configuration du dépôt distant',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' }
      }
    },
    examples: [
      'git-remote https://github.com/user/repo.git',
      'git-remote mon-app https://github.com/user/repo.git upstream'
    ]
  },

  'git-push': {
    description: 'Pousse les changements vers un dépôt distant',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet (optionnel si un projet est actif)',
        required: false
      },
      {
        name: 'remote',
        type: 'string',
        description: 'Nom du dépôt distant (défaut: origin)',
        required: false
      },
      {
        name: 'branch',
        type: 'string',
        description: 'Nom de la branche à pousser (défaut: branche courante)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat du push',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' }
      }
    },
    examples: [
      'git-push',
      'git-push origin main',
      'git-push mon-app origin feature-x'
    ]
  },

  'git-pull': {
    description: 'Récupère les changements depuis un dépôt distant',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet (optionnel si un projet est actif)',
        required: false
      },
      {
        name: 'remote',
        type: 'string',
        description: 'Nom du dépôt distant (défaut: origin)',
        required: false
      },
      {
        name: 'branch',
        type: 'string',
        description: 'Nom de la branche à tirer (défaut: branche courante)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat du pull',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' },
        details: { type: 'object', description: 'Détails des changements récupérés' }
      }
    },
    examples: [
      'git-pull',
      'git-pull origin main',
      'git-pull mon-app origin feature-x'
    ]
  },

  'git-clone': {
    description: 'Clone un dépôt distant dans un nouveau projet',
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: 'URL du dépôt à cloner',
        required: true
      },
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet à créer (défaut: nom du dépôt)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Résultat du clonage',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        message: { type: 'string', description: 'Message de confirmation' }
      }
    },
    examples: [
      'git-clone https://github.com/user/repo.git',
      'git-clone https://github.com/user/repo.git mon-app'
    ]
  },

  'git-status': {
    description: 'Affiche le statut du dépôt',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet (optionnel si un projet est actif)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Statut du dépôt',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        isClean: { type: 'boolean', description: 'Indique si le dépôt est propre' },
        current: { type: 'string', description: 'Branche courante' },
        tracking: { type: 'string', description: 'Branche distante suivie' },
        created: { type: 'array', description: 'Fichiers créés', items: { type: 'string' } },
        modified: { type: 'array', description: 'Fichiers modifiés', items: { type: 'string' } },
        deleted: { type: 'array', description: 'Fichiers supprimés', items: { type: 'string' } },
        renamed: { type: 'array', description: 'Fichiers renommés', items: { type: 'object' } },
        conflicted: { type: 'array', description: 'Fichiers en conflit', items: { type: 'string' } }
      }
    },
    examples: [
      'git-status',
      'git-status mon-app'
    ]
  },

  'git-history': {
    description: 'Affiche l\'historique des commits',
    parameters: [
      {
        name: 'project',
        type: 'string',
        description: 'Nom du projet (optionnel si un projet est actif)',
        required: false
      },
      {
        name: 'count',
        type: 'number',
        description: 'Nombre de commits à afficher (défaut: 10)',
        required: false
      }
    ],
    returns: {
      type: 'object',
      description: 'Historique des commits',
      properties: {
        success: { type: 'boolean', description: 'Succès de l\'opération' },
        history: { 
          type: 'array', 
          description: 'Liste des commits',
          items: {
            type: 'object',
            properties: {
              hash: { type: 'string', description: 'Hash du commit' },
              date: { type: 'string', description: 'Date du commit' },
              message: { type: 'string', description: 'Message du commit' },
              author: { type: 'string', description: 'Auteur du commit' },
              email: { type: 'string', description: 'Email de l\'auteur' }
            }
          }
        }
      }
    },
    examples: [
      'git-history',
      'git-history mon-app',
      'git-history mon-app 20'
    ]
  }
};

/**
 * Fusionne le schéma des commandes Git avec le schéma principal des commandes MCP
 * @param {Object} mcpCommands - Objet contenant les commandes MCP existantes
 * @returns {Object} - Nouvel objet contenant toutes les commandes
 */
function getMergedCommands(mcpCommands) {
  return {
    ...mcpCommands,
    ...gitCommands
  };
}

module.exports = {
  gitCommands,
  getMergedCommands
};
