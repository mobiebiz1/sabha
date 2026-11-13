export type NarrationLanguage = 'en-IN' | 'hi-IN';

export interface VoicePlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

const INDIAN_ENGLISH_FEMALE_PREFERENCE = [
  'neerja',
  'raveena',
  'veena',
  'aditi',
  'heera',
  'kalpana',
  'priya',
  'kavya',
  'lekha',
  'indian english',
  'en-in',
  'en_in',
];

const HINDI_FEMALE_PREFERENCE = [
  'swara',
  'lekha',
  'kalpana',
  'heera',
  'aditi',
  'google हिन्दी',
  'hi-in',
  'hi_in',
];

function scoreVoice(voice: SpeechSynthesisVoice, lang: NarrationLanguage): number {
  const name = voice.name.toLowerCase();
  const vLang = voice.lang.toLowerCase().replace('_', '-');
  let score = 0;

  if (lang === 'en-IN') {
    if (vLang === 'en-in') score += 100;
    else if (vLang.startsWith('en-gb')) score += 45;
    else if (vLang.startsWith('en')) score += 25;

    for (let i = 0; i < INDIAN_ENGLISH_FEMALE_PREFERENCE.length; i++) {
      if (name.includes(INDIAN_ENGLISH_FEMALE_PREFERENCE[i])) {
        score += 60 - i * 3;
      }
    }
  } else {
    if (vLang === 'hi-in') score += 100;
    else if (vLang.startsWith('hi')) score += 60;

    for (let i = 0; i < HINDI_FEMALE_PREFERENCE.length; i++) {
      if (name.includes(HINDI_FEMALE_PREFERENCE[i])) {
        score += 60 - i * 3;
      }
    }
  }

  // Prefer natural/neural/online female voices over generic male voices
  if (name.includes('natural') || name.includes('online') || name.includes('neural')) {
    score += 30;
  }
  if (name.includes('female') || name.includes('woman')) {
    score += 25;
  }
  if (name.includes('male') && !name.includes('female')) {
    score -= 40;
  }
  if (name.includes('prabhat') || name.includes('ravi') || name.includes('madhur') || name.includes('hemant')) {
    score -= 45;
  }

  return score;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function selectTechnicianVoice(lang: NarrationLanguage): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -999;

  for (const voice of voices) {
    const s = scoreVoice(voice, lang);
    if (s > bestScore) {
      bestScore = s;
      best = voice;
    }
  }

  return best;
}

export function stopTechnicianNarration(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore browser speech synthesis cancellation errors
  }
}

export function pauseTechnicianNarration(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  } catch {
    // Ignore
  }
}

export function resumeTechnicianNarration(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
    // Ignore
  }
}

export function speakTechnicianNarration(
  text: string,
  lang: NarrationLanguage,
  callbacks: VoicePlaybackCallbacks = {},
  volume = 0.9
): () => void {
  if (!isSpeechSynthesisSupported()) {
    // Graceful timed caption fallback when Web Speech API is unavailable
    callbacks.onStart?.();
    const durationMs = Math.max(2800, Math.min(8500, text.split(/\s+/).length * 360));
    const timer = window.setTimeout(() => {
      callbacks.onEnd?.();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const chosenVoice = selectTechnicianVoice(lang);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = lang;
    }

    // Natural, calm, friendly Indian English / Hindi pacing
    utterance.rate = lang === 'en-IN' ? 0.98 : 0.96;
    utterance.pitch = 1.05;
    utterance.volume = Math.max(0, Math.min(1, volume));

    let settled = false;
    utterance.onstart = () => {
      callbacks.onStart?.();
    };
    utterance.onend = () => {
      if (!settled) {
        settled = true;
        callbacks.onEnd?.();
      }
    };
    utterance.onerror = () => {
      if (!settled) {
        settled = true;
        callbacks.onError?.();
      }
    };

    window.speechSynthesis.speak(utterance);

    // Some embedded sandboxes never fire `onstart`/`onend` when no OS TTS voice exists
    const voicesAvailable = window.speechSynthesis.getVoices().length > 0;
    let fallbackTimer: number | undefined;
    if (!voicesAvailable) {
      callbacks.onStart?.();
      const durationMs = Math.max(3000, Math.min(8000, text.split(/\s+/).length * 350));
      fallbackTimer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          callbacks.onEnd?.();
        }
      }, durationMs);
    }

    return () => {
      settled = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      stopTechnicianNarration();
    };
  } catch {
    callbacks.onError?.();
    return () => {};
  }
}
