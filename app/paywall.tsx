import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Crown, CheckCircle2 } from 'lucide-react-native';
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

  useEffect(() => {
    if (isPro) router.replace('/');
  }, [isPro]);

  useEffect(() => {
    // FTC compliance: 7 second close button logic
    const timer = setTimeout(() => setShowCloseButton(true), 7000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      const annual = packages.find(p => p.packageType === 'ANNUAL');
      const monthly = packages.find(p => p.packageType === 'MONTHLY');
      const weekly = packages.find(p => p.packageType === 'WEEKLY');
      setSelectedPackage(annual?.identifier || monthly?.identifier || weekly?.identifier || packages[0].identifier);
    }
  }, [packages, selectedPackage]);

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
  }, [purchasePackage, packages, selectedPackage, t]);

  const handleRestore = useCallback(async () => {
    setIsPurchasing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await restorePurchases();
    } finally {
      setIsPurchasing(false);
    }
  }, [restorePurchases]);

  const getTrialDisclaimer = () => {
    const pkg = packages.find(p => p.identifier === selectedPackage);
    if (pkg?.packageType === 'ANNUAL') {
      return t('paywall.trial_disclaimer', '3-day free trial. Renews automatically unless cancelled.');
    }
    return '';
  };

  const benefits = useMemo(() => [
    t('paywall.benefit_1', 'Access all 40+ cameras'),
    t('paywall.benefit_2', 'Infinite resolution export'),
    t('paywall.benefit_3', 'No ads, no watermarks'),
    t('paywall.benefit_4', 'Priority AI processing'),
    t('paywall.benefit_5', 'Exclusive golden hour features')
  ], [t]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        {showCloseButton ? (
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.closeBtn}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.closeBtnPlaceholder} />
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}>
        <View style={styles.heroBox}>
          <Crown size={64} color="#FFD166" style={{ marginBottom: 12 }} />
          <Text style={styles.title}>{t('paywall.title', 'Upgrade to PRO')}</Text>
          <Text style={styles.subtitle}>{t('paywall.subtitle', 'Unlock all cameras and features')}</Text>
        </View>

        <View style={styles.benefitList}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitItem}>
              <View style={styles.checkIconWrapper}>
                <CheckCircle2 size={18} color="#FFD166" />
              </View>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plansWrap}>
          {packages.map((pkg) => {
            const isSelected = selectedPackage === pkg.identifier;
            const isAnnual = pkg.packageType === 'ANNUAL';
            const price = pkg.product.priceString;
            
            let periodText = t('paywall.monthly', 'Monthly');
            if (isAnnual) periodText = t('paywall.yearly', 'Yearly');
            else if (pkg.packageType === 'WEEKLY') periodText = t('paywall.weekly', 'Weekly');

            return (
              <TouchableOpacity
                key={pkg.identifier}
                style={[styles.planCard, isSelected && styles.planCardActive]}
                onPress={() => setSelectedPackage(pkg.identifier)}
                activeOpacity={0.9}
              >
                {isAnnual && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>{t('paywall.best_value', 'Best Value')}</Text>
                  </View>
                )}
                
                <View style={styles.planInfo}>
                  <Text style={[styles.planPeriod, isSelected && styles.planPeriodActive]}>{periodText}</Text>
                  <Text style={[styles.planPrice, isSelected && styles.planPriceActive]}>{price}</Text>
                </View>

                <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.ctaWrapper}>
          <TouchableOpacity 
            style={[styles.subscribeBtn, (isPurchasing || isLoading) && styles.subscribeBtnDisabled]} 
            onPress={handlePurchase}
            disabled={isPurchasing || isLoading || !selectedPackage}
          >
            {isPurchasing || isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.subscribeBtnText}>
                {packages.find(p => p.identifier === selectedPackage)?.packageType === 'ANNUAL' 
                  ? t('paywall.trial', 'Start 3-Day Free Trial') 
                  : t('onboarding.continue', 'Continue')}
              </Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.disclaimerText}>{getTrialDisclaimer()}</Text>
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerRow: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center'
  },
  closeBtnPlaceholder: {
    width: 40, height: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tabletContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%'
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 8,
  },
  benefitList: {
    marginBottom: 40,
    gap: 16,
    paddingHorizontal: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIconWrapper: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
    justifyContent: 'center', alignItems: 'center'
  },
  benefitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  plansWrap: {
    gap: 12,
    marginBottom: 30,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: '#333',
    padding: 24,
    borderRadius: 24,
    position: 'relative'
  },
  planCardActive: {
    borderColor: '#FFD166',
    backgroundColor: 'rgba(255, 209, 102, 0.05)',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -40,
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  planInfo: {
    flex: 1,
  },
  planPeriod: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  planPeriodActive: {
    color: '#FFD166',
  },
  planPrice: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 4,
  },
  planPriceActive: {
    color: '#FFF',
  },
  radioOuter: {
    width: 24, height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center'
  },
  radioOuterActive: {
    borderColor: '#FFD166',
  },
  radioInner: {
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD166'
  },
  ctaWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subscribeBtn: {
    width: '100%',
    backgroundColor: '#FFD166',
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  subscribeBtnDisabled: {
    opacity: 0.6,
  },
  subscribeBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  disclaimerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  legalLink: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalSep: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
  }
});
