import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SkipButton, ProgressDots } from './components';

interface Props {
  total: number;
  active: number;
  onSkip: () => void;
  topInset: number;
}

// Onboarding chrome header: [dots centered] [skip right]
export const OnboardingChrome: React.FC<Props> = ({ total, active, onSkip, topInset }) => {
  return (
    <View style={[styles.row, { paddingTop: topInset + 10 }]}>
      <View style={styles.dotsCenter}>
        <ProgressDots total={total} active={active} />
      </View>
      <View style={styles.skipWrap}>
        <SkipButton onPress={onSkip} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  dotsCenter: { flex: 1, alignItems: 'center' },
  skipWrap: { position: 'absolute', right: 20, top: 10 },
});
