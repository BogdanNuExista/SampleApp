import Sound from 'react-native-sound';

Sound.setCategory('Playback');

// One-shot UI sound effects. Files live in android/app/src/main/res/raw/
// (lowercase, underscores, no extension when referenced).
export type SfxName = 'coin' | 'correct' | 'wrong' | 'win' | 'levelup';

const FILES: Record<SfxName, string> = {
  coin: 'sfx_coin',
  correct: 'sfx_correct',
  wrong: 'sfx_wrong',
  win: 'sfx_win',
  levelup: 'sfx_levelup',
};

class SoundEffectsService {
  private cache: Partial<Record<SfxName, Sound>> = {};
  private enabled = true;
  private volume = 0.6;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Pre-load all effects so the first play has no latency.
  preload() {
    (Object.keys(FILES) as SfxName[]).forEach(name => {
      if (this.cache[name]) {
        return;
      }
      const sound = new Sound(FILES[name], '', error => {
        if (error) {
          console.warn('Failed to load sfx', name, error);
          return;
        }
        sound.setVolume(this.volume);
      });
      this.cache[name] = sound;
    });
  }

  play(name: SfxName) {
    if (!this.enabled) {
      return;
    }
    const existing = this.cache[name];
    if (existing) {
      // Rewind so rapid repeats always play from the start.
      existing.stop(() => existing.play());
      return;
    }
    // Lazy-load then play if it wasn't preloaded.
    const sound = new Sound(FILES[name], '', error => {
      if (error) {
        console.warn('Failed to load sfx', name, error);
        return;
      }
      sound.setVolume(this.volume);
      sound.play();
    });
    this.cache[name] = sound;
  }
}

export const soundEffects = new SoundEffectsService();
