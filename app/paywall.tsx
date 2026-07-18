import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Animated, Dimensions, ScrollView, ActivityIndicator, Alert, Linking
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Haptics from 'expo-haptics';
import { usePurchases } from '@/hooks/usePurchases';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

export default function PaywallScreen() {
  const { t } = useTranslation();
  const { purchasePackage, simulateDevPurchase, restorePurchases, packages, isLoading, isPro } = usePurchases();

  const [showCloseButton, setShowCloseButton] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [scanCount, setScanCount] = useState(847);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  // Video Player Setup
  const videoSource = require('../assets/images/animasyon.mp4');
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // App Config - Retrocam
  const APP_CONFIG = useMemo(() => ({
    headline: t('paywall.title', 'Unlock Your Vintage Aesthetic'),
    subtitle: t('paywall.subtitle', 'Access all 40+ cameras and pro tools'),
    counterVerb: t('paywall.counter_verb', 'editing'),
    accentColor: '#FFD166',
    gradientColors: ['#050510', '#0a0a0a', '#1A1410'] as const,
    benefits: [
      { icon: "📷", text: t('paywall.benefit_1', 'Access all 40+ cameras') },
      { icon: "∞", text: t('paywall.benefit_2', 'Infinite resolution export') },
      { icon: "✨", text: t('paywall.benefit_3', 'No ads, no watermarks') },
      { icon: "🚀", text: t('paywall.benefit_4', 'Priority AI processing') },
      { icon: "🌅", text: t('paywall.benefit_5', 'Exclusive golden hour features') },
    ],
  }), [t]);

  useEffect(() => {
    if (isPro) router.replace('/');
  }, [isPro]);

  useEffect(() => {
    const timer = setTimeout(() => setShowCloseButton(true), 7000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      const weekly = packages.find(p => p.packageType === 'WEEKLY');
      const monthly = packages.find(p => p.packageType === 'MONTHLY');
      const annual = packages.find(p => p.packageType === 'ANNUAL');
      setSelectedPackage(weekly?.identifier || monthly?.identifier || annual?.identifier || packages[0].identifier);
    }
  }, [packages, selectedPackage]);

  // Social proof counter drift
  useEffect(() => {
    const tick = () => {
      setScanCount((n) => Math.max(820, Math.min(980, n + (Math.random() > 0.5 ? 1 : -1))));
      setTimeout(tick, Math.random() * 5000 + 3000);
    };
    const tId = setTimeout(tick, 3000);
    return () => clearTimeout(tId);
  }, []);

  // Badge pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1600, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1600, useNativeDriver: false }),
      ])
    ).start();
  }, [pulseAnim, glowAnim]);

  const handlePurchase = useCallback(async () => {
    const pkg = packages.find(p => p.identifier === selectedPackage);

    if (!pkg && __DEV__) {
      setIsPurchasing(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await simulateDevPurchase();
      setIsPurchasing(false);
      return;
    }

    if (!pkg) {
      Alert.alert(t('common.error', 'Error'), t('paywall.package_not_found', 'Package not found.'));
      return;
    }

    setIsPurchasing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await purchasePackage(pkg);
    } finally {
      setIsPurchasing(false);
    }
  }, [purchasePackage, packages, selectedPackage, t, simulateDevPurchase]);

  const handleRestore = useCallback(async () => {
    setIsPurchasing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await restorePurchases();
    } finally {
      setIsPurchasing(false);
    }
  }, [restorePurchases]);

  const selectedPkg = packages.find(p => p.identifier === selectedPackage);
  const isAnnualSelected = selectedPkg?.packageType === 'ANNUAL';

  const getButtonLabel = () => {
    if (isAnnualSelected && selectedPkg) {
      return t('paywall.trial_btn', 'Start Free Trial');
    }
    return t('paywall.continue_btn', 'Continue');
  };

  const getTrialDisclaimer = () => {
    if (isAnnualSelected && selectedPkg) {
      return t('paywall.trial_disclaimer', '3-day free trial, then {{price}}/year', { price: selectedPkg.product.priceString });
    }
    return '';
  };

  return (
    <LinearGradient colors={APP_CONFIG.gradientColors} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.tabletContent]} showsVerticalScrollIndicator={false}>

        {/* CLOSE */}
        <View style={styles.headerRow}>
          {showCloseButton ? (
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          ) : <View style={styles.closeBtnPlaceholder} />}
        </View>

        {/* ICON */}
        <View style={styles.iconWrap}>
          <Image source={require('../assets/images/icon.png')} style={styles.icon} />
        </View>

        {/* HEADLINE */}
        <Text style={styles.headline}>{APP_CONFIG.headline}</Text>
        <Text style={styles.subtitle}>{APP_CONFIG.subtitle}</Text>

        {/* SOCIAL PROOF */}
        <View style={styles.counterRow}>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              🔥 {scanCount} {t('paywall.people_verb', 'people {{verb}} right now', { verb: APP_CONFIG.counterVerb })}
            </Text>
          </View>
        </View>

        {/* VISUAL SECTION */}
        <View style={styles.visualBox}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            nativeControls={false}
            contentFit="cover"
          />
          {/* Active label */}
          <View style={[styles.activeTag, { borderColor: `${APP_CONFIG.accentColor}66` }]}>
            <Text style={[styles.activeTagText, { color: APP_CONFIG.accentColor }]}>● ACTIVE</Text>
          </View>
        </View>

        {/* BENEFITS */}
        <View style={styles.benefits}>
          {APP_CONFIG.benefits.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <Text style={styles.bIcon}>{b.icon}</Text>
              <Text style={styles.bText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* PRICING */}
        <View style={styles.plans}>
          {isLoading && packages.length === 0 ? (
            <ActivityIndicator color={APP_CONFIG.accentColor} style={{ marginVertical: 20 }} />
          ) : (
            packages.map((pkg) => {
              const isSelected = selectedPackage === pkg.identifier;
              const isYearly = pkg.packageType === 'ANNUAL';
              const price = pkg.product.priceString;

              let planLabel = t('paywall.monthly', 'Monthly');
              let planSub = t('paywall.monthly_sub', 'Billed monthly');
              
              if (isYearly) {
                planLabel = t('paywall.yearly', 'Yearly');
                planSub = t('paywall.yearly_sub', 'Billed yearly');
              } else if (pkg.packageType === 'WEEKLY') {
                planLabel = t('paywall.weekly', 'Weekly');
                planSub = t('paywall.weekly_sub', 'Billed weekly');
              }

              if (isYearly) {
                return (
                  <TouchableOpacity key={pkg.identifier} onPress={() => setSelectedPackage(pkg.identifier)} activeOpacity={0.85}>
                    <Animated.View style={[styles.card, styles.yearlyCard, { borderColor: APP_CONFIG.accentColor, opacity: glowAnim }]}>
                      <View style={[styles.yearlyBadge, { backgroundColor: APP_CONFIG.accentColor }]}>
                        <Animated.Text style={[styles.badgeText, { transform: [{ scale: pulseAnim }] }]}>
                          ⭐ {t('paywall.best_value', 'BEST VALUE')} ⭐
                        </Animated.Text>
                      </View>
                      <View style={styles.cardRow}>
                        <View>
                          <Text style={styles.planLabelLarge}>{planLabel}</Text>
                          <Text style={[styles.planSub, { color: APP_CONFIG.accentColor }]}>{planSub}</Text>
                        </View>
                        <Text style={styles.priceLarge}>{price}</Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity key={pkg.identifier} onPress={() => setSelectedPackage(pkg.identifier)} activeOpacity={0.85}>
                  <View style={[styles.card, isSelected && { borderColor: APP_CONFIG.accentColor, borderWidth: 1.5 }]}>
                    <View style={styles.cardRow}>
                      <View>
                        <Text style={styles.planLabel}>{planLabel}</Text>
                        <Text style={styles.planSub}>{planSub}</Text>
                      </View>
                      <Text style={styles.price}>{price}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity 
          onPress={handlePurchase} 
          disabled={isPurchasing || isLoading || !selectedPackage}
          activeOpacity={0.88} 
          style={styles.ctaWrap}
        >
          <LinearGradient
            colors={[(isPurchasing || isLoading || !selectedPackage) ? '#555' : APP_CONFIG.accentColor, (isPurchasing || isLoading || !selectedPackage) ? '#333' : APP_CONFIG.accentColor + 'cc']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            {isPurchasing || isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.ctaText}>{getButtonLabel()} 🚀</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {getTrialDisclaimer() !== '' && (
          <Text style={styles.trialNote}>
            {getTrialDisclaimer()}
          </Text>
        )}

        {/* TRUST */}
        <View style={styles.trustRow}>
          <Text style={styles.trust}>✓ {t('paywall.cancel_anytime', 'Cancel anytime')}</Text>
          <Text style={styles.trust}>✓ {t('paywall.no_commitment', 'No commitment')}</Text>
          <Text style={styles.trust}>🔒 {t('paywall.secure_payment', 'Secure payment')}</Text>
        </View>

        {/* FOOTER LINKS */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://semihtrn4.github.io/retrocam_privacy/')}>
            <Text style={styles.legalLink}>{t('common.privacy_policy', 'Privacy Policy')}</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>|</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Text style={styles.legalLink}>{t('common.terms_of_use', 'Terms of Use')}</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>|</Text>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.legalLink}>{t('paywall.restore', 'Restore')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { height: 40, alignItems: 'flex-end', paddingHorizontal: 20 },
  closeBtn: { padding: 8 },
  closeBtnPlaceholder: { width: 40, height: 40 },
  closeText: { color: 'rgba(255,255,255,0.6)', fontSize: 20 },
  scroll: { padding: 20, paddingTop: 10, paddingBottom: 60 },
  tabletContent: { maxWidth: 680, alignSelf: 'center', width: '100%' },
  iconWrap: {
    alignSelf: 'center', marginBottom: 14,
    shadowColor: '#FFD166', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 18, elevation: 8,
  },
  icon: { width: 72, height: 72, borderRadius: 18 },
  headline: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginTop: 5, marginBottom: 12 },
  counterRow: { alignItems: 'center', marginBottom: 16 },
  counterBadge: {
    backgroundColor: 'rgba(255,209,102,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,209,102,0.35)',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  counterText: { color: '#FFD166', fontSize: 12, fontWeight: '600' },
  visualBox: {
    height: 180, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#0a0a0a', marginBottom: 16, position: 'relative',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  activeTag: {
    position: 'absolute', bottom: 8, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  activeTagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  benefits: { marginBottom: 20, paddingHorizontal: 10 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  bIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  bText: { color: '#E0E0E0', fontSize: 15, fontWeight: '500' },
  plans: { gap: 10, marginBottom: 20 },
  card: {
    padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  yearlyCard: {
    backgroundColor: 'rgba(255,209,102,0.05)',
    borderWidth: 2, paddingTop: 26,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  yearlyBadge: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingVertical: 5, borderTopLeftRadius: 13, borderTopRightRadius: 13, alignItems: 'center',
  },
  badgeText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { color: '#aaa', fontSize: 15, fontWeight: '600' },
  planLabelLarge: { color: '#fff', fontSize: 18, fontWeight: '800' },
  planSub: { color: '#666', fontSize: 12, marginTop: 2 },
  price: { color: '#888', fontSize: 18, fontWeight: '700' },
  priceLarge: { color: '#fff', fontSize: 24, fontWeight: '900' },
  ctaWrap: { borderRadius: 30, overflow: 'hidden', marginBottom: 10 },
  cta: { padding: 18, alignItems: 'center' },
  ctaText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  trialNote: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16 },
  trustRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  trust: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '500' },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  legalLink: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textDecorationLine: 'underline' },
  legalSep: { color: 'rgba(255,255,255,0.2)', fontSize: 11 },
});
