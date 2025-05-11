/**
 * Routes MCP - Point d'entrée pour les commandes MCP
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const GitManager = require('../utils/git-manager');

// Importer les handlers
const baseHandlers = require('./handlers/base-handlers');
const fileHandlers = require('./handlers/file-handlers');
const gitHandlers = require('./handlers/git-handlers');

// Constantes
const PROJECTS_DIR = path.join(__dirname, '../../projects');

// Initialiser le gestionnaire Git
const gitManager = new GitManager(PROJECTS_DIR);

// État global pour le contexte MCP
let mcpContext = {
  currentProject: null,
  lastCommand: null,
  history: []
};

// Fonction helper pour envoyer des logs à la console
function logToConsole(type, content) {
  console.log(`[MCP] ${type.toUpperCase()}: ${content}`);
  
  // Utiliser la fonction globale si elle existe
  if (global.sendLogToClients) {
    global.sendLogToClients({
      type,
      timestamp: new Date(),
      content
    });
  }
}

// Initialiser tous les modules handlers avec les dépendances
baseHandlers.init(mcpContext, PROJECTS_DIR, logToConsole, gitManager);
fileHandlers.init(mcpContext, PROJECTS_DIR, logToConsole, gitManager);
gitHandlers.init(mcpContext, PROJECTS_DIR, logToConsole, gitManager);

// Exécute une commande MCP
router.post('/execute', async (req, res, next) => {
  try {
    const { command } = req.body;
    logToConsole('info', `Commande reçue: ${command}`);

    if (!command) {
      logToConsole('error', 'Commande manquante');
      return res.status(400).json({ 
        success: false,
        error: 'Command is required' 
      });
    }

    // Ajouter la commande à l'historique
    mcpContext.lastCommand = command;
    mcpContext.history.push({
      command,
      timestamp: new Date().toISOString()
    });

    // Analyser la commande
    const { cmd, args } = parseCommand(command);
    logToConsole('info', `Commande analysée: cmd=${cmd}, args=${JSON.stringify(args)}`);
    
    let result;

    // Exécuter la commande appropriée
    switch (cmd) {
      // Commandes de base
      case 'create-project':
        result = await baseHandlers.handleCreateProject(args);
        break;
      case 'list-projects':
        result = await baseHandlers.handleListProjects(args);
        break;
      case 'switch-project':
      case 'use-project':
        result = await baseHandlers.handleSwitchProject(args);
        break;
      case 'help':
        result = baseHandlers.handleHelp();
        break;
      
      // Commandes de fichiers
      case 'create-file':
        result = await fileHandlers.handleCreateFile(args);
        break;
      case 'list-files':
        result = await fileHandlers.handleListFiles(args);
        break;
      case 'read-file':
        result = await fileHandlers.handleReadFile(args);
        break;
      case 'update-file':
        result = await fileHandlers.handleUpdateFile(args);
        break;
      case 'delete-file':
        result = await fileHandlers.handleDeleteFile(args);
        break;
      case 'edit':
        result = await fileHandlers.handleEditFile(args);
        break;
      case 'exec':
        result = await fileHandlers.handleExecCommand(args);
        break;
        
      // Commandes Git
      case 'git-init':
        result = await gitHandlers.handleGitInit(args);
        break;
      case 'git-commit':
        result = await gitHandlers.handleGitCommit(args);
        break;
      case 'git-push':
        result = await gitHandlers.handleGitPush(args);
        break;
      case 'git-pull':
        result = await gitHandlers.handleGitPull(args);
        break;
      case 'git-status':
        result = await gitHandlers.handleGitStatus(args);
        break;
      case 'git-remote':
        result = await gitHandlers.handleGitRemote(args);
        break;
      case 'git-branch':
        result = await gitHandlers.handleGitBranch(args);
        break;
      case 'git-checkout':
        result = await gitHandlers.handleGitCheckout(args);
        break;
      case 'git-merge':
        result = await gitHandlers.handleGitMerge(args);
        break;
      case 'git-log':
        result = await gitHandlers.handleGitLog(args);
        break;
      case 'git-clone':
        result = await gitHandlers.handleGitClone(args);
        break;
      case 'git-diff':
        result = await gitHandlers.handleGitDiff(args);
        break;
          
      default:
        logToConsole('error', `Commande inconnue: ${cmd}`);
        return res.status(400).json({ 
          success: false,
          error: `Unknown command: ${cmd}` 
        });
    }

    logToConsole('info', `Résultat de la commande ${cmd}: ${JSON.stringify(result)}`);
    
    // Envoyer la réponse formatée
    const response = { success: true, command, result };
    res.json(response);
    
    // Envoyer également le résultat à la console web
    logToConsole('response', `Réponse pour ${cmd}: ${JSON.stringify(response)}`);
    
  } catch (error) {
    logToConsole('error', `Erreur lors de l'exécution de la commande MCP: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: `Error executing MCP command: ${error.message}` 
    });
  }
});

// Récupère le contexte MCP actuel
router.get('/context', (req, res) => {
  logToConsole('info', 'Récupération du contexte MCP');
  res.json({ context: mcpContext });
});

// Analyse une commande
function parseCommand(command) {
  const parts = command.trim().split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  return { cmd, args };
}

module.exports = router;