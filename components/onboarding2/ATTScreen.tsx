import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { CTAButton, SecondaryButton, FadeInUp, Headline, Subheadline } from './components';
import { OB2_COLORS } from './theme';

const BENEFITS = [
  { icon: '🎯', key: 'personalized' },
  { icon: '📊', key: 'experience' },
  { icon: '🔒', key: 'privacy' },
] as const;

interface Props {
  onDone: () => void;
}

// ATT soft-ask screen: custom UI first, native dialog ONLY on "Allow" tap
export const ATTScreen: React.FC<Props> = ({ onDone }) => {
  const { t } = useTranslation();
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    if (requesting) return;
    setRequesting(true);
    if (Platform.OS === 'ios') {
      try {
        const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency');
        await requestTrackingPermissionsAsync();
      } catch (e) {
        console.warn('ATT request failed:', e);
      }
    }
    setRequesting(false);
    onDone();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <FadeInUp>
          <LinearGradient colors={['#e8a87c', '#d4a574']} style={styles.iconWrap}>
            <Text style={styles.icon}>🔒</Text>
          </LinearGradient>
        </FadeInUp>

        <FadeInUp delay={120}>
          <Headline
            center
            size={24}
            text={t('onboarding2.att.title_a', 'Personalize')}
            accent={t('onboarding2.att.title_b', ' your filters')}
          />
          <Subheadline
            center
            text={t(
              'onboarding2.att.subtitle',
              'Allow us to recommend the best Y2K filters for you. Your data is never shared.'
            )}
          />
        </FadeInUp>

        <View style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <FadeInUp key={b.key} delay={250 + i * 120}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIconWrap}>
                  <Text style={styles.benefitIcon}>{b.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>
                    {t(`onboarding2.att.benefit_${b.key}.title`, '')}
                  </Text>
                  <Text style={styles.benefitDesc}>
                    {t(`onboarding2.att.benefit_${b.key}.desc`, '')}
                  </Text>
                </View>
              </View>
            </FadeInUp>
          ))}
        </View>
      </View>

      <FadeInUp delay={650}>
        <CTAButton
          label={requesting ? t('onboarding2.att.requesting', 'Requesting…') : t('onboarding2.att.allow', 'Allow & Start')}
          onPress={handleAllow}
          disabled={requesting}
        />
        <SecondaryButton label={t('onboarding2.att.later', 'Ask Me Later')} onPress={onDone} />
      </FadeInUp>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  center: { alignItems: 'center', marginBottom: 40 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: OB2_COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  icon: { fontSize: 36 },
  benefits: { width: '100%', gap: 12, marginTop: 8 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(245,240,232,0.05)',
    borderRadius: 12,
  },
  benefitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(232,168,124,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIcon: { fontSize: 16 },
  benefitTitle: { color: OB2_COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  benefitDesc: { color: OB2_COLORS.textMuted, fontSize: 11, marginTop: 1 },
});
