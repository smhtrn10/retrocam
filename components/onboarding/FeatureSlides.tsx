import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, useWindowDimensions, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';

// ─── BACKGROUND STARS ───
const StarfieldBackground = () => {
  const { width, height } = useWindowDimensions();
  const stars = useRef(
    Array.from({ length: 40 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      anim: new Animated.Value(Math.random()),
    }))
  ).current;

  useEffect(() => {
    const anims = stars.map((s) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(s.anim, {
            toValue: 1,
            duration: 1000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(s.anim, {
            toValue: 0,
            duration: 1000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      )
    );
    Animated.parallel(anims).start();
  }, [stars]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: '#FFD166',
            opacity: s.anim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.8] }),
            shadowColor: '#FFD166',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 5,
          }}
        />
      ))}
    </View>
  );
};

// ─── GLASSMORPHISM CONTAINER ───
const GlassCard: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

// ─── SLIDES ───
const SlideHeroLaunch = () => {
  const { width } = useWindowDimensions();
  const mascotX = useRef(new Animated.Value(-100)).current;
  const iconOp = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.spring(mascotX, { toValue: width * 0.1, friction: 5, tension: 50, useNativeDriver: true }),
      Animated.timing(iconOp, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <GlassCard style={styles.sceneWrap}>
      <Animated.View style={[styles.mascotFloat, { transform: [{ translateX: mascotX }] }]}>
        <Image
          source={require('@/assets/images/caracter.png')}
          style={{ width: 120, height: 120 }}
          contentFit="contain"
        />
      </Animated.View>
      <Animated.Text style={[styles.centerIcon, { opacity: iconOp, fontSize: 80, zIndex: -1, marginLeft: 40 }]}>🎞️</Animated.Text>
    </GlassCard>
  );
};

const SlideBurstCount = () => {
  const counterVal = useRef(new Animated.Value(0)).current;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const anim = Animated.timing(counterVal, { toValue: 120, duration: 1800, delay: 200, useNativeDriver: false });
    anim.start();
    const l = counterVal.addListener(({ value }) => setCount(Math.floor(value)));
    return () => {
      counterVal.removeListener(l);
      anim.stop();
    };
  }, []);

  return (
    <GlassCard style={styles.sceneWrap}>
      <Text style={styles.counterText}>{count}+</Text>
      <Text style={styles.subCounterText}>Light Effects & Filters</Text>
    </GlassCard>
  );
};

const SlideCountdown = () => {
  const ringScale = useRef(new Animated.Value(0.3)).current;
  const ringOp = useRef(new Animated.Value(0)).current;
  const [isExploded, setIsExploded] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => pulse(), 300);
    const t2 = setTimeout(() => pulse(), 1200);
    const t3 = setTimeout(() => { pulse(); setIsExploded(true); }, 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const pulse = () => {
    ringScale.setValue(0.3);
    ringOp.setValue(0.8);
    Animated.parallel([
      Animated.timing(ringScale, { toValue: 2.5, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(ringOp, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  };

  return (
    <GlassCard style={styles.sceneWrap}>
      <Animated.View style={[styles.ring, { opacity: ringOp, transform: [{ scale: ringScale }] }]} />
      <Text style={[styles.centerIcon, { fontSize: 80 }]}>{isExploded ? '🔥' : '⏳'}</Text>
    </GlassCard>
  );
};

const SlideCardStack = () => {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <GlassCard style={{...styles.sceneWrap, flexDirection: 'row', gap: 10, padding: 10 }}>
      <Animated.View style={[styles.compareCol, { opacity: op }]}>
        <Text style={styles.colTitle}>Basic</Text>
        <Text style={styles.colItemBad}>Limited Access</Text>
        <Text style={styles.colItemBad}>Watermark</Text>
      </Animated.View>
      <Animated.View style={[styles.compareColPro, { opacity: op }]}>
        <Text style={[styles.colTitle, { color: '#FFD166' }]}>Pro</Text>
        <Text style={styles.colItemGood}>Unlimited</Text>
        <Text style={styles.colItemGood}>Clean Export</Text>
        <Text style={styles.colItemGood}>Priority AI</Text>
      </Animated.View>
    </GlassCard>
  );
};

// ZİRVE SLAYTI - VIDEO ANIMASYONLU MASKOT
const SlidePremiumReveal = () => {
  const videoSource = require('@/assets/images/animasyon.mp4');
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });
  
  const crownSc = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(crownSc, { toValue: 1, friction: 3, tension: 70, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.sceneWrap, { position: 'relative' }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
      />
      {/* Koyu film katmanı, video tam olarak patlamasın diye */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
      
      <Animated.View style={{ position: 'absolute', top: '15%', transform: [{ scale: crownSc }] }}>
         <Text style={{ fontSize: 90, textShadowColor: '#FFD166', textShadowRadius: 30, textShadowOffset: { width: 0, height: 0 } }}>👑</Text>
      </Animated.View>
    </View>
  );
};

import * as StoreReview from 'expo-store-review';
import { Linking } from 'react-native';

const SlideRatingRequest = () => {
  const [hasRated, setHasRated] = useState(false);

  const handleRate = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        setHasRated(true);
      } else {
        // Native popup çalışmazsa (eski sürüm vb.) veya limiti dolduysa
        // doğrudan kullanıcının App Store/Play Store sayfasına yönlendirir.
        const url = StoreReview.storeUrl();
        if (url) {
          Linking.openURL(url);
          setHasRated(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <GlassCard style={styles.sceneWrap}>
      <Text style={{ fontSize: 70, marginBottom: 15, textShadowColor: '#FFD166', textShadowRadius: 20 }}>⭐⭐⭐⭐⭐</Text>
      <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 10 }}>
        {hasRated ? "Teşekkürler! 💛" : "Bizi Değerlendir"}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
        Yıldız vererek bu macerada bize destek olmak ister misiniz?
      </Text>
      
      {!hasRated && (
        <TouchableOpacity 
          style={{ backgroundColor: '#FFD166', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 }}
          onPress={handleRate}
        >
          <Text style={{ color: '#000', fontWeight: '800', fontSize: 16 }}>Puan Ver</Text>
        </TouchableOpacity>
      )}
    </GlassCard>
  );
};

const SLIDES = [SlideHeroLaunch, SlideBurstCount, SlideCountdown, SlideCardStack, SlidePremiumReveal, SlideRatingRequest];

export const FeatureSlides: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { height, width } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const [slideIndex, setSlideIndex] = useState(0);
  
  // Flash Animation
  const flashOp = useRef(new Animated.Value(0)).current;

  const CurrentSlide = SLIDES[slideIndex];

  const triggerFlash = (callback: () => void) => {
    // Cinematic camera flash
    flashOp.setValue(1);
    callback();
    Animated.timing(flashOp, {
      toValue: 0,
      duration: 600,
      easing: Easing.out(Easing.poly(4)),
      useNativeDriver: true
    }).start();
  };

  useEffect(() => {
    // Initial slide flash
    triggerFlash(() => {});
  }, []);

  const handleNext = () => {
    if (slideIndex < SLIDES.length - 1) {
      triggerFlash(() => setSlideIndex(prev => prev + 1));
    } else {
      triggerFlash(() => onComplete());
    }
  };

  return (
    <View style={styles.container}>
      <StarfieldBackground />

      {/* FLASH LAYER */}
      <Animated.View style={[styles.flashLayer, { opacity: flashOp }]} pointerEvents="none" />

      <View style={styles.progressBarWrapper}>
        <View style={[styles.progressBarSync, { width: `${((slideIndex + 1) / SLIDES.length) * 100}%` }]} />
      </View>
      
      <View style={[styles.slideArea, { height: height * (isTablet ? 0.5 : 0.45) }]}>
        <CurrentSlide key={slideIndex} />
      </View>

      <View style={styles.textArea}>
        <Text style={styles.slideTitle}>{t(`features.${slideIndex + 1}.title`, 'Feature Title')}</Text>
        <Text style={styles.slideDesc}>{t(`features.${slideIndex + 1}.desc`, 'Feature Desc')}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>{slideIndex === SLIDES.length - 1 ? t('onboarding.continue', 'Continue') : t('onboarding.continue', 'Continue')}</Text>
          <Play size={16} color="#000" fill="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Jet black for premium contrast
  },
  flashLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    zIndex: 999,
  },
  progressBarWrapper: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 50,
    marginHorizontal: 30,
    borderRadius: 2,
    overflow: 'hidden',
    zIndex: 10,
  },
  progressBarSync: {
    height: '100%',
    backgroundColor: '#FFD166',
  },
  slideArea: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  glassCard: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  sceneWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    overflow: 'hidden',
  },
  mascotFloat: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  centerIcon: {
    fontSize: 70,
  },
  counterText: {
    fontSize: 60,
    fontWeight: '900',
    color: '#FFD166',
    textShadowColor: 'rgba(255,209,102,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subCounterText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 5,
  },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#FFD166',
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  compareCol: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
  },
  compareColPro: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 209, 102, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.4)',
  },
  colTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  colItemBad: {
    color: 'rgba(255,74,74,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  colItemGood: {
    color: '#06D6A0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    textShadowColor: 'rgba(6,214,160,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  textArea: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
    alignItems: 'center',
    zIndex: 10,
  },
  slideTitle: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slideDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  footer: {
    padding: 30,
    paddingBottom: 50,
    zIndex: 10,
  },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFD166',
    paddingVertical: 18,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  nextBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
