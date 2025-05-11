/**
 * mcp-api.js
 * 
 * Ce fichier définit les routes d'API pour la compatibilité avec le protocole MCP,
 * permettant aux clients comme Claude de découvrir les fonctionnalités disponibles.
 */

const express = require('express');
const router = express.Router();
const { mcpCommands, getAllMcpCommandSchemas, getCommandHelp } = require('./mcp-schema');

// Informations sur la version du serveur
const SERVER_INFO = {
  name: 'VibeServer',
  version: '1.0.0',
  description: 'Serveur local pour l\'intégration avec Claude et d\'autres modèles IA via MCP',
  protocolVersion: '1.0.0',
  capabilities: ['commands', 'files', 'projects', 'exec']
};

// Route pour obtenir les informations sur le serveur MCP
router.get('/info', (req, res) => {
  res.json({
    success: true,
    ...SERVER_INFO
  });
});

// Route pour obtenir les commandes disponibles
router.get('/commands', (req, res) => {
  const commandName = req.query.command;
  
  // Si un nom de commande est fourni, renvoyer les détails de cette commande
  if (commandName) {
    const helpInfo = getCommandHelp(commandName);
    if (helpInfo) {
      return res.json({
        success: true,
        command: helpInfo
      });
    } else {
      return res.status(404).json({
        success: false,
        error: `Command '${commandName}' not found`
      });
    }
  }
  
  // Sinon, renvoyer la liste de toutes les commandes
  const commands = getAllMcpCommandSchemas();
  const commandList = Object.keys(commands).map(key => ({
    name: key,
    description: commands[key].description
  }));
  
  res.json({
    success: true,
    count: commandList.length,
    commands: commandList
  });
});

// Route pour obtenir le schéma complet d'une commande
router.get('/commands/:commandName/schema', (req, res) => {
  const { commandName } = req.params;
  const commandSchema = mcpCommands[commandName];
  
  if (!commandSchema) {
    return res.status(404).json({
      success: false,
      error: `Command '${commandName}' not found`
    });
  }
  
  res.json({
    success: true,
    command: commandName,
    schema: commandSchema
  });
});

// Route pour obtenir des exemples d'utilisation d'une commande
router.get('/commands/:commandName/examples', (req, res) => {
  const { commandName } = req.params;
  const commandSchema = mcpCommands[commandName];
  
  if (!commandSchema) {
    return res.status(404).json({
      success: false,
      error: `Command '${commandName}' not found`
    });
  }
  
  res.json({
    success: true,
    command: commandName,
    examples: commandSchema.examples || []
  });
});

// Route pour la complétion automatique des commandes (utilisée par les clients MCP)
router.post('/complete', (req, res) => {
  const { prefix } = req.body;
  
  if (!prefix) {
    return res.status(400).json({
      success: false,
      error: 'Prefix is required'
    });
  }
  
  // Extraire le nom de la commande et les arguments du préfixe
  const parts = prefix.trim().split(' ');
  const cmdName = parts[0];
  const args = parts.slice(1);
  
  // Si le préfixe est vide ou incomplet, suggérer des commandes qui commencent par ce préfixe
  if (parts.length === 1) {
    const suggestions = Object.keys(mcpCommands)
      .filter(cmd => cmd.startsWith(cmdName))
      .map(cmd => ({
        command: cmd,
        description: mcpCommands[cmd].description
      }));
    
    return res.json({
      success: true,
      prefix,
      suggestions
    });
  }
  
  // Si une commande complète est fournie, suggérer des paramètres
  const command = mcpCommands[cmdName];
  if (command) {
    // Trouver les paramètres qui n'ont pas encore été fournis
    const remainingParams = command.parameters.slice(args.length);
    const suggestions = remainingParams.map(param => ({
      value: param.required ? `<${param.name}>` : `[${param.name}]`,
      description: param.description
    }));
    
    return res.json({
      success: true,
      prefix,
      suggestions
    });
  }
  
  // Si aucune suggestion n'est trouvée
  res.json({
    success: true,
    prefix,
    suggestions: []
  });
});

module.exports = router;