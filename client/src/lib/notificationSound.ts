// Notification Sound Manager
class NotificationSoundManager {
  private audio: HTMLAudioElement | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize audio element
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/sounds/notification.mp3');
      this.audio.volume = 0.5; // 50% volume
      
      // Load from localStorage
      const savedPreference = localStorage.getItem('notificationSoundEnabled');
      this.enabled = savedPreference !== 'false';
    }
  }

  play() {
    if (this.enabled && this.audio) {
      // Reset audio to start if already playing
      this.audio.currentTime = 0;
      this.audio.play().catch(err => {
        console.warn('Failed to play notification sound:', err);
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('notificationSoundEnabled', String(enabled));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

export const notificationSound = new NotificationSoundManager();
