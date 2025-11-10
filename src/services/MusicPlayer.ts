import Sound from 'react-native-sound';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

export type Track = {
  id: string;
  name: string;
  filename: string;
};

// For Android, files must be in android/app/src/main/res/raw/
// Filenames must be lowercase with underscores (no hyphens or extensions)
export const TRACKS: Track[] = [
  { id: '1', name: 'Cutie Japan Lofi', filename: 'cutie_japan_lofi' },
  { id: '2', name: 'Lofi Cafe', filename: 'lofi_cafe' },
  { id: '3', name: 'Lofi Girl Ambient', filename: 'lofi_girl' },
  { id: '4', name: 'Lofi Study Calm', filename: 'lofi_study' },
  { id: '5', name: 'Rainy Lofi City', filename: 'rainy_lofi_city' },
];

class MusicPlayerService {
  private currentSound: Sound | null = null;
  private currentTrackIndex: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 0.3; // 30% volume for background music

  play() {
    if (this.currentSound && this.isPlaying) {
      return;
    }

    if (this.currentSound && !this.isPlaying) {
      this.currentSound.play(this.onPlaybackEnd);
      this.isPlaying = true;
      return;
    }

    this.loadAndPlayTrack(this.currentTrackIndex);
  }

  pause() {
    if (this.currentSound && this.isPlaying) {
      this.currentSound.pause();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.currentSound) {
      this.currentSound.stop(() => {
        this.currentSound?.release();
        this.currentSound = null;
        this.isPlaying = false;
      });
    }
  }

  next() {
    const wasPlaying = this.isPlaying;
    this.currentTrackIndex = (this.currentTrackIndex + 1) % TRACKS.length;
    
    if (this.currentSound) {
      this.currentSound.stop(() => {
        this.currentSound?.release();
        this.currentSound = null;
        this.isPlaying = false;
        
        if (wasPlaying) {
          // Small delay to ensure clean transition
          setTimeout(() => {
            this.loadAndPlayTrack(this.currentTrackIndex);
          }, 50);
        }
      });
    } else if (wasPlaying) {
      this.loadAndPlayTrack(this.currentTrackIndex);
    }
  }

  previous() {
    const wasPlaying = this.isPlaying;
    this.currentTrackIndex = (this.currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    
    if (this.currentSound) {
      this.currentSound.stop(() => {
        this.currentSound?.release();
        this.currentSound = null;
        this.isPlaying = false;
        
        if (wasPlaying) {
          // Small delay to ensure clean transition
          setTimeout(() => {
            this.loadAndPlayTrack(this.currentTrackIndex);
          }, 50);
        }
      });
    } else if (wasPlaying) {
      this.loadAndPlayTrack(this.currentTrackIndex);
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentSound) {
      this.currentSound.setVolume(this.volume);
    }
  }

  getCurrentTrack(): Track {
    return TRACKS[this.currentTrackIndex];
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private loadAndPlayTrack(index: number) {
    const track = TRACKS[index];
    
    // Load from Android raw resources (pass empty string as basePath for raw folder)
    // For iOS, files would need to be in the app bundle
    this.currentSound = new Sound(track.filename, '', (error) => {
      if (error) {
        console.error('Failed to load track:', track.filename, error);
        this.isPlaying = false;
        return;
      }

      this.currentSound?.setVolume(this.volume);
      this.currentSound?.setNumberOfLoops(-1); // Loop indefinitely
      this.currentSound?.play(this.onPlaybackEnd);
      this.isPlaying = true;
    });
  }

  private onPlaybackEnd = (success: boolean) => {
    if (!success) {
      console.warn('Playback failed');
      this.isPlaying = false;
      return;
    }
    // Auto-play next track
    this.next();
  };
}

export const musicPlayer = new MusicPlayerService();
