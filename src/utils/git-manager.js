/**
 * Gestionnaire Git - Module pour centraliser les opérations Git
 * Ce module fournit une interface simplifiée pour interagir avec Git
 */

const simpleGit = require('simple-git');
const fs = require('fs').promises;
const path = require('path');

class GitManager {
  constructor(projectsDir) {
    this.projectsDir = projectsDir;
    
    // Informations utilisateur par défaut pour les commits
    this.defaultUserName = 'VibeServer';
    this.defaultUserEmail = 'vibeserver@example.com';
  }

  /**
   * Initialise un nouveau dépôt Git
   * @param {string} projectName - Nom du projet
   * @param {string} description - Description du projet
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async initRepository(projectName, description) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      
      // Vérifier si le répertoire existe
      try {
        await fs.access(projectPath);
      } catch (error) {
        // Créer le répertoire s'il n'existe pas
        await fs.mkdir(projectPath, { recursive: true });
      }
      
      // Initialiser le dépôt Git
      const git = simpleGit(projectPath);
      await git.init();
      
      // Configurer l'utilisateur Git pour ce dépôt
      await git.addConfig('user.name', this.defaultUserName, false, 'local');
      await git.addConfig('user.email', this.defaultUserEmail, false, 'local');
      
      // Créer un fichier README.md par défaut
      const readmePath = path.join(projectPath, 'README.md');
      const readmeContent = `# ${projectName}\n\n${description || 'Projet créé avec VibeServer'}\n`;
      await fs.writeFile(readmePath, readmeContent, 'utf8');
      
      // Ajouter et committer le README
      await git.add('README.md');
      await git.commit(`Initialisation du projet ${projectName}`);
      
      // Créer un fichier .gitignore par défaut
      const gitignorePath = path.join(projectPath, '.gitignore');
      const gitignoreContent = `# Fichiers système\n.DS_Store\nThumbs.db\n\n# Dossiers de dépendances\nnode_modules/\nvenv/\n\n# Fichiers de configuration locaux\n.env\n.env.local\n\n# Fichiers de build et cache\ndist/\nbuild/\n.cache/\n`;
      await fs.writeFile(gitignorePath, gitignoreContent, 'utf8');
      
      // Ajouter et committer le .gitignore
      await git.add('.gitignore');
      await git.commit('Ajout du fichier .gitignore');
      
      // Créer un fichier de configuration VibeServer
      const configPath = path.join(projectPath, '.vibeserver.json');
      const configContent = JSON.stringify({
        name: projectName,
        description: description || '',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        gitEnabled: true
      }, null, 2);
      await fs.writeFile(configPath, configContent, 'utf8');
      
      // Ajouter et committer le fichier de configuration
      await git.add('.vibeserver.json');
      await git.commit('Ajout de la configuration VibeServer');
      
      return { 
        success: true, 
        message: `Dépôt Git initialisé pour le projet '${projectName}'` 
      };
    } catch (error) {
      console.error(`Erreur lors de l'initialisation du dépôt Git:`, error);
      return { 
        success: false, 
        message: `Erreur lors de l'initialisation du dépôt Git: ${error.message}` 
      };
    }
  }

  /**
   * Ajoute un fichier au dépôt Git et le stage pour le commit
   * @param {string} projectName - Nom du projet
   * @param {string} filePath - Chemin du fichier
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async addFile(projectName, filePath) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      await git.add(filePath);
      
      return { 
        success: true, 
        message: `Fichier '${filePath}' ajouté au staging` 
      };
    } catch (error) {
      console.error(`Erreur lors de l'ajout du fichier:`, error);
      return { 
        success: false, 
        message: `Erreur lors de l'ajout du fichier: ${error.message}` 
      };
    }
  }

  /**
   * Crée un commit avec les fichiers actuellement stagés
   * @param {string} projectName - Nom du projet
   * @param {string} message - Message de commit
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async commit(projectName, message) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      // Vérifier s'il y a des modifications à committer
      const status = await git.status();
      
      if (status.staged.length === 0 && status.not_added.length === 0 && status.modified.length === 0) {
        return { 
          success: true, 
          message: 'Aucune modification à committer' 
        };
      }
      
      // Stage tous les fichiers modifiés si aucun n'est déjà stagé
      if (status.staged.length === 0 && (status.not_added.length > 0 || status.modified.length > 0)) {
        await git.add('.');
      }
      
      // Créer le commit
      const commitResult = await git.commit(message);
      
      return { 
        success: true, 
        message: `Commit créé avec le message: ${message}`,
        commitHash: commitResult.commit
      };
    } catch (error) {
      console.error(`Erreur lors de la création du commit:`, error);
      return { 
        success: false, 
        message: `Erreur lors de la création du commit: ${error.message}` 
      };
    }
  }

  /**
   * Configure un dépôt distant pour le projet
   * @param {string} projectName - Nom du projet
   * @param {string} remoteUrl - URL du dépôt distant
   * @param {string} remoteName - Nom du dépôt distant (par défaut: origin)
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async setRemote(projectName, remoteUrl, remoteName = 'origin') {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      // Vérifier si le remote existe déjà
      const remotes = await git.getRemotes();
      const remoteExists = remotes.some(remote => remote.name === remoteName);
      
      if (remoteExists) {
        // Mettre à jour le remote existant
        await git.remote(['set-url', remoteName, remoteUrl]);
      } else {
        // Ajouter un nouveau remote
        await git.remote(['add', remoteName, remoteUrl]);
      }
      
      return { 
        success: true, 
        message: `Dépôt distant '${remoteName}' configuré avec l'URL: ${remoteUrl}` 
      };
    } catch (error) {
      console.error(`Erreur lors de la configuration du dépôt distant:`, error);
      return { 
        success: false, 
        message: `Erreur lors de la configuration du dépôt distant: ${error.message}` 
      };
    }
  }

  /**
   * Pousse les commits locaux vers le dépôt distant
   * @param {string} projectName - Nom du projet
   * @param {string} remoteName - Nom du dépôt distant (par défaut: origin)
   * @param {string} branch - Nom de la branche (par défaut: main)
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async push(projectName, remoteName = 'origin', branch = 'main') {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      // Vérifier si le remote existe
      const remotes = await git.getRemotes();
      const remoteExists = remotes.some(remote => remote.name === remoteName);
      
      if (!remoteExists) {
        return { 
          success: false, 
          message: `Dépôt distant '${remoteName}' non configuré. Utilisez setRemote d'abord.` 
        };
      }
      
      // Pousser les commits
      await git.push(remoteName, branch);
      
      return { 
        success: true, 
        message: `Commits poussés vers ${remoteName}/${branch}` 
      };
    } catch (error) {
      console.error(`Erreur lors du push:`, error);
      return { 
        success: false, 
        message: `Erreur lors du push: ${error.message}` 
      };
    }
  }

  /**
   * Tire les changements du dépôt distant
   * @param {string} projectName - Nom du projet
   * @param {string} remoteName - Nom du dépôt distant (par défaut: origin)
   * @param {string} branch - Nom de la branche (par défaut: main)
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async pull(projectName, remoteName = 'origin', branch = 'main') {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      // Pull des changements
      const pullResult = await git.pull(remoteName, branch);
      
      return { 
        success: true, 
        message: `Changements tirés depuis ${remoteName}/${branch}`,
        summary: pullResult.summary
      };
    } catch (error) {
      console.error(`Erreur lors du pull:`, error);
      return { 
        success: false, 
        message: `Erreur lors du pull: ${error.message}` 
      };
    }
  }

  /**
   * Crée une nouvelle branche
   * @param {string} projectName - Nom du projet
   * @param {string} branchName - Nom de la branche à créer
   * @param {boolean} checkout - Si true, se positionne sur la nouvelle branche
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async createBranch(projectName, branchName, checkout = true) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      if (checkout) {
        // Créer et se positionner sur la nouvelle branche
        await git.checkoutLocalBranch(branchName);
      } else {
        // Juste créer la branche sans se positionner dessus
        await git.branch([branchName]);
      }
      
      return { 
        success: true, 
        message: `Branche '${branchName}' créée${checkout ? ' et sélectionnée' : ''}` 
      };
    } catch (error) {
      console.error(`Erreur lors de la création de la branche:`, error);
      return { 
        success: false, 
        message: `Erreur lors de la création de la branche: ${error.message}` 
      };
    }
  }

  /**
   * Change de branche
   * @param {string} projectName - Nom du projet
   * @param {string} branchName - Nom de la branche
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async checkout(projectName, branchName) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      await git.checkout(branchName);
      
      return { 
        success: true, 
        message: `Changé vers la branche '${branchName}'` 
      };
    } catch (error) {
      console.error(`Erreur lors du changement de branche:`, error);
      return { 
        success: false, 
        message: `Erreur lors du changement de branche: ${error.message}` 
      };
    }
  }

  /**
   * Fusionne une branche dans la branche courante
   * @param {string} projectName - Nom du projet
   * @param {string} branchName - Nom de la branche à fusionner
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async merge(projectName, branchName) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      // Obtenir la branche courante
      const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
      
      // Fusionner la branche
      const mergeResult = await git.merge([branchName]);
      
      return { 
        success: true, 
        message: `Branche '${branchName}' fusionnée dans '${currentBranch}'`,
        result: mergeResult
      };
    } catch (error) {
      console.error(`Erreur lors de la fusion de branches:`, error);
      return { 
        success: false, 
        message: `Erreur lors de la fusion de branches: ${error.message}` 
      };
    }
  }

  /**
   * Obtient l'historique des commits
   * @param {string} projectName - Nom du projet
   * @param {number} maxCount - Nombre maximum de commits à récupérer
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async getHistory(projectName, maxCount = 10) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      const logOptions = {
        '--max-count': maxCount,
        '--pretty': 'format:%H|%an|%ad|%s'
      };
      
      const logs = await git.log(logOptions);
      
      // Formatter les logs pour un affichage plus lisible
      const history = logs.all.map(commit => ({
        hash: commit.hash,
        author: commit.author_name,
        date: commit.date,
        message: commit.message
      }));
      
      return { 
        success: true, 
        history
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique:`, error);
      return { 
        success: false, 
        message: `Erreur lors de la récupération de l'historique: ${error.message}` 
      };
    }
  }

  /**
   * Obtient les différences pour un fichier
   * @param {string} projectName - Nom du projet
   * @param {string} filePath - Chemin du fichier
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async getDiff(projectName, filePath) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      const diff = await git.diff([filePath]);
      
      return { 
        success: true, 
        filePath,
        diff
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des différences:`, error);
      return { 
        success: false, 
        message: `Erreur lors de la récupération des différences: ${error.message}` 
      };
    }
  }

  /**
   * Obtient le statut du dépôt
   * @param {string} projectName - Nom du projet
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async getStatus(projectName) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      const status = await git.status();
      
      return { 
        success: true, 
        currentBranch: status.current,
        staged: status.staged,
        modified: status.modified,
        deleted: status.deleted,
        untracked: status.not_added,
        isClean: status.isClean()
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération du statut:`, error);
      return { 
        success: false, 
        message: `Erreur lors de la récupération du statut: ${error.message}` 
      };
    }
  }
  
  /**
   * Obtient la liste des branches
   * @param {string} projectName - Nom du projet
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async getBranches(projectName) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      const git = simpleGit(projectPath);
      
      const branchSummary = await git.branch();
      
      return { 
        success: true, 
        current: branchSummary.current,
        all: branchSummary.all,
        branches: branchSummary.branches
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des branches:`, error);
      return { 
        success: false, 
        message: `Erreur lors de la récupération des branches: ${error.message}` 
      };
    }
  }
  
  /**
   * Clone un dépôt distant
   * @param {string} projectName - Nom du projet
   * @param {string} remoteUrl - URL du dépôt distant
   * @returns {Promise<object>} - Résultat de l'opération
   */
  async clone(projectName, remoteUrl) {
    try {
      const projectPath = path.join(this.projectsDir, projectName);
      
      // Vérifier si le répertoire existe déjà
      try {
        await fs.access(projectPath);
        return {
          success: false,
          message: `Le projet '${projectName}' existe déjà`
        };
      } catch (error) {
        // Le répertoire n'existe pas, nous pouvons continuer
      }
      
      // Créer le répertoire parent si nécessaire
      await fs.mkdir(this.projectsDir, { recursive: true });
      
      // Cloner le dépôt
      const git = simpleGit();
      await git.clone(remoteUrl, projectPath);
      
      // Créer un fichier de configuration VibeServer
      const configPath = path.join(projectPath, '.vibeserver.json');
      const configContent = JSON.stringify({
        name: projectName,
        description: `Projet cloné depuis ${remoteUrl}`,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        gitEnabled: true,
        remoteUrl
      }, null, 2);
      await fs.writeFile(configPath, configContent, 'utf8');
      
      // Ajouter et committer le fichier de configuration
      const projectGit = simpleGit(projectPath);
      await projectGit.add('.vibeserver.json');
      await projectGit.commit('Ajout de la configuration VibeServer');
      
      return { 
        success: true, 
        message: `Dépôt cloné avec succès dans '${projectName}'` 
      };
    } catch (error) {
      console.error(`Erreur lors du clonage du dépôt:`, error);
      return { 
        success: false, 
        message: `Erreur lors du clonage du dépôt: ${error.message}` 
      };
    }
  }
}

module.exports = GitManager;