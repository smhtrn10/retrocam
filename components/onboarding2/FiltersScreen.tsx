import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, Animated, TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CTAButton, FadeInUp, Headline, Subheadline } from './components';
import { OB2_COLORS } from './theme';

const FILTERS = [
  { key: 'classic_m', name: 'Classic M', badge: 'popular', img: require('@/assets/images/onboarding/filter_classicm.png') },
  { key: 'd_classic', name: 'D Classic', badge: null, img: require('@/assets/images/onboarding/filter_dclassic.png') },
  { key: 'ccd_r', name: 'CCD R', badge: 'y2k', img: require('@/assets/images/onboarding/filter_ccdr.png') },
  { key: 'd_exp', name: 'D Exp', badge: null, img: require('@/assets/images/onboarding/filter_dexp.png') },
] as const;

interface Props {
  onNext: () => void;
}

// SCREEN 2: Filters carousel — 4 iconic film cameras
export const FiltersScreen: React.FC<Props> = ({ onNext }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Gentle auto-scroll once through the carousel, then stop
  useEffect(() => {
    const t1 = setTimeout(() => scrollRef.current?.scrollTo({ x: 80, animated: true }), 900);
    const t2 = setTimeout(() => scrollRef.current?.scrollTo({ x: 0, animated: true }), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <View style={styles.screen}>
      <FadeInUp>
        <Headline
          text={t('onboarding2.filters.title_a', '4 iconic')}
          accent={t('onboarding2.filters.title_b', ' film cameras')}
        />
        <Subheadline
          text={t('onboarding2.filters.subtitle', 'Each one crafted from real film stocks. Swipe and try.')}
        />
      </FadeInUp>

      <FadeInUp delay={200} style={styles.carouselWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {FILTERS.map((f, i) => {
            const isSelected = selected === i;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.85}
                onPress={() => setSelected(i)}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                <Image source={f.img} style={styles.cardImg} resizeMode="cover" />
                {f.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {f.badge === 'popular'
                        ? t('onboarding2.filters.badge_popular', 'POPULAR').toUpperCase()
                        : 'Y2K'}
                    </Text>
                  </View>
                )}
                <View style={styles.cardNameWrap}>
                  <Text style={styles.cardName}>{f.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </FadeInUp>

      <FadeInUp delay={300} style={styles.ctaWrap}>
        <CTAButton label={t('onboarding2.filters.cta', 'See the Video →')} onPress={onNext} />
      </FadeInUp>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  carouselWrap: { flexGrow: 1, justifyContent: 'center' },
  carousel: { paddingHorizontal: 24, gap: 12, alignItems: 'center' },
  card: {
    width: 150,
    height: 215,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: OB2_COLORS.primary,
    transform: [{ translateY: -4 }],
  },
  cardImg: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: OB2_COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { color: '#0a0a0a', fontSize: 10, fontWeight: '800' },
  cardNameWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cardName: { color: '#f5f0e8', fontSize: 13, fontWeight: '700' },
  ctaWrap: { paddingHorizontal: 24 },
});
