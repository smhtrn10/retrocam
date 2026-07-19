import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CTAButton, FadeInUp, Headline, Subheadline } from './components';
import { OB2_COLORS } from './theme';

const ALBUM = [
  { img: require('@/assets/images/onboarding/album_1.png'), rot: '-3deg' },
  { img: require('@/assets/images/onboarding/album_2.png'), rot: '2deg' },
  { img: require('@/assets/images/onboarding/album_3.png'), rot: '-1deg' },
  { img: require('@/assets/images/onboarding/album_4.png'), rot: '4deg' },
  { img: require('@/assets/images/onboarding/album_5.png'), rot: '-2deg' },
  { img: require('@/assets/images/onboarding/album_6.png'), rot: '1deg' },
];

interface Props {
  onNext: () => void;
}

// SCREEN 4: Social proof — scattered album grid + review badge
export const AlbumScreen: React.FC<Props> = ({ onNext }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <FadeInUp>
          <Headline
            text={t('onboarding2.album.title_a', 'The aesthetic that')}
            accent={t('onboarding2.album.title_b', ' went viral')}
          />
          <Subheadline
            text={t(
              'onboarding2.album.subtitle',
              'The Y2K look with millions of likes on Instagram and TikTok. Yours in one tap.'
            )}
          />
        </FadeInUp>
      </View>

      <View style={styles.gridWrap}>
        <View style={styles.grid}>
          {ALBUM.map((p, i) => (
            <FadeInUp key={i} delay={150 + i * 130} style={styles.cellWrap}>
              <View style={[styles.cell, { transform: [{ rotate: p.rot }] }]}>
                <Image source={p.img} style={styles.cellImg} resizeMode="cover" />
              </View>
            </FadeInUp>
          ))}
        </View>
      </View>

      <FadeInUp delay={950}>
        <View style={styles.reviewBadge}>
          <Text style={styles.reviewIcon}>⭐</Text>
          <View>
            <Text style={styles.reviewText}>
              “{t('onboarding2.album.review', 'Best Y2K camera app')}”
            </Text>
            <Text style={styles.reviewSource}>
              {t('onboarding2.album.review_source', 'App Store Review')}
            </Text>
          </View>
        </View>
      </FadeInUp>

      <FadeInUp delay={1050} style={styles.ctaWrap}>
        <CTAButton label={t('onboarding2.album.cta', 'Let’s Get Started →')} onPress={onNext} />
      </FadeInUp>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  header: {},
  gridWrap: { flexGrow: 1, justifyContent: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  cellWrap: { width: '31%' },
  cell: {
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(245,240,232,0.1)',
  },
  cellImg: { width: '100%', height: '100%' },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(232,168,124,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  reviewIcon: { fontSize: 20 },
  reviewText: { color: OB2_COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  reviewSource: { color: OB2_COLORS.textMuted, fontSize: 11, marginTop: 2 },
  ctaWrap: {},
});
