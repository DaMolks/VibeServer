/**
 * shared.js
 * 
 * Fonctions et utilitaires partagés entre les handlers MCP
 */

/**
 * Journalise un message vers la console et les clients connectés
 * @param {string} type - Type de log (info, error, warn, etc.)
 * @param {string} content - Contenu du message
 */
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

/**
 * Vérifie si un projet est actif dans le contexte
 * @param {Object} mcpContext - Contexte MCP global
 * @returns {boolean} - True si un projet est actif
 */
function hasActiveProject(mcpContext) {
  return mcpContext && mcpContext.currentProject;
}

/**
 * Obtient le projet actif ou lance une erreur
 * @param {Object} mcpContext - Contexte MCP global
 * @returns {string} - Nom du projet actif
 * @throws {Error} - Si aucun projet n'est actif
 */
function getActiveProject(mcpContext) {
  if (!hasActiveProject(mcpContext)) {
    throw new Error('No active project. Use switch-project command first.');
  }
  return mcpContext.currentProject;
}

/**
 * Analyse une commande en séparant le nom de la commande et les arguments
 * @param {string} command - Commande à analyser
 * @returns {Object} - Objet contenant le nom de la commande et les arguments
 */
function parseCommand(command) {
  const parts = command.trim().split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  return { cmd, args };
}

/**
 * Formate un résultat pour le retour au client
 * @param {boolean} success - Succès de l'opération
 * @param {string} message - Message à renvoyer
 * @param {Object} data - Données supplémentaires
 * @returns {Object} - Résultat formaté
 */
function formatResult(success, message, data = {}) {
  return {
    success,
    message,
    ...data
  };
}

module.exports = {
  logToConsole,
  hasActiveProject,
  getActiveProject,
  parseCommand,
  formatResult
};
