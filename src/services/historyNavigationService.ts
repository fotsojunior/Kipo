// Service de gestion de l'historique et du bouton retour mobile (Android & Web)
// Empêche l'application de se fermer lors d'un appui sur le bouton retour du téléphone
// et ramène fidèlement l'utilisateur à la page, modal ou vue précédente.

export type BackHandler = () => boolean;

interface RegisteredHandler {
  id: string;
  priority: number; // Plus la priorité est haute, plus le gestionnaire est exécuté en premier
  handler: BackHandler;
}

class HistoryNavigationService {
  private handlers: RegisteredHandler[] = [];
  private tabHistory: string[] = ['duolingo'];
  private isPopStateEvent = false;
  private lastBackPressTime = 0;
  private exitToastCallback: ((message: string) => void) | null = null;
  private initialized = false;

  public init(onExitNotice?: (message: string) => void) {
    if (this.initialized) return;
    this.initialized = true;
    this.exitToastCallback = onExitNotice || null;

    // Prépare l'historique initial du navigateur
    try {
      window.history.replaceState({ kipo: true, tab: 'duolingo', depth: 0 }, '', window.location.pathname);
      // Pousse un état de garde pour intercepter le premier appui retour sans quitter l'app
      window.history.pushState({ kipo: true, tab: 'duolingo', depth: 1 }, '', window.location.pathname);
    } catch (err) {
      console.warn('[History] Erreur init history:', err);
    }

    window.addEventListener('popstate', this.handlePopState);
  }

  public setExitNoticeCallback(cb: (message: string) => void) {
    this.exitToastCallback = cb;
  }

  // Enregistre un gestionnaire d'interception (ex: fermer une modale, quitter une leçon en cours)
  // Retourne une fonction de désinscription
  public registerHandler(id: string, priority: number, handler: BackHandler): () => void {
    // Supprime un éventuel doublon
    this.handlers = this.handlers.filter((h) => h.id !== id);
    this.handlers.push({ id, priority, handler });
    // Trie par priorité décroissante
    this.handlers.sort((a, b) => b.priority - a.priority);

    // Lorsqu'une modale ou sous-vue s'ouvre, on ajoute un état d'historique
    try {
      window.history.pushState({ kipo: true, handlerId: id, timestamp: Date.now() }, '', window.location.pathname);
    } catch {}

    return () => {
      this.handlers = this.handlers.filter((h) => h.id !== id);
    };
  }

  // Enregistre un changement d'onglet dans l'historique
  public onTabChanged(newTab: string) {
    if (this.isPopStateEvent) return;

    const currentTab = this.tabHistory[this.tabHistory.length - 1];
    if (currentTab !== newTab) {
      this.tabHistory.push(newTab);
      // Limite la taille de l'historique en mémoire
      if (this.tabHistory.length > 50) {
        this.tabHistory.shift();
      }

      try {
        window.history.pushState(
          { kipo: true, tab: newTab, depth: this.tabHistory.length },
          '',
          window.location.pathname
        );
      } catch {}
    }
  }

  // Gestionnaire de l'événement popstate du navigateur / téléphone
  private handlePopState = (event: PopStateEvent) => {
    this.isPopStateEvent = true;

    try {
      // 1. Exécute les gestionnaires enregistrés par ordre de priorité
      for (const item of this.handlers) {
        try {
          const handled = item.handler();
          if (handled) {
            // L'action a été interceptée (ex: modale fermée ou quiz quitté)
            // On repousse un état pour continuer à protéger l'application
            window.history.pushState(
              { kipo: true, active: true, timestamp: Date.now() },
              '',
              window.location.pathname
            );
            return;
          }
        } catch (err) {
          console.error(`[History] Erreur handler ${item.id}:`, err);
        }
      }

      // 2. Si aucun gestionnaire n'a intercepté, on vérifie l'historique des onglets
      if (this.tabHistory.length > 1) {
        // Retire l'onglet actuel
        this.tabHistory.pop();
        const previousTab = this.tabHistory[this.tabHistory.length - 1];

        // Émet un événement pour que App.tsx change d'onglet
        window.dispatchEvent(
          new CustomEvent('kipo_navigate_tab_back', {
            detail: { tab: previousTab },
          })
        );

        // Maintient un état de garde
        window.history.pushState(
          { kipo: true, tab: previousTab, depth: this.tabHistory.length },
          '',
          window.location.pathname
        );
        return;
      }

      // 3. Si on est sur le premier écran ('duolingo') et que rien n'est ouvert :
      // Comportement standard Android pour éviter la fermeture accidentelle :
      const now = Date.now();
      if (now - this.lastBackPressTime < 2500) {
        // Deuxième appui rapide : l'utilisateur souhaite réellement quitter
        window.history.back();
      } else {
        // Premier appui : prévient l'utilisateur et retient l'application
        this.lastBackPressTime = now;
        if (this.exitToastCallback) {
          this.exitToastCallback('Appuyez à nouveau sur Retour pour quitter KIPO');
        }
        window.history.pushState({ kipo: true, tab: 'duolingo', depth: 1 }, '', window.location.pathname);
      }
    } finally {
      this.isPopStateEvent = false;
    }
  };

  public destroy() {
    window.removeEventListener('popstate', this.handlePopState);
    this.handlers = [];
    this.initialized = false;
  }
}

export const historyNavigationService = new HistoryNavigationService();
