/**
 * mcp.js
 * 
 * Routes principales pour le traitement des commandes MCP
 */

const express = require('express');
const router = express.Router();
const { parseCommand, logToConsole } = require('../handlers/shared');

// Importation des handlers
const baseHandlers = require('../handlers/base-handlers');
const fileHandlers = require('../handlers/file-handlers');
const gitHandlers = require('../handlers/git-handlers');

// État global pour le contexte MCP
global.mcpContext = {
  currentProject: null,
  lastCommand: null,
  history: []
};

// Registre des commandes disponibles et leur handler associé
const commandHandlers = {
  // Commandes de base (projets)
  'create-project': baseHandlers.handleCreateProject,
  'list-projects': baseHandlers.handleListProjects,
  'switch-project': baseHandlers.handleSwitchProject,
  'use-project': baseHandlers.handleSwitchProject,
  
  // Commandes de fichiers
  'create-file': fileHandlers.handleCreateFile,
  'list-files': fileHandlers.handleListFiles,
  'read-file': fileHandlers.handleReadFile,
  'update-file': fileHandlers.handleUpdateFile,
  'delete-file': fileHandlers.handleDeleteFile,
  'edit': fileHandlers.handleEditFile,
  
  // Commandes utilitaires
  'exec': baseHandlers.handleExecCommand,
  'help': baseHandlers.handleHelp,

  // Commandes Git
  'git-init': gitHandlers.handleGitInit,
  'git-commit': gitHandlers.handleGitCommit,
  'git-branches': gitHandlers.handleGitBranches,
  'git-branch': gitHandlers.handleGitCreateBranch,
  'git-checkout': gitHandlers.handleGitCheckout,
  'git-remote': gitHandlers.handleGitRemote,
  'git-push': gitHandlers.handleGitPush,
  'git-pull': gitHandlers.handleGitPull,
  'git-clone': gitHandlers.handleGitClone,
  'git-status': gitHandlers.handleGitStatus,
  'git-history': gitHandlers.handleGitHistory
};

/**
 * Exécute une commande MCP
 * @route POST /api/mcp/execute
 */
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
    global.mcpContext.lastCommand = command;
    global.mcpContext.history.push({
      command,
      timestamp: new Date().toISOString()
    });

    // Analyser la commande
    const { cmd, args } = parseCommand(command);
    logToConsole('info', `Commande analysée: cmd=${cmd}, args=${JSON.stringify(args)}`);
    
    // Vérifier si la commande existe
    if (!commandHandlers[cmd]) {
      logToConsole('error', `Commande inconnue: ${cmd}`);
      return res.status(400).json({ 
        success: false,
        error: `Unknown command: ${cmd}` 
      });
    }

    // Exécuter le handler correspondant
    const handler = commandHandlers[cmd];
    const result = await handler(args);

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

/**
 * Récupère le contexte MCP actuel
 * @route GET /api/mcp/context
 */
router.get('/context', (req, res) => {
  logToConsole('info', 'Récupération du contexte MCP');
  res.json({ context: global.mcpContext });
});

/**
 * Récupère la liste des commandes disponibles
 * @route GET /api/mcp/commands
 */
router.get('/commands', (req, res) => {
  logToConsole('info', 'Récupération de la liste des commandes disponibles');
  
  const commands = Object.keys(commandHandlers).map(cmd => ({
    name: cmd,
    handler: commandHandlers[cmd].name
  }));
  
  res.json({
    success: true,
    commands
  });
});

module.exports = router;
