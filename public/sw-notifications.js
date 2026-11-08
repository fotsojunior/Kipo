// ============================================================================
// Service Worker KIPO - Gestionnaire de Notifications en Arrière-Plan
// Permet d'afficher les rappels KIPO sur l'écran d'accueil
// même lorsque l'application ou l'onglet est fermé
// ============================================================================

// 1. Écoute de l'événement PUSH (Web Push distant)
self.addEventListener('push', (event) => {
  let payload = {
    title: '🦉 KIPO : C’est l’heure de s’entraîner !',
    body: '5 minutes de révision pour préserver ta série de jours 🔥 !',
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: 'kipo-daily-reminder',
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: '/?tab=duolingo_path',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open_path', title: '⚡ S’entraîner (5 min)' },
      { action: 'dismiss', title: 'Plus tard' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// 2. Écoute de l'événement PERIODIC SYNC (Chromium Android & PWA en arrière-plan)
// Se déclenche même si l'application est totalement fermée
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'kipo-daily-reminder') {
    const messages = [
      {
        title: '🦉 KIPO : C’est l’heure de s’entraîner !',
        body: 'Tes 5 vies sont pleines ❤️ ! Fais une leçon rapide pour garder ta flamme active 🔥.',
      },
      {
        title: '🔥 Alerte Série KIPO !',
        body: 'Ne brise pas ta série de victoires ! 5 petites questions t’attendent.',
      },
      {
        title: '✨ Défi quotidien disponible sur KIPO !',
        body: 'Gagne +30 XP aujourd’hui et poursuis ton ascension dans le classement !',
      },
      {
        title: '🦉 KIPO veille sur ton apprentissage',
        body: 'La régularité est le secret de la réussite. Prêt pour ta révision du jour ?',
      },
    ];

    const picked = messages[Math.floor(Math.random() * messages.length)];

    const options = {
      body: picked.body,
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
      tag: 'kipo-daily-reminder',
      renotify: true,
      vibrate: [150, 50, 150],
      data: {
        url: '/?tab=duolingo_path',
      },
      actions: [
        { action: 'open_path', title: '⚡ S’entraîner (5 min)' },
        { action: 'dismiss', title: 'Plus tard' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(picked.title, options)
    );
  }
});

// 3. Clic sur la notification sur l'écran d'accueil ou l'écran de verrouillage
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, on la ramène au premier plan
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE_TAB', tab: 'duolingo_path' });
          return;
        }
      }
      // Sinon on ouvre l'application KIPO en plein écran PWA
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 4. Réception de messages envoyés par l'application pour planification en arrière-plan
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_BACKGROUND_NOTIFICATION') {
    const { title, body, options } = event.data;
    self.registration.showNotification(title, {
      body: body || 'C’est l’heure de ta révision quotidienne !',
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
      tag: 'kipo-daily-reminder',
      renotify: true,
      vibrate: [100, 50, 100],
      data: { url: '/?tab=duolingo_path' },
      ...options,
    });
  }
});
