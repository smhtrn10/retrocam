import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { OB2_COLORS, OB2_GRADIENTS } from './theme';

// ─── Film grain overlay (SVG turbulence, matches reference HTML) ───
let FilmGrain: React.FC = () => null;
try {
  const { Svg, Defs, Filter, FeTurbulence, Rect } = require('react-native-svg');
  FilmGrain = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Filter id="noise">
            <FeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          </Filter>
        </Defs>
        <Rect width="100%" height="100%" filter="url(#noise)" opacity="0.05" />
      </Svg>
    </View>
  );
} catch {}

export { FilmGrain };

// ─── Light leak ambient overlay ───
export const LightLeak: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={['rgba(232,168,124,0.10)', 'transparent']}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.6, y: 0.5 }}
      style={StyleSheet.absoluteFill}
    />
    <LinearGradient
      colors={['transparent', 'rgba(212,165,116,0.08)']}
      start={{ x: 0.5, y: 0.5 }}
      end={{ x: 0.9, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  </View>
);

// ─── Skip button ───
export const SkipButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.skipBtn} onPress={onPress} activeOpacity={0.7} hitSlop={12}>
      <Text style={styles.skipText}>{t('onboarding2.common.skip', 'Skip')}</Text>
    </TouchableOpacity>
  );
};

// ─── Progress dots ───
export const ProgressDots: React.FC<{ total: number; active: number }> = ({ total, active }) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
    ))}
  </View>
);

// ─── Chrome header: dots centered + skip on the right ───

// ─── Primary gradient CTA ───
export const CTAButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
}> = ({ label, onPress, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    disabled={disabled}
    onPress={() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }}
    style={[styles.ctaWrap, disabled && { opacity: 0.5 }]}
  >
    <LinearGradient
      colors={[...OB2_GRADIENTS.cta]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cta}
    >
      <Text style={styles.ctaText}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// ─── Secondary outline button (ATT "Ask Later") ───
export const SecondaryButton: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.secondaryBtn}>
    <Text style={styles.secondaryBtnText}>{label}</Text>
  </TouchableOpacity>
);

// ─── Fade-in-up staggered entrance ───
export const FadeInUp: React.FC<{ delay?: number; children: React.ReactNode; style?: any }> = ({
  delay = 0,
  children,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, delay, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── Headline with accent segment (Space Grotesk style) ───
export const Headline: React.FC<{ text: string; accent?: string; size?: number; center?: boolean }> = ({
  text,
  accent,
  size = 28,
  center = false,
}) => (
  <Text style={[styles.headline, { fontSize: size }, center && { textAlign: 'center' }]}>
    {text}
    {accent ? <Text style={styles.headlineAccent}>{accent}</Text> : null}
  </Text>
);

export const Subheadline: React.FC<{ text: string; center?: boolean }> = ({ text, center }) => (
  <Text style={[styles.subheadline, center && { textAlign: 'center' }]}>{text}</Text>
);

const styles = StyleSheet.create({
  skipBtn: {
    backgroundColor: 'rgba(245,240,232,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skipText: { color: 'rgba(245,240,232,0.5)', fontSize: 12, fontWeight: '500' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(245,240,232,0.2)' },
  dotActive: { width: 24, backgroundColor: OB2_COLORS.primary },

  ctaWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: OB2_COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  cta: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  ctaText: { color: '#0a0a0a', fontSize: 16, fontWeight: '700' },

  secondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.15)',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: { color: 'rgba(245,240,232,0.6)', fontSize: 14, fontWeight: '500' },

  headline: {
    color: OB2_COLORS.textPrimary,
    fontWeight: '700',
    lineHeight: 33,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  headlineAccent: { color: OB2_COLORS.primary },
  subheadline: {
    color: OB2_COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
});
