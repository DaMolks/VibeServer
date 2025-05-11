/**
 * Handlers pour les commandes Git du MCP
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
 * Handler pour git-init - Initialise un dépôt Git
 */
async function handleGitInit(args) {
  logToConsole('info', `Exécution de git-init avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  const description = args.join(' ') || '';
  
  // Utiliser le GitManager pour initialiser un dépôt Git
  const result = await gitManager.initRepository(mcpContext.currentProject, description);
  
  return {
    success: result.success,
    message: result.message
  };
}

/**
 * Handler pour git-commit - Crée un commit avec les changements stagés
 */
async function handleGitCommit(args) {
  logToConsole('info', `Exécution de git-commit avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('Commit message is required');
  }

  const message = args.join(' ');
  
  // Utiliser GitManager pour créer un commit
  const result = await gitManager.commit(mcpContext.currentProject, message);
  
  return {
    success: result.success,
    message: result.message,
    commitHash: result.commitHash
  };
}

/**
 * Handler pour git-push - Pousse les commits vers le dépôt distant
 */
async function handleGitPush(args) {
  logToConsole('info', `Exécution de git-push avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  const remoteName = args.length > 0 ? args[0] : 'origin';
  const branchName = args.length > 1 ? args[1] : 'main';
  
  // Utiliser GitManager pour pousser les commits
  const result = await gitManager.push(mcpContext.currentProject, remoteName, branchName);
  
  return {
    success: result.success,
    message: result.message
  };
}

/**
 * Handler pour git-pull - Tire les changements depuis le dépôt distant
 */
async function handleGitPull(args) {
  logToConsole('info', `Exécution de git-pull avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  const remoteName = args.length > 0 ? args[0] : 'origin';
  const branchName = args.length > 1 ? args[1] : 'main';
  
  // Utiliser GitManager pour tirer les changements
  const result = await gitManager.pull(mcpContext.currentProject, remoteName, branchName);
  
  return {
    success: result.success,
    message: result.message,
    summary: result.summary
  };
}

/**
 * Handler pour git-status - Affiche le statut du dépôt Git
 */
async function handleGitStatus(args) {
  logToConsole('info', `Exécution de git-status avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }
  
  // Utiliser GitManager pour obtenir le statut du dépôt
  const result = await gitManager.getStatus(mcpContext.currentProject);
  
  return {
    success: result.success,
    currentBranch: result.currentBranch,
    staged: result.staged,
    modified: result.modified,
    deleted: result.deleted,
    untracked: result.untracked,
    isClean: result.isClean
  };
}

/**
 * Handler pour git-remote - Configure un dépôt distant
 */
async function handleGitRemote(args) {
  logToConsole('info', `Exécution de git-remote avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('Remote command or URL is required');
  }

  const subCommand = args[0];
  
  // Sous-commande : add <n> <url>
  if (subCommand === 'add' && args.length >= 3) {
    const remoteName = args[1];
    const remoteUrl = args[2];
    
    const result = await gitManager.setRemote(mcpContext.currentProject, remoteUrl, remoteName);
    
    return {
      success: result.success,
      message: result.message
    };
  } 
  // Sous-commande : set-url <n> <url>
  else if (subCommand === 'set-url' && args.length >= 3) {
    const remoteName = args[1];
    const remoteUrl = args[2];
    
    const result = await gitManager.setRemote(mcpContext.currentProject, remoteUrl, remoteName);
    
    return {
      success: result.success,
      message: result.message
    };
  }
  // URL directement fournie (syntaxe simplifiée pour les utilisateurs)
  else if (subCommand.includes('://')) {
    const remoteUrl = subCommand;
    const remoteName = args.length > 1 ? args[1] : 'origin';
    
    const result = await gitManager.setRemote(mcpContext.currentProject, remoteUrl, remoteName);
    
    return {
      success: result.success,
      message: result.message
    };
  }
  // Si aucune des options ci-dessus ne correspond
  else {
    throw new Error('Invalid git-remote command. Use: git-remote add <n> <url>, git-remote set-url <n> <url>, or git-remote <url> [name]');
  }
}

/**
 * Handler pour git-branch - Crée ou liste les branches
 */
async function handleGitBranch(args) {
  logToConsole('info', `Exécution de git-branch avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  // Si aucun argument n'est fourni, liste les branches
  if (args.length === 0) {
    const result = await gitManager.getBranches(mcpContext.currentProject);
    
    return {
      success: result.success,
      current: result.current,
      branches: result.all,
      details: result.branches
    };
  }
  // Si des arguments sont fournis, crée une nouvelle branche
  else {
    const branchName = args[0];
    const checkout = args.length > 1 ? args[1] === 'checkout' : true;
    
    const result = await gitManager.createBranch(mcpContext.currentProject, branchName, checkout);
    
    return {
      success: result.success,
      message: result.message
    };
  }
}

/**
 * Handler pour git-checkout - Change de branche
 */
async function handleGitCheckout(args) {
  logToConsole('info', `Exécution de git-checkout avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('Branch name is required');
  }

  const branchName = args[0];
  
  const result = await gitManager.checkout(mcpContext.currentProject, branchName);
  
  return {
    success: result.success,
    message: result.message
  };
}

/**
 * Handler pour git-merge - Fusionne une branche dans la branche courante
 */
async function handleGitMerge(args) {
  logToConsole('info', `Exécution de git-merge avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('Branch name is required');
  }

  const branchName = args[0];
  
  const result = await gitManager.merge(mcpContext.currentProject, branchName);
  
  return {
    success: result.success,
    message: result.message,
    result: result.result
  };
}

/**
 * Handler pour git-log - Affiche l'historique des commits
 */
async function handleGitLog(args) {
  logToConsole('info', `Exécution de git-log avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  const maxCount = args.length > 0 ? parseInt(args[0], 10) : 10;
  
  const result = await gitManager.getHistory(mcpContext.currentProject, maxCount);
  
  return {
    success: result.success,
    history: result.history
  };
}

/**
 * Handler pour git-clone - Clone un dépôt distant
 */
async function handleGitClone(args) {
  logToConsole('info', `Exécution de git-clone avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 2) {
    throw new Error('Repository URL and project name are required');
  }

  const remoteUrl = args[0];
  const projectName = args[1];
  
  const result = await gitManager.clone(projectName, remoteUrl);
  
  if (result.success) {
    // Mettre à jour le contexte
    mcpContext.currentProject = projectName;
  }
  
  return {
    success: result.success,
    message: result.message
  };
}

/**
 * Handler pour git-diff - Affiche les différences pour un fichier ou pour tout le projet
 */
async function handleGitDiff(args) {
  logToConsole('info', `Exécution de git-diff avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  const filePath = args.length > 0 ? args[0] : null;
  
  const result = filePath 
    ? await gitManager.getDiff(mcpContext.currentProject, filePath)
    : await gitManager.getDiff(mcpContext.currentProject);
  
  return {
    success: result.success,
    filePath: result.filePath,
    diff: result.diff
  };
}

module.exports = {
  init,
  handleGitInit,
  handleGitCommit,
  handleGitPush,
  handleGitPull,
  handleGitStatus,
  handleGitRemote,
  handleGitBranch,
  handleGitCheckout,
  handleGitMerge,
  handleGitLog,
  handleGitClone,
  handleGitDiff
};