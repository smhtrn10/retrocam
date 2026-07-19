import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePurchases } from '@/hooks/usePurchases';

import { HookScreen } from '@/components/onboarding2/HookScreen';
import { FiltersScreen } from '@/components/onboarding2/FiltersScreen';
import { VideoScreen } from '@/components/onboarding2/VideoScreen';
import { AlbumScreen } from '@/components/onboarding2/AlbumScreen';
import { VibeScreen } from '@/components/onboarding2/VibeScreen';
import { ATTScreen } from '@/components/onboarding2/ATTScreen';
import { PermissionScreen } from '@/components/onboarding2/PermissionScreen';
import { PaywallScreen2 } from '@/components/onboarding2/PaywallScreen2';
import { FilmGrain, LightLeak } from '@/components/onboarding2/components';
import { OnboardingChrome } from '@/components/onboarding2/OnboardingChrome';

type Phase = 'hook' | 'filters' | 'video' | 'album' | 'vibe' | 'att' | 'permission' | 'paywall';

// Content screens that show progress dots (reference design: 5 dots)
const DOT_PHASES: Phase[] = ['hook', 'filters', 'video', 'album', 'vibe'];

export default function OnboardingScreen() {
  const { setOnboardingComplete } = usePurchases();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('hook');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shutterFlash = useRef(new Animated.Value(0)).current;
  const glitchX = useRef(new Animated.Value(0)).current;
  const glitchOp = useRef(new Animated.Value(0)).current;

  // Shutter flash effect (filters → video transition)
  const triggerShutter = useCallback(() => {
    Animated.sequence([
      Animated.timing(shutterFlash, { toValue: 0.9, duration: 75, useNativeDriver: true }),
      Animated.timing(shutterFlash, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [shutterFlash]);

  // VHS glitch effect (video → album transition) — once per flow
  const glitchUsed = useRef(false);
  const triggerGlitch = useCallback(() => {
    if (glitchUsed.current) return;
    glitchUsed.current = true;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(glitchOp, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(glitchX, { toValue: 3, duration: 80, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(glitchOp, { toValue: 0.8, duration: 80, useNativeDriver: true }),
        Animated.timing(glitchX, { toValue: -3, duration: 80, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(glitchX, { toValue: 2, duration: 80, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(glitchOp, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(glitchX, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]),
    ]).start();
  }, [glitchOp, glitchX]);

  const transitionTo = useCallback(
    (next: Phase, effect?: 'shutter' | 'glitch') => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (effect === 'shutter') triggerShutter();
      if (effect === 'glitch') triggerGlitch();
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setPhase(next);
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    },
    [fadeAnim, triggerShutter, triggerGlitch]
  );

  const finishOnboarding = useCallback(async () => {
    await setOnboardingComplete(true);
    router.replace('/');
  }, [setOnboardingComplete]);

  // Skip jumps straight to vibe (last content step, per reference design)
  const handleSkip = useCallback(() => transitionTo('vibe'), [transitionTo]);

  const dotIndex = DOT_PHASES.indexOf(phase);
  const showChrome = dotIndex >= 0;

  return (
    <View style={styles.container}>
      {/* Ambient light leak */}
      <LightLeak />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: glitchX }],
          },
        ]}
      >
        {/* VHS glitch tint overlay */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.glitchTint, { opacity: glitchOp }]}
          pointerEvents="none"
        />

        {/* Top chrome: dots centered, skip right */}
        {showChrome && (
          <OnboardingChrome
            total={DOT_PHASES.length}
            active={dotIndex}
            onSkip={handleSkip}
            topInset={insets.top + (Platform.OS === 'ios' ? 4 : 8)}
          />
        )}

        {phase === 'hook' && <HookScreen onNext={() => transitionTo('filters')} />}
        {phase === 'filters' && <FiltersScreen onNext={() => transitionTo('video', 'shutter')} />}
        {phase === 'video' && <VideoScreen onNext={() => transitionTo('album', 'glitch')} />}
        {phase === 'album' && <AlbumScreen onNext={() => transitionTo('vibe')} />}
        {phase === 'vibe' && <VibeScreen onNext={() => transitionTo('att')} />}
        {phase === 'att' && <ATTScreen onDone={() => transitionTo('permission')} />}
        {phase === 'permission' && <PermissionScreen onDone={() => transitionTo('paywall')} />}
        {phase === 'paywall' && <PaywallScreen2 onClose={finishOnboarding} />}
      </Animated.View>

      {/* Shutter flash overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: shutterFlash }]}
        pointerEvents="none"
      />

      {/* Film grain over everything */}
      <FilmGrain />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, paddingBottom: 34 },
  glitchTint: {
    backgroundColor: 'rgba(232,168,124,0.08)',
    zIndex: 10,
  },
  flash: {
    backgroundColor: '#fff',
    zIndex: 999,
  },
});
