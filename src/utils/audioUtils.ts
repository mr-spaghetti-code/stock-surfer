// Audio utilities for the game

// Singleton audio player to ensure we only have one instance of each sound
class AudioPlayer {
  private static instance: AudioPlayer;
  private audioElements: Map<string, HTMLAudioElement> = new Map();

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): AudioPlayer {
    if (!AudioPlayer.instance) {
      AudioPlayer.instance = new AudioPlayer();
    }
    return AudioPlayer.instance;
  }

  // Load an audio file
  public loadAudio(id: string, src: string): void {
    if (!this.audioElements.has(id)) {
      const audio = new Audio(src);
      this.audioElements.set(id, audio);
    }
  }

  // Play audio with options
  public playAudio(
    id: string,
    options: { loop?: boolean; volume?: number; playbackRate?: number } = {},
  ): void {
    const audio = this.audioElements.get(id);
    if (audio) {
      audio.loop = options.loop ?? false;
      audio.volume = options.volume ?? 1.0;

      // Set playback rate if provided
      if (options.playbackRate !== undefined) {
        audio.playbackRate = options.playbackRate;
      }

      // Reset the audio to the beginning if it's already playing
      audio.currentTime = 0;

      // Play the audio
      audio.play().catch((error) => {
        console.error(`Error playing audio ${id}:`, error);
      });
    } else {
      console.warn(`Audio ${id} not found`);
    }
  }

  // Stop audio
  public stopAudio(id: string): void {
    const audio = this.audioElements.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // Pause audio without resetting position
  public pauseAudio(id: string): void {
    const audio = this.audioElements.get(id);
    if (audio) {
      audio.pause();
    }
  }

  // Resume audio from current position
  public resumeAudio(id: string): void {
    const audio = this.audioElements.get(id);
    if (audio) {
      audio.play().catch((error) => {
        console.error(`Error resuming audio ${id}:`, error);
      });
    }
  }

  // Set volume (0.0 to 1.0)
  public setVolume(id: string, volume: number): void {
    const audio = this.audioElements.get(id);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // Set playback rate (1.0 is normal speed)
  public setPlaybackRate(id: string, rate: number): void {
    const audio = this.audioElements.get(id);
    if (audio) {
      // Clamp the rate to a reasonable range (0.5 to 2.0)
      audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    }
  }

  // Get the current audio element (for advanced operations)
  public getAudio(id: string): HTMLAudioElement | undefined {
    return this.audioElements.get(id);
  }
}

// Export a singleton instance
export const audioPlayer = AudioPlayer.getInstance();

// Constants for audio IDs
export const AUDIO = {
  GAME_MUSIC: 'game_music',
};

// Initialize audio files
export const initAudio = (): void => {
  audioPlayer.loadAudio(AUDIO.GAME_MUSIC, '/sounds/chelnov.mp3');
};
