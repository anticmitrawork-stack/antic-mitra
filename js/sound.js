/**
 * Antic Mitra - Sound Experience Engine
 * Pure Web Audio API Synthesizer (Zero external dependencies, instant response)
 * Cheerful, soft, optimistic audio feedback matching the Antic Mitra brand.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.masterGain = null;
    
    // Check saved preference
    const saved = localStorage.getItem('antic_mitra_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.18, this.audioCtx.currentTime); // Gentle, subtle volume
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound() {
    this.init();
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('antic_mitra_sound_enabled', this.soundEnabled);
    if (this.soundEnabled) {
      this.playToggle(true);
    }
    this.updateSoundButtons();
    return this.soundEnabled;
  }

  updateSoundButtons() {
    const btns = document.querySelectorAll('.sound-toggle-btn');
    btns.forEach(btn => {
      if (this.soundEnabled) {
        btn.classList.add('sound-active');
        btn.setAttribute('aria-label', 'Sound is ON. Click to mute.');
        const label = btn.querySelector('.sound-label');
        if (label) label.textContent = 'Sound ON';
        const icon = btn.querySelector('.sound-icon-state');
        if (icon) icon.innerHTML = '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
      } else {
        btn.classList.remove('sound-active');
        btn.setAttribute('aria-label', 'Sound is MUTED. Click to enable.');
        const label = btn.querySelector('.sound-label');
        if (label) label.textContent = 'Muted';
        const icon = btn.querySelector('.sound-icon-state');
        if (icon) icon.innerHTML = '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
      }
    });
  }

  // Soft pleasant click/pop
  playClick() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  // Soft hover tick
  playHover() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.linearRampToValueAtTime(720, now + 0.03);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // Cheerful tab switch / modal open
  playTab() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      [523.25, 659.25].forEach((freq, i) => { // C5, E5
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        gain.gain.setValueAtTime(0.12, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.12);
      });
    } catch (e) {}
  }

  // Chat message pop
  playMessage() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Voice AI Agent speaking chime
  playVoice() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      [392.00, 493.88, 587.33].forEach((freq, idx) => { // G4, B4, D5
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.1, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.15);
      });
    } catch (e) {}
  }

  // Success Celebration (Triad Chord Chime)
  playSuccess() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.15, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.28);
      });
    } catch (e) {}
  }

  // Toggle switch sound
  playToggle(isOn) {
    if (!this.soundEnabled && isOn === undefined) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      if (isOn) {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.09);
      } else {
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.09);
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }
}

// Global Sound Instance
window.anticSound = new SoundEngine();

document.addEventListener('DOMContentLoaded', () => {
  window.anticSound.updateSoundButtons();

  // Initialize audio on first user touch/click anywhere
  const unlockAudio = () => {
    window.anticSound.init();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);

  // Attach sound to common UI elements with data-sound or role
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .btn, a, .tab-btn, .interactive-card, input[type="radio"], input[type="checkbox"]');
    if (!target) return;

    if (target.classList.contains('sound-toggle-btn')) {
      window.anticSound.toggleSound();
      return;
    }

    const customSound = target.getAttribute('data-sound');
    if (customSound === 'success') {
      window.anticSound.playSuccess();
    } else if (customSound === 'message') {
      window.anticSound.playMessage();
    } else if (customSound === 'voice') {
      window.anticSound.playVoice();
    } else if (customSound === 'tab') {
      window.anticSound.playTab();
    } else if (customSound !== 'none') {
      window.anticSound.playClick();
    }
  });
});
