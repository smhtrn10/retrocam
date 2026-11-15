import { createVideoPlayer } from 'expo-video';
import * as Haptics from 'expo-haptics';

const SOUND_ASSETS = {
  slr: require('@/assets/sounds/shutter_slr.wav'),
  wind: require('@/assets/sounds/film_wind.wav'),
  disposable: require('@/assets/sounds/disposable_snap.wav'),
  polaroid: require('@/assets/sounds/polaroid_motor.wav'),
};

const activePlayers: any[] = [];

function playWav(source: any, volume = 1.0) {
  try {
    const player = createVideoPlayer(source);
    if (player) {
      player.volume = volume;
      player.loop = false;
      player.play();
      activePlayers.push(player);
      if (activePlayers.length > 6) {
        activePlayers.shift();
      }
    }
  } catch {
    // Audio engine fallback
  }
}

export function playMechanicalShutterSound(cameraType?: string) {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

  if (cameraType === 'instant') {
    playWav(SOUND_ASSETS.slr, 0.9);
    setTimeout(() => {
      playWav(SOUND_ASSETS.polaroid, 0.85);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 120);
  } else if (cameraType === 'disposable') {
    playWav(SOUND_ASSETS.disposable, 1.0);
    setTimeout(() => {
      playWav(SOUND_ASSETS.wind, 0.7);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 90);
  } else {
    // 35mm, 120, Cine, Classic SLR
    playWav(SOUND_ASSETS.slr, 1.0);
    setTimeout(() => {
      playWav(SOUND_ASSETS.wind, 0.75);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 110);
  }
}
