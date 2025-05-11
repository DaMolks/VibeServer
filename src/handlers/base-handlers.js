/**
 * base-handlers.js
 * 
 * Handlers pour les commandes de base dans le système MCP
 * (projets et utilitaires)
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { logToConsole, getActiveProject } = require('./shared');

const execPromise = util.promisify(exec);
const PROJECTS_DIR = path.join(__dirname, '../../projects');

/**
 * Crée un nouveau projet
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleCreateProject(args) {
  logToConsole('info', `Exécution de create-project avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 1) {
    throw new Error('Project name is required');
  }

  const name = args[0];
  const description = args.slice(1).join(' ');

  const projectPath = path.join(PROJECTS_DIR, name);

  // Vérifier si le projet existe déjà
  try {
    await fs.access(projectPath);
    logToConsole('error', `Le projet ${name} existe déjà`);
    throw new Error('Project already exists');
  } catch (error) {
    // Si l'erreur est différente de "le projet existe", la propager
    if (error.message !== 'Project already exists') {
      // Projet n'existe pas, c'est ce qu'on veut
      logToConsole('info', `Le projet ${name} n'existe pas, création en cours...`);
      
      // Créer le dossier du projet
      await fs.mkdir(projectPath, { recursive: true });

      // Créer un fichier README.md par défaut
      const readmePath = path.join(projectPath, 'README.md');
      const readmeContent = `# ${name}\n\n${description || 'A VibeServer project'}\n`;

      await fs.writeFile(readmePath, readmeContent, 'utf8');

      // Créer un fichier de configuration pour le projet
      const configPath = path.join(projectPath, '.vibeserver.json');
      const configContent = JSON.stringify({
        name,
        description: description || '',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }, null, 2);

      await fs.writeFile(configPath, configContent, 'utf8');

      // Mettre à jour le contexte
      global.mcpContext.currentProject = name;

      logToConsole('info', `Projet ${name} créé avec succès`);
      return { 
        success: true, 
        message: `Project '${name}' created successfully`,
        project: { name, description, path: projectPath }
      };
    }
    throw error;
  }
}

/**
 * Liste tous les projets disponibles
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleListProjects() {
  logToConsole('info', `Exécution de list-projects`);
  
  const items = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
  const projects = [];

  for (const item of items) {
    if (item.isDirectory()) {
      try {
        const configPath = path.join(PROJECTS_DIR, item.name, '.vibeserver.json');
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);

        projects.push({
          name: config.name,
          description: config.description,
          created: config.created,
          updated: config.updated,
          isActive: config.name === global.mcpContext.currentProject
        });
      } catch (error) {
        // Si le fichier de configuration n'existe pas, ajouter juste le nom
        projects.push({ 
          name: item.name, 
          description: '', 
          created: null, 
          updated: null,
          isActive: item.name === global.mcpContext.currentProject
        });
      }
    }
  }

  logToConsole('info', `${projects.length} projets trouvés`);
  return { projects };
}

/**
 * Change le projet actif
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleSwitchProject(args) {
  logToConsole('info', `Exécution de switch-project avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 1) {
    throw new Error('Project name is required');
  }

  const projectName = args[0];
  const projectPath = path.join(PROJECTS_DIR, projectName);

  // Vérifier si le projet existe
  try {
    await fs.access(projectPath);
  } catch (error) {
    logToConsole('error', `Le projet ${projectName} n'existe pas`);
    throw new Error('Project not found');
  }

  // Mettre à jour le contexte
  global.mcpContext.currentProject = projectName;

  logToConsole('info', `Projet actif changé pour ${projectName}`);
  return { 
    success: true, 
    message: `Switched to project '${projectName}'`,
    currentProject: projectName
  };
}

/**
 * Exécute une commande shell
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleExecCommand(args) {
  logToConsole('info', `Exécution de exec avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 1) {
    throw new Error('Command is required');
  }

  const command = args.join(' ');

  try {
    logToConsole('info', `Exécution de la commande shell: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    return {
      success: true,
      command,
      stdout,
      stderr
    };
  } catch (error) {
    logToConsole('error', `Erreur lors de l'exécution de la commande: ${error.message}`);
    throw new Error(`Command failed: ${error.message}`);
  }
}

/**
 * Affiche l'aide sur les commandes disponibles
 * @returns {Object} - Résultat de l'opération
 */
function handleHelp() {
  // Récupérer dynamiquement les commandes depuis les fichiers de schéma
  const { mcpCommands } = require('../routes/mcp-schema');
  
  const commands = Object.entries(mcpCommands).map(([name, schema]) => ({
    name,
    description: schema.description
  }));
  
  logToConsole('info', 'Affichage de l\'aide');
  return {
    title: 'Commandes MCP disponibles',
    commands,
    currentProject: global.mcpContext.currentProject
  };
}

module.exports = {
  handleCreateProject,
  handleListProjects,
  handleSwitchProject,
  handleExecCommand,
  handleHelp
};
