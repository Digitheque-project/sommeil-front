// Même fichier son que côté pharmacie (public/sounds/new-notification.mp3),
// copié tel quel pour garder un son de notification identique entre les deux
// applications du CHU.
const NOTIFICATION_SOUND_SRC = "/sounds/new-notification.mp3";

// Un seul <audio> partagé, créé paresseusement au premier appel (jamais côté
// serveur, où `Audio` n'existe pas) plutôt que d'en recréer un à chaque appel.
let notificationAudio: HTMLAudioElement | null = null;

export function playNotificationSound(volume = 0.6) {
  if (typeof window === "undefined") return;
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio(NOTIFICATION_SOUND_SRC);
    }
    notificationAudio.volume = volume;
    notificationAudio.currentTime = 0;
    void notificationAudio.play().catch(() => {
      // Lecture bloquée (pas encore d'interaction utilisateur sur la page)
      // -- non bloquant, la notification est déjà affichée par ailleurs.
    });
  } catch {
    // Best effort -- un son manqué ne doit jamais faire échouer autre chose.
  }
}
