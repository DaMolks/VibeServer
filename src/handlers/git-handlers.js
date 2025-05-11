/**
 * git-handlers.js
 * 
 * Handlers pour les commandes Git dans le système MCP
 */

const gitManager = require('../utils/git-manager');
const { logToConsole } = require('./shared');

/**
 * Initialise un dépôt Git
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitInit(args) {
  logToConsole('info', `Exécution de git-init avec args: ${JSON.stringify(args)}`);
  
  if (!args.length) {
    throw new Error('Project name is required');
  }

  const projectName = args[0];
  const result = await gitManager.initRepo(projectName);

  return result;
}

/**
 * Commit des changements dans un dépôt Git
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitCommit(args) {
  logToConsole('info', `Exécution de git-commit avec args: ${JSON.stringify(args)}`);
  
  if (!args.length) {
    throw new Error('Project name and commit message are required');
  }

  let projectName, message;

  // Si un seul argument est fourni, on utilise le projet courant
  if (args.length === 1) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
    message = args[0];
  } else {
    projectName = args[0];
    message = args.slice(1).join(' ');
  }

  const result = await gitManager.commit(projectName, message);
  return result;
}

/**
 * Liste les branches d'un dépôt Git
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitBranches(args) {
  logToConsole('info', `Exécution de git-branches avec args: ${JSON.stringify(args)}`);
  
  let projectName;

  // Si aucun argument n'est fourni, on utilise le projet courant
  if (!args.length) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
  } else {
    projectName = args[0];
  }

  const result = await gitManager.listBranches(projectName);
  return result;
}

/**
 * Crée une nouvelle branche Git
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitCreateBranch(args) {
  logToConsole('info', `Exécution de git-branch avec args: ${JSON.stringify(args)}`);
  
  if (!args.length) {
    throw new Error('Branch name is required');
  }

  let projectName, branchName, checkout = true;

  // Si un seul argument est fourni, on utilise le projet courant
  if (args.length === 1) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
    branchName = args[0];
  } else {
    projectName = args[0];
    branchName = args[1];
    
    // Si un troisième argument est fourni et est 'false', ne pas checkout
    if (args.length > 2 && args[2].toLowerCase() === 'false') {
      checkout = false;
    }
  }

  const result = await gitManager.createBranch(projectName, branchName, checkout);
  return result;
}

/**
 * Change de branche Git
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitCheckout(args) {
  logToConsole('info', `Exécution de git-checkout avec args: ${JSON.stringify(args)}`);
  
  if (!args.length) {
    throw new Error('Branch name is required');
  }

  let projectName, branchName;

  // Si un seul argument est fourni, on utilise le projet courant
  if (args.length === 1) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
    branchName = args[0];
  } else {
    projectName = args[0];
    branchName = args[1];
  }

  const result = await gitManager.checkout(projectName, branchName);
  return result;
}

/**
 * Configure un dépôt distant
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitRemote(args) {
  logToConsole('info', `Exécution de git-remote avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 1) {
    throw new Error('Remote URL is required');
  }

  let projectName, remoteUrl, remoteName = 'origin';

  // Si un seul argument est fourni (l'URL), on utilise le projet courant
  if (args.length === 1) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
    remoteUrl = args[0];
  } 
  // Si deux arguments sont fournis (URL et nom du remote)
  else if (args.length === 2) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
    remoteUrl = args[0];
    remoteName = args[1];
  }
  // Si trois arguments sont fournis (projet, URL et nom du remote)
  else {
    projectName = args[0];
    remoteUrl = args[1];
    if (args.length > 2) {
      remoteName = args[2];
    }
  }

  const result = await gitManager.setRemote(projectName, remoteUrl, remoteName);
  return result;
}

/**
 * Envoie les changements vers un dépôt distant
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitPush(args) {
  logToConsole('info', `Exécution de git-push avec args: ${JSON.stringify(args)}`);
  
  let projectName, remoteName = 'origin', branchName = null;

  // Si aucun argument n'est fourni, on utilise le projet courant, origin, et la branche courante
  if (!args.length) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
  } 
  // Si un argument est fourni (nom du remote), on utilise le projet courant et la branche courante
  else if (args.length === 1) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
    remoteName = args[0];
  }
  // Si deux arguments sont fournis (nom du remote et nom de la branche), on utilise le projet courant
  else if (args.length === 2) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
    remoteName = args[0];
    branchName = args[1];
  }
  // Si trois arguments sont fournis (projet, nom du remote et nom de la branche)
  else {
    projectName = args[0];
    remoteName = args[1];
    branchName = args[2];
  }

  const result = await gitManager.push(projectName, remoteName, branchName);
  return result;
}

/**
 * Récupère les changements depuis un dépôt distant
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitPull(args) {
  logToConsole('info', `Exécution de git-pull avec args: ${JSON.stringify(args)}`);
  
  let projectName, remoteName = 'origin', branchName = null;

  // Si aucun argument n'est fourni, on utilise le projet courant, origin, et la branche courante
  if (!args.length) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
  } 
  // Si un argument est fourni (nom du remote), on utilise le projet courant et la branche courante
  else if (args.length === 1) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
    remoteName = args[0];
  }
  // Si deux arguments sont fournis (nom du remote et nom de la branche), on utilise le projet courant
  else if (args.length === 2) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
    remoteName = args[0];
    branchName = args[1];
  }
  // Si trois arguments sont fournis (projet, nom du remote et nom de la branche)
  else {
    projectName = args[0];
    remoteName = args[1];
    branchName = args[2];
  }

  const result = await gitManager.pull(projectName, remoteName, branchName);
  return result;
}

/**
 * Clone un dépôt Git distant
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitClone(args) {
  logToConsole('info', `Exécution de git-clone avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 1) {
    throw new Error('Repository URL is required');
  }

  const repoUrl = args[0];
  const projectName = args.length > 1 ? args[1] : null;

  const result = await gitManager.cloneRepo(repoUrl, projectName);
  return result;
}

/**
 * Obtient le statut d'un dépôt Git
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitStatus(args) {
  logToConsole('info', `Exécution de git-status avec args: ${JSON.stringify(args)}`);
  
  let projectName;

  // Si aucun argument n'est fourni, on utilise le projet courant
  if (!args.length) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
  } else {
    projectName = args[0];
  }

  const result = await gitManager.getStatus(projectName);
  return result;
}

/**
 * Obtient l'historique des commits d'un dépôt Git
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleGitHistory(args) {
  logToConsole('info', `Exécution de git-history avec args: ${JSON.stringify(args)}`);
  
  let projectName, maxCount = 10;

  // Si aucun argument n'est fourni, on utilise le projet courant
  if (!args.length) {
    if (!global.mcpContext || !global.mcpContext.currentProject) {
      throw new Error('No active project. Use switch-project command first.');
    }
    projectName = global.mcpContext.currentProject;
  } 
  // Si un argument est fourni (soit le projet, soit le nombre de commits)
  else if (args.length === 1) {
    // Si l'argument est un nombre, c'est le nombre de commits pour le projet courant
    if (!isNaN(parseInt(args[0]))) {
      if (!global.mcpContext || !global.mcpContext.currentProject) {
        throw new Error('No active project. Use switch-project command first.');
      }
      projectName = global.mcpContext.currentProject;
      maxCount = parseInt(args[0]);
    } 
    // Sinon, c'est le nom du projet avec le nombre de commits par défaut
    else {
      projectName = args[0];
    }
  } 
  // Si deux arguments sont fournis (le projet et le nombre de commits)
  else {
    projectName = args[0];
    if (!isNaN(parseInt(args[1]))) {
      maxCount = parseInt(args[1]);
    }
  }

  const result = await gitManager.getCommitHistory(projectName, maxCount);
  return result;
}

module.exports = {
  handleGitInit,
  handleGitCommit,
  handleGitBranches,
  handleGitCreateBranch,
  handleGitCheckout,
  handleGitRemote,
  handleGitPush,
  handleGitPull,
  handleGitClone,
  handleGitStatus,
  handleGitHistory
};
