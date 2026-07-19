import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CTAButton, FadeInUp, Headline, Subheadline } from './components';
import { OB2_COLORS } from './theme';

const { width: W } = Dimensions.get('window');
const BEFORE = require('@/assets/images/onboarding/hook_before.png');
const AFTER = require('@/assets/images/onboarding/hook_after.png');

interface Props {
  onNext: () => void;
}

// SCREEN 1: Hook — before/after with animated wipe + pulse swipe indicator
export const HookScreen: React.FC<Props> = ({ onNext }) => {
  const { t } = useTranslation();
  const wipeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Slow auto wipe loop revealing the Y2K version
    Animated.loop(
      Animated.sequence([
        Animated.timing(wipeAnim, { toValue: 1, duration: 2200, delay: 600, useNativeDriver: true }),
        Animated.timing(wipeAnim, { toValue: 0, duration: 2200, delay: 600, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [wipeAnim, pulseAnim]);

  const clipW = wipeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, W - 48] });

  return (
    <View style={styles.screen}>
      <FadeInUp>
        <View style={styles.statsBadge}>
          <Text style={styles.statsBadgeText}>🔥 {t('onboarding2.hook.badge', '2M+ creators on TikTok')}</Text>
        </View>
      </FadeInUp>

      <FadeInUp delay={100}>
        <Headline
          text={t('onboarding2.hook.title_a', 'Shoot like it’s 1998,')}
          accent={t('onboarding2.hook.title_b', ' one tap')}
        />
        <Subheadline
          text={t(
            'onboarding2.hook.subtitle',
            'Instant film grain, light leaks and Y2K tones. No editing — vintage aesthetic in one tap.'
          )}
        />
      </FadeInUp>

      <FadeInUp delay={300} style={styles.visualWrap}>
        <View style={styles.visual}>
          {/* Before (normal) */}
          <Image 
            source={BEFORE} 
            style={styles.imageBase} 
            resizeMode="contain" 
          />
          {/* After (Y2K) revealed by animated clip */}
          <Animated.View 
            style={[
              styles.clipContainer, 
              { 
                transform: [{ translateX: wipeAnim.interpolate({ 
                  inputRange: [0, 1], 
                  outputRange: [-(W - 48), 0] 
                })}]
              }
            ]}
          >
            <Image
              source={AFTER}
              style={styles.imageBase}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Divider line */}
          <Animated.View
            style={[
              styles.divider,
              { 
                transform: [{ translateX: wipeAnim.interpolate({ 
                  inputRange: [0, 1], 
                  outputRange: [0, W - 48] 
                })}]
              }
            ]}
          />

          <View style={styles.beforeLabel}>
            <Text style={styles.beforeLabelText}>{t('onboarding2.hook.normal', 'Normal')}</Text>
          </View>
          <View style={styles.afterLabel}>
            <Text style={styles.afterLabelText}>{t('onboarding2.hook.y2k', 'Y2K')}</Text>
          </View>

          <Animated.View style={[styles.swipeIndicator, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.swipeArrow}>→</Text>
          </Animated.View>
        </View>
      </FadeInUp>

      <FadeInUp delay={400} style={styles.ctaWrap}>
        <CTAButton label={t('onboarding2.hook.cta', 'Explore →')} onPress={onNext} />
      </FadeInUp>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  statsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,168,124,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statsBadgeText: { color: OB2_COLORS.primary, fontSize: 12, fontWeight: '600' },
  visualWrap: { marginBottom: 24, flex: 1 },
  visual: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    position: 'relative',
  },
  imageBase: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  clipContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(232,168,124,0.95)',
    shadowColor: '#E8A87C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  beforeLabel: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  beforeLabelText: {
    color: 'rgba(245,240,232,0.7)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  afterLabel: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: OB2_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  afterLabelText: {
    color: '#0a0a0a',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -28,
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(232,168,124,0.3)',
    borderWidth: 3,
    borderColor: OB2_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8A87C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  swipeArrow: { 
    color: OB2_COLORS.primary, 
    fontSize: 28, 
    fontWeight: '800',
  },
  ctaWrap: { marginTop: 'auto' },
});
