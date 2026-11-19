import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

export const LAUNCH_COUNT_KEY = 'app_launch_count';
export const HAS_REVIEWED_KEY = 'has_reviewed';

/**
 * Tracks app launches and prompts for native App Store / Play Store review
 * on the 2nd launch and every subsequent launch until reviewed.
 */
export async function trackLaunchAndPromptReview(): Promise<number> {
  try {
    const hasReviewed = await AsyncStorage.getItem(HAS_REVIEWED_KEY);
    const countStr = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;
    const newCount = count + 1;
    await AsyncStorage.setItem(LAUNCH_COUNT_KEY, String(newCount));

    // If user has already reviewed, do not prompt
    if (hasReviewed === 'true') {
      return newCount;
    }

    // Prompt store review on 2nd launch and each launch thereafter until reviewed
    if (newCount >= 2) {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        setTimeout(async () => {
          try {
            await StoreReview.requestReview();
          } catch (err) {
            console.warn('[RetroCam] Store review request failed:', err);
          }
        }, 1500);
      }
    }

    return newCount;
  } catch (error) {
    console.warn('[RetroCam] Failed to track launch / prompt review:', error);
    return 1;
  }
}

export async function markAppReviewed(): Promise<void> {
  try {
    await AsyncStorage.setItem(HAS_REVIEWED_KEY, 'true');
  } catch (e) {
    console.warn('[RetroCam] Failed to mark app reviewed:', e);
  }
}

export async function hasUserReviewed(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(HAS_REVIEWED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}
