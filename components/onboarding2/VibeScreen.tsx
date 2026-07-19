import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { CTAButton, FadeInUp, Headline, Subheadline } from './components';
import { OB2_COLORS, OB2_GRADIENTS } from './theme';

const VIBES = [
  {
    id: 'y2k_glow',
    icon: '✨',
    gradient: [...OB2_GRADIENTS.y2k] as string[],
    titleKey: 'onboarding2.vibe.y2k.title',
    descKey: 'onboarding2.vibe.y2k.desc',
  },
  {
    id: 'grain_90s',
    icon: '🎞️',
    gradient: [...OB2_GRADIENTS.film] as string[],
    titleKey: 'onboarding2.vibe.90s.title',
    descKey: 'onboarding2.vibe.90s.desc',
  },
  {
    id: 'disposable',
    icon: '📸',
    gradient: [...OB2_GRADIENTS.disposable] as string[],
    titleKey: 'onboarding2.vibe.disposable.title',
    descKey: 'onboarding2.vibe.disposable.desc',
  },
] as const;

export const VIBE_STORAGE_KEY = 'onboarding_vibe';

interface Props {
  onNext: () => void;
}

// SCREEN 5: Vibe selection — personalization
export const VibeScreen: React.FC<Props> = ({ onNext }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>('y2k_glow');

  const handleSelect = (id: string) => {
    setSelected(id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleContinue = async () => {
    await AsyncStorage.setItem(VIBE_STORAGE_KEY, selected).catch(() => {});
    onNext();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <FadeInUp>
          <Headline
            text={t('onboarding2.vibe.title_a', 'What’s your')}
            accent={t('onboarding2.vibe.title_b', ' vibe?')}
          />
          <Subheadline
            text={t(
              'onboarding2.vibe.subtitle',
              'Pick one so we can recommend filters for you. You can change it anytime.'
            )}
          />
        </FadeInUp>
      </View>

      <View style={styles.listWrap}>
        <View style={styles.list}>
          {VIBES.map((v, i) => {
            const isSelected = selected === v.id;
            return (
              <FadeInUp key={v.id} delay={200 + i * 120}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleSelect(v.id)}
                  style={[styles.card, isSelected && styles.cardSelected]}
                >
                  <LinearGradient colors={v.gradient as any} style={styles.iconWrap}>
                    <Text style={styles.icon}>{v.icon}</Text>
                  </LinearGradient>
                  <View style={styles.info}>
                    <Text style={styles.cardTitle}>{t(v.titleKey, v.id)}</Text>
                    <Text style={styles.cardDesc}>{t(v.descKey, '')}</Text>
                  </View>
                  <View style={[styles.check, isSelected && styles.checkSelected]}>
                    <Text style={[styles.checkMark, !isSelected && { color: 'transparent' }]}>✓</Text>
                  </View>
                </TouchableOpacity>
              </FadeInUp>
            );
          })}
        </View>
      </View>

      <FadeInUp delay={600} style={styles.ctaWrap}>
        <CTAButton label={t('onboarding2.vibe.cta', 'Open the Camera →')} onPress={handleContinue} />
      </FadeInUp>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  header: {},
  listWrap: { flexGrow: 1, justifyContent: 'center' },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(245,240,232,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(245,240,232,0.1)',
    borderRadius: 16,
  },
  cardSelected: {
    borderColor: OB2_COLORS.primary,
    backgroundColor: 'rgba(232,168,124,0.1)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  cardTitle: { color: OB2_COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  cardDesc: { color: OB2_COLORS.textMuted, fontSize: 12, marginTop: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(245,240,232,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: OB2_COLORS.primary,
    borderColor: OB2_COLORS.primary,
  },
  checkMark: { color: '#0a0a0a', fontSize: 13, fontWeight: '900' },
  ctaWrap: {},
});
