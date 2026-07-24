let failedAudio: HTMLAudioElement | null = null;
let unlocked = false;

const getFailedAudio = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!failedAudio) {
    failedAudio = new Audio("/sounds/gagal.mp3");
    failedAudio.preload = "auto";
  }

  return failedAudio;
};

/**
 * Unlock audio playback under browser autoplay policies.
 *
 * Modern browsers (Chrome, Safari, Firefox) block Audio.play() sampai ada
 * user gesture (click, keydown, touch) di dalam dokumen. Trik-nya: pada
 * gesture pertama, kita play() lalu langsung pause() elemen audio yang sama
 * yang nantinya akan dipakai. Setelah ini elemen tersebut "terhubung" dengan
 * user activation, dan play() berikutnya (dipicu oleh scanner keyboard) akan
 * langsung berbunyi tanpa perlu klik lagi setiap scan.
 */
export const unlockScanAudio = () => {
  if (unlocked) return;
  const audio = getFailedAudio();
  if (!audio) return;

  const previousVolume = audio.volume;
  audio.volume = 0;
  audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = previousVolume;
      unlocked = true;
    })
    .catch((err) => {
      audio.volume = previousVolume;
      console.warn("[scan-audio] unlock gagal, akan dicoba pada gesture berikutnya:", err);
    });
};

const playFailedAudio = () => {
  const audio = getFailedAudio();
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  audio.play().catch((err) => {
    console.warn("[scan-audio] gagal memutar /sounds/gagal.mp3:", err);
  });
};

export const playSuccess = () => {
  // Barcode scanner hardware already provides the success beep.
};

export const playDuplicate = () => {
  playFailedAudio();
};

export const playFailed = () => {
  playFailedAudio();
};
