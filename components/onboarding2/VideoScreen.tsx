import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CTAButton, FadeInUp, Headline, Subheadline } from './components';
import { OB2_COLORS } from './theme';

// Scanline rows (VHS look) — 30 thin semi-transparent stripes
const Scanlines: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {Array.from({ length: 30 }).map((_, i) => (
      <View
        key={i}
        style={{
          height: 2,
          marginBottom: 6,
          backgroundColor: 'rgba(0,0,0,0.18)',
        }}
      />
    ))}
  </View>
);

interface Props {
  onNext: () => void;
}

const FEATURES = [
  { icon: '🎞️', key: 'grain' },
  { icon: '✨', key: 'leak' },
  { icon: '📺', key: 'vhs' },
] as const;

// SCREEN 3: Video / 8mm mode — real app video loop + scanlines + feature row
export const VideoScreen: React.FC<Props> = ({ onNext }) => {
  const { t } = useTranslation();
  const playScale = useRef(new Animated.Value(1)).current;

  const player = useVideoPlayer(require('@/assets/images/onboardingvideo.mp4'), p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(playScale, { toValue: 1.08, duration: 1100, useNativeDriver: true }),
        Animated.timing(playScale, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [playScale]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <FadeInUp>
          <Headline
            text={t('onboarding2.video.title_a', '8mm film')}
            accent={t('onboarding2.video.title_b', ' video mode')}
          />
          <Subheadline
            text={t(
              'onboarding2.video.subtitle',
              'Add authentic 8mm grain, warm flicker and old-school scan lines to your videos.'
            )}
          />
        </FadeInUp>
      </View>

      <FadeInUp delay={200} style={styles.previewWrap}>
        <View style={styles.preview}>
          <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="cover" />
          {/* Scanline overlay */}
          <Scanlines />
          <View style={styles.demoLabel}>
            <Text style={styles.demoLabelText}>▶ 8mm Demo</Text>
          </View>
        </View>
      </FadeInUp>

      <FadeInUp delay={350}>
        <View style={styles.featureRow}>
          {FEATURES.map(f => (
            <View key={f.key} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>
                {t(`onboarding2.video.feature_${f.key}`, f.key)}
              </Text>
            </View>
          ))}
        </View>
      </FadeInUp>

      <FadeInUp delay={450} style={styles.ctaWrap}>
        <CTAButton label={t('onboarding2.video.cta', 'See the Gallery →')} onPress={onNext} />
      </FadeInUp>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  header: {},
  previewWrap: { flexGrow: 1, justifyContent: 'center', marginBottom: 20 },
  preview: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  demoLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  demoLabelText: { color: '#f5f0e8', fontSize: 11, fontWeight: '600' },
  featureRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(245,240,232,0.05)',
    borderRadius: 12,
  },
  featureIcon: { fontSize: 20, marginBottom: 4 },
  featureLabel: { color: OB2_COLORS.textPrimary, fontSize: 12, fontWeight: '600' },
  ctaWrap: {},
});
