/**
 * git-manager.js
 * 
 * Module de gestion Git qui centralise toutes les opérations Git
 * pour les projets VibeServer.
 */

const path = require('path');
const { simpleGit } = require('simple-git');
const fs = require('fs').promises;

// Chemin de base des projets
const PROJECTS_DIR = path.join(__dirname, '../../projects');

/**
 * Initialise un dépôt Git dans un projet si nécessaire
 * @param {string} projectName - Nom du projet
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function initRepo(projectName) {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est déjà un repo git
    const isRepo = await isGitRepo(projectName);
    
    if (!isRepo) {
      await git.init();
      return {
        success: true,
        message: `Dépôt Git initialisé dans le projet '${projectName}'`
      };
    }
    
    return {
      success: true,
      message: `Le projet '${projectName}' est déjà un dépôt Git`
    };
  } catch (error) {
    console.error(`Erreur lors de l'initialisation du dépôt Git:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Vérifie si un projet est un dépôt Git
 * @param {string} projectName - Nom du projet
 * @returns {Promise<boolean>} - True si c'est un dépôt Git
 */
async function isGitRepo(projectName) {
  try {
    const projectPath = getProjectPath(projectName);
    const gitPath = path.join(projectPath, '.git');
    
    try {
      await fs.access(gitPath);
      return true;
    } catch (error) {
      return false;
    }
  } catch (error) {
    console.error(`Erreur lors de la vérification du dépôt Git:`, error);
    return false;
  }
}

/**
 * Obtient le chemin absolu d'un projet
 * @param {string} projectName - Nom du projet
 * @returns {string} - Chemin absolu du projet
 */
function getProjectPath(projectName) {
  return path.join(PROJECTS_DIR, projectName);
}

/**
 * Crée un commit avec les changements actuels
 * @param {string} projectName - Nom du projet
 * @param {string} message - Message de commit
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function commit(projectName, message) {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est un repo git
    const isRepo = await isGitRepo(projectName);
    if (!isRepo) {
      await initRepo(projectName);
    }
    
    // Vérifier s'il y a des changements
    const status = await git.status();
    
    if (status.isClean()) {
      return {
        success: true,
        message: 'Aucune modification à committer'
      };
    }
    
    // Ajouter tous les fichiers
    await git.add('.');
    
    // Créer le commit
    const result = await git.commit(message);
    
    return {
      success: true,
      message: `Commit créé avec succès: ${result.commit}`,
      details: {
        commit: result.commit,
        branch: result.branch,
        summary: result.summary
      }
    };
  } catch (error) {
    console.error(`Erreur lors de la création du commit:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Liste les branches du dépôt
 * @param {string} projectName - Nom du projet
 * @returns {Promise<Object>} - Résultat de l'opération avec la liste des branches
 */
async function listBranches(projectName) {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est un repo git
    const isRepo = await isGitRepo(projectName);
    if (!isRepo) {
      return {
        success: false,
        error: `Le projet '${projectName}' n'est pas un dépôt Git`
      };
    }
    
    const branchesResult = await git.branch();
    
    return {
      success: true,
      branches: branchesResult.all,
      current: branchesResult.current
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération des branches:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Crée une nouvelle branche
 * @param {string} projectName - Nom du projet
 * @param {string} branchName - Nom de la branche à créer
 * @param {boolean} checkout - Si true, se positionne sur la nouvelle branche
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function createBranch(projectName, branchName, checkout = true) {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est un repo git
    const isRepo = await isGitRepo(projectName);
    if (!isRepo) {
      return {
        success: false,
        error: `Le projet '${projectName}' n'est pas un dépôt Git`
      };
    }
    
    // Vérifier si la branche existe déjà
    const branches = await git.branch();
    if (branches.all.includes(branchName)) {
      return {
        success: false,
        error: `La branche '${branchName}' existe déjà`
      };
    }
    
    // Créer la branche
    await git.checkoutLocalBranch(branchName);
    
    // Si checkout est false, revenir à la branche précédente
    if (!checkout) {
      await git.checkout(branches.current);
    }
    
    return {
      success: true,
      message: `Branche '${branchName}' créée avec succès`,
      checkout: checkout ? `Positionné sur la branche '${branchName}'` : `Retour à la branche '${branches.current}'`
    };
  } catch (error) {
    console.error(`Erreur lors de la création de la branche:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Change de branche
 * @param {string} projectName - Nom du projet
 * @param {string} branchName - Nom de la branche cible
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function checkout(projectName, branchName) {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est un repo git
    const isRepo = await isGitRepo(projectName);
    if (!isRepo) {
      return {
        success: false,
        error: `Le projet '${projectName}' n'est pas un dépôt Git`
      };
    }
    
    // Vérifier si la branche existe
    const branches = await git.branch();
    if (!branches.all.includes(branchName)) {
      return {
        success: false,
        error: `La branche '${branchName}' n'existe pas`
      };
    }
    
    // Vérifier s'il y a des changements non commités
    const status = await git.status();
    if (!status.isClean()) {
      return {
        success: false,
        error: `Il y a des modifications non committées. Veuillez committer ou stash vos changements d'abord.`
      };
    }
    
    // Changer de branche
    await git.checkout(branchName);
    
    return {
      success: true,
      message: `Changement vers la branche '${branchName}' effectué`
    };
  } catch (error) {
    console.error(`Erreur lors du changement de branche:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Configure un dépôt distant
 * @param {string} projectName - Nom du projet
 * @param {string} remoteUrl - URL du dépôt distant
 * @param {string} remoteName - Nom du dépôt distant (par défaut: origin)
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function setRemote(projectName, remoteUrl, remoteName = 'origin') {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est un repo git
    const isRepo = await isGitRepo(projectName);
    if (!isRepo) {
      await initRepo(projectName);
    }
    
    // Vérifier si le remote existe déjà
    const remotes = await git.getRemotes();
    const existingRemote = remotes.find(remote => remote.name === remoteName);
    
    if (existingRemote) {
      // Mettre à jour le remote
      await git.remote(['set-url', remoteName, remoteUrl]);
      return {
        success: true,
        message: `Dépôt distant '${remoteName}' mis à jour vers ${remoteUrl}`
      };
    } else {
      // Ajouter le nouveau remote
      await git.remote(['add', remoteName, remoteUrl]);
      return {
        success: true,
        message: `Dépôt distant '${remoteName}' ajouté avec l'URL ${remoteUrl}`
      };
    }
  } catch (error) {
    console.error(`Erreur lors de la configuration du dépôt distant:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Pousse les changements vers un dépôt distant
 * @param {string} projectName - Nom du projet
 * @param {string} remoteName - Nom du dépôt distant (par défaut: origin)
 * @param {string} branchName - Nom de la branche à pousser (par défaut: branche courante)
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function push(projectName, remoteName = 'origin', branchName = null) {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est un repo git
    const isRepo = await isGitRepo(projectName);
    if (!isRepo) {
      return {
        success: false,
        error: `Le projet '${projectName}' n'est pas un dépôt Git`
      };
    }
    
    // Vérifier si le remote existe
    const remotes = await git.getRemotes();
    if (!remotes.find(remote => remote.name === remoteName)) {
      return {
        success: false,
        error: `Le dépôt distant '${remoteName}' n'existe pas`
      };
    }
    
    // Si aucune branche n'est spécifiée, utiliser la branche courante
    if (!branchName) {
      const branches = await git.branch();
      branchName = branches.current;
    }
    
    // Pousser les changements
    await git.push(remoteName, branchName);
    
    return {
      success: true,
      message: `Changements poussés avec succès vers ${remoteName}/${branchName}`
    };
  } catch (error) {
    console.error(`Erreur lors du push:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Récupère les changements depuis un dépôt distant
 * @param {string} projectName - Nom du projet
 * @param {string} remoteName - Nom du dépôt distant (par défaut: origin)
 * @param {string} branchName - Nom de la branche à tirer (par défaut: branche courante)
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function pull(projectName, remoteName = 'origin', branchName = null) {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est un repo git
    const isRepo = await isGitRepo(projectName);
    if (!isRepo) {
      return {
        success: false,
        error: `Le projet '${projectName}' n'est pas un dépôt Git`
      };
    }
    
    // Vérifier si le remote existe
    const remotes = await git.getRemotes();
    if (!remotes.find(remote => remote.name === remoteName)) {
      return {
        success: false,
        error: `Le dépôt distant '${remoteName}' n'existe pas`
      };
    }
    
    // Si aucune branche n'est spécifiée, utiliser la branche courante
    if (!branchName) {
      const branches = await git.branch();
      branchName = branches.current;
    }
    
    // Tirer les changements
    const pullResult = await git.pull(remoteName, branchName);
    
    return {
      success: true,
      message: `Changements récupérés avec succès depuis ${remoteName}/${branchName}`,
      details: pullResult
    };
  } catch (error) {
    console.error(`Erreur lors du pull:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Clone un dépôt Git distant dans le dossier des projets
 * @param {string} repoUrl - URL du dépôt à cloner
 * @param {string} projectName - Nom à donner au projet (optionnel, dérivé de l'URL si non fourni)
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function cloneRepo(repoUrl, projectName = null) {
  try {
    // Si aucun nom de projet n'est fourni, extraire le nom du dépôt de l'URL
    if (!projectName) {
      // Extraire le nom du dépôt de l'URL
      const repoName = repoUrl.split('/').pop().replace('.git', '');
      projectName = repoName;
    }
    
    const projectPath = getProjectPath(projectName);
    
    // Vérifier si le dossier existe déjà
    try {
      await fs.access(projectPath);
      return {
        success: false,
        error: `Le projet '${projectName}' existe déjà`
      };
    } catch (error) {
      // Le dossier n'existe pas, c'est ce qu'on veut
    }
    
    // Cloner le dépôt
    const git = simpleGit();
    await git.clone(repoUrl, projectPath);
    
    return {
      success: true,
      message: `Dépôt '${repoUrl}' cloné avec succès dans le projet '${projectName}'`
    };
  } catch (error) {
    console.error(`Erreur lors du clonage du dépôt:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Obtient l'historique des commits
 * @param {string} projectName - Nom du projet
 * @param {number} maxCount - Nombre maximum de commits à récupérer (par défaut: 10)
 * @returns {Promise<Object>} - Résultat de l'opération avec la liste des commits
 */
async function getCommitHistory(projectName, maxCount = 10) {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est un repo git
    const isRepo = await isGitRepo(projectName);
    if (!isRepo) {
      return {
        success: false,
        error: `Le projet '${projectName}' n'est pas un dépôt Git`
      };
    }
    
    // Récupérer l'historique
    const logOptions = [
      `--max-count=${maxCount}`,
      '--date=iso',
      '--pretty=format:{"hash":"%h","date":"%ad","message":"%s","author":"%an","email":"%ae"}'
    ];
    
    const result = await git.log(logOptions);
    
    // Le format personnalisé retourne un string qui doit être parsé
    const logs = result.all.map(commit => {
      try {
        return JSON.parse(commit.hash);
      } catch (e) {
        return {
          hash: commit.hash,
          date: commit.date,
          message: commit.message,
          author: commit.author_name,
          email: commit.author_email
        };
      }
    });
    
    return {
      success: true,
      history: logs
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'historique:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

/**
 * Obtient le statut du dépôt
 * @param {string} projectName - Nom du projet
 * @returns {Promise<Object>} - Résultat de l'opération avec le statut
 */
async function getStatus(projectName) {
  try {
    const projectPath = getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Vérifier si c'est un repo git
    const isRepo = await isGitRepo(projectName);
    if (!isRepo) {
      return {
        success: false,
        error: `Le projet '${projectName}' n'est pas un dépôt Git`
      };
    }
    
    // Récupérer le statut
    const status = await git.status();
    
    return {
      success: true,
      isClean: status.isClean(),
      current: status.current,
      tracking: status.tracking,
      created: status.created,
      modified: status.modified,
      deleted: status.deleted,
      renamed: status.renamed,
      conflicted: status.conflicted
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération du statut:`, error);
    return {
      success: false,
      error: `Erreur Git: ${error.message}`
    };
  }
}

module.exports = {
  initRepo,
  isGitRepo,
  commit,
  listBranches,
  createBranch,
  checkout,
  setRemote,
  push,
  pull,
  cloneRepo,
  getCommitHistory,
  getStatus
};
