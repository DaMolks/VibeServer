/**
 * Handlers pour les commandes de base du MCP
 */

const fs = require('fs').promises;
const path = require('path');

// État global pour le contexte MCP (sera importé du module parent)
let mcpContext;
let PROJECTS_DIR;
let logToConsole;
let gitManager;

/**
 * Initialise le module avec les dépendances nécessaires
 */
function init(context, projectsDir, logger, git) {
  mcpContext = context;
  PROJECTS_DIR = projectsDir;
  logToConsole = logger;
  gitManager = git;
}

/**
 * Handler pour create-project - Crée un nouveau projet avec Git
 */
async function handleCreateProject(args) {
  logToConsole('info', `Exécution de create-project avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 1) {
    throw new Error('Project name is required');
  }

  const name = args[0];
  const description = args.slice(1).join(' ');

  // Utiliser le GitManager pour initialiser un dépôt Git
  const result = await gitManager.initRepository(name, description);
  
  if (result.success) {
    // Mettre à jour le contexte
    mcpContext.currentProject = name;
    logToConsole('info', `Projet Git ${name} créé avec succès`);
  } else {
    logToConsole('error', `Échec de la création du projet Git ${name}: ${result.message}`);
  }
  
  return { 
    success: result.success, 
    message: result.message,
    project: { name, description, path: path.join(PROJECTS_DIR, name) }
  };
}

/**
 * Handler pour list-projects - Liste tous les projets disponibles
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

        // Vérifier si c'est un dépôt Git
        let isGitRepo = false;
        try {
          await fs.access(path.join(PROJECTS_DIR, item.name, '.git'));
          isGitRepo = true;
        } catch (err) {
          // Pas un dépôt Git
        }

        projects.push({
          name: config.name,
          description: config.description,
          created: config.created,
          updated: config.updated,
          isActive: config.name === mcpContext.currentProject,
          isGitRepo: isGitRepo
        });
      } catch (error) {
        // Si le fichier de configuration n'existe pas, vérifier si c'est un dépôt Git
        let isGitRepo = false;
        try {
          await fs.access(path.join(PROJECTS_DIR, item.name, '.git'));
          isGitRepo = true;
        } catch (err) {
          // Pas un dépôt Git
        }
        
        projects.push({ 
          name: item.name, 
          description: '', 
          created: null, 
          updated: null,
          isActive: item.name === mcpContext.currentProject,
          isGitRepo: isGitRepo
        });
      }
    }
  }

  logToConsole('info', `${projects.length} projets trouvés`);
  return { projects };
}

/**
 * Handler pour switch-project - Change le projet actif
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
  mcpContext.currentProject = projectName;

  logToConsole('info', `Projet actif changé pour ${projectName}`);
  return { 
    success: true, 
    message: `Switched to project '${projectName}'`,
    currentProject: projectName
  };
}

/**
 * Handler pour help - Affiche l'aide des commandes disponibles
 */
function handleHelp() {
  const commands = [
    // Commandes de base
    { name: 'help', description: 'Affiche la liste des commandes disponibles' },
    { name: 'create-project <nom> [description]', description: 'Crée un nouveau projet avec un dépôt Git' },
    { name: 'list-projects', description: 'Liste tous les projets disponibles' },
    { name: 'switch-project <nom>', description: 'Change le projet actif' },
    
    // Commandes de fichiers
    { name: 'create-file <chemin> [contenu]', description: 'Crée un nouveau fichier avec un contenu optionnel et l\'ajoute au staging Git' },
    { name: 'list-files [répertoire]', description: 'Liste les fichiers d\'un répertoire (par défaut: racine du projet)' },
    { name: 'read-file <chemin>', description: 'Lit le contenu d\'un fichier' },
    { name: 'update-file <chemin> <contenu>', description: 'Met à jour le contenu d\'un fichier et l\'ajoute au staging Git' },
    { name: 'delete-file <chemin>', description: 'Supprime un fichier ou un répertoire et le retire de Git' },
    { name: 'edit <chemin> <début-fin> [contenu]', description: 'Édite des lignes spécifiques d\'un fichier et l\'ajoute au staging Git' },
    { name: 'exec <commande>', description: 'Exécute une commande shell' },
    
    // Commandes Git
    { name: 'git-init [description]', description: 'Initialise un dépôt Git dans le projet courant' },
    { name: 'git-commit <message>', description: 'Crée un commit Git avec les fichiers stagés' },
    { name: 'git-push [remote] [branch]', description: 'Pousse les commits vers le dépôt distant' },
    { name: 'git-pull [remote] [branch]', description: 'Tire les changements depuis le dépôt distant' },
    { name: 'git-status', description: 'Affiche le statut du dépôt Git' },
    { name: 'git-remote <url> [name]', description: 'Configure un dépôt distant' },
    { name: 'git-branch [nom] [checkout]', description: 'Crée une nouvelle branche ou liste les branches existantes' },
    { name: 'git-checkout <branch>', description: 'Change de branche' },
    { name: 'git-merge <branch>', description: 'Fusionne une branche dans la branche courante' },
    { name: 'git-log [count]', description: 'Affiche l\'historique des commits' },
    { name: 'git-clone <url> <projectName>', description: 'Clone un dépôt distant dans un nouveau projet' },
    { name: 'git-diff [filePath]', description: 'Affiche les différences pour un fichier ou pour tout le projet' }
  ];

  logToConsole('info', 'Affichage de l\'aide');
  return {
    title: 'Commandes MCP disponibles',
    commands,
    currentProject: mcpContext.currentProject
  };
}

module.exports = {
  init,
  handleCreateProject,
  handleListProjects,
  handleSwitchProject,
  handleHelp
};