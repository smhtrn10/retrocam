import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { X, Crown, RefreshCcw, Mail, Shield, Star } from 'lucide-react-native';
import { usePurchases } from '@/hooks/usePurchases';
import { useDevice } from '@/hooks/useDevice';

const SHOW_DEV_TOOLS = false ;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { isPro, restorePurchases, showPaywall, subscriptionPlan, setOnboardingComplete, simulateDevPurchase, setIsProOverride } = usePurchases();
  const { isTablet, scale: uiScale } = useDevice();

  const handleRestore = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await restorePurchases();
  }, [restorePurchases]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleUpgrade = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showPaywall();
  }, [showPaywall]);

  const handleRestartOnboarding = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setOnboardingComplete(false);
    router.replace('/onboarding');
  }, [setOnboardingComplete]);

  const handleRateApp = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
      }
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: isTablet ? 32 : 16 }]}>
        <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]}>
          <X size={24 * uiScale} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: 17 * uiScale }]}>{t('settings.title')}</Text>
        <View style={{ width: 44 * uiScale }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: isTablet ? '15%' : 0 }}
      >
        {/* Pro Banner */}
        {isPro ? (
          <View style={[styles.proBanner, { margin: 16 * uiScale, padding: 16 * uiScale, borderRadius: 16 * uiScale }]}>
            <View style={[styles.proIcon, { width: 48 * uiScale, height: 48 * uiScale, borderRadius: 24 * uiScale }]}>
              <Crown size={32 * uiScale} color="#FFB800" />
            </View>
            <View style={styles.proInfo}>
              <Text style={[styles.proTitle, { fontSize: 16 * uiScale }]}>{t('settings.pro_title')}</Text>
              <Text style={[styles.proSubtitle, { fontSize: 13 * uiScale }]}>
                {subscriptionPlan === 'annual'
                   ? t('paywall.yearly')
                   : subscriptionPlan === 'monthly'
                   ? t('paywall.monthly')
                   : subscriptionPlan === 'weekly'
                   ? t('paywall.weekly')
                   : t('paywall.yearly')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.proBanner, { margin: 16 * uiScale, padding: 16 * uiScale, borderRadius: 16 * uiScale }]}>
            <View style={[styles.proIcon, { width: 48 * uiScale, height: 48 * uiScale, borderRadius: 24 * uiScale }]}>
              <Crown size={32 * uiScale} color="#FFB800" />
            </View>
            <View style={styles.proInfo}>
              <Text style={[styles.proTitle, { fontSize: 16 * uiScale }]}>{t('settings.pro_title')}</Text>
              <Text style={[styles.proSubtitle, { fontSize: 13 * uiScale }]}>
                {t('settings.pro_subtitle')}
              </Text>
            </View>
            <TouchableOpacity style={[styles.upgradeButton, { paddingHorizontal: 16 * uiScale, paddingVertical: 8 * uiScale, borderRadius: 16 * uiScale }]} onPress={handleUpgrade}>
              <Text style={[styles.upgradeText, { fontSize: 13 * uiScale }]}>{t('settings.upgrade')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.section, { paddingHorizontal: isTablet ? 0 : 16 }]}>
          <Text style={[styles.sectionTitle, { fontSize: 12 * uiScale }]}>{t('settings.account')}</Text>

          <TouchableOpacity style={styles.row} onPress={handleRestore}>
            <RefreshCcw size={20 * uiScale} color="#888888" />
            <Text style={[styles.rowText, { fontSize: 16 * uiScale }]}>{t('settings.restore')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { paddingHorizontal: isTablet ? 0 : 16 }]}>
          <Text style={[styles.sectionTitle, { fontSize: 12 * uiScale }]}>{t('settings.about')}</Text>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.row} onPress={handleRateApp}>
              <Star size={20 * uiScale} color="#888888" />
              <Text style={[styles.rowText, { fontSize: 16 * uiScale }]}>{t('settings.rate_app', 'Rate App')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://semihtrn4.github.io/retrocam_privacy/')}>
            <Mail size={20 * uiScale} color="#888888" />
            <Text style={[styles.rowText, { fontSize: 16 * uiScale }]}>{t('settings.contact')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://semihtrn4.github.io/retrocam_privacy/')}>
            <Shield size={20 * uiScale} color="#888888" />
            <Text style={[styles.rowText, { fontSize: 16 * uiScale }]}>{t('settings.privacy', 'Privacy Policy')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Shield size={20 * uiScale} color="#888888" />
            <Text style={[styles.rowText, { fontSize: 16 * uiScale }]}>{t('settings.terms', 'Terms of Use')}</Text>
          </TouchableOpacity>
        </View>

        {/* DEV Tools */}
        {SHOW_DEV_TOOLS && (
          <View style={[styles.section, { paddingHorizontal: isTablet ? 0 : 16 }]}>
            <Text style={[styles.sectionTitle, { fontSize: 12 * uiScale }]}>DEV Tools</Text>
            
            <TouchableOpacity style={styles.row} onPress={async () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const newProStatus = !isPro;
              await setIsProOverride(newProStatus);
              Alert.alert('Success', `PRO status changed to ${newProStatus ? 'ACTIVE' : 'INACTIVE'}`);
            }}>
              <Crown size={20 * uiScale} color={isPro ? "#FFB800" : "rgba(255,100,100,0.8)"} />
              <Text style={[styles.devText, { fontSize: 14 * uiScale, color: isPro ? "#FFB800" : "rgba(255,100,100,0.8)" }]}>
                {isPro ? 'Dev: Disable PRO Mode' : 'Dev: Enable PRO Mode'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={async () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await setIsProOverride(null);
              Alert.alert('Success', 'Cleared Pro override. Back to RevenueCat status.');
            }}>
              <RefreshCcw size={20 * uiScale} color="rgba(255,100,100,0.8)" />
              <Text style={[styles.devText, { fontSize: 14 * uiScale }]}>Reset Pro Override</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={handleRestartOnboarding}>
              <RefreshCcw size={20 * uiScale} color="rgba(255,100,100,0.8)" />
              <Text style={[styles.devText, { fontSize: 14 * uiScale }]}>Restart Onboarding</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.version, { fontSize: 13 * uiScale }]}>RetroCam AI v1.0</Text>
          <Text style={[styles.copyright, { fontSize: 12 * uiScale }]}>Made with love for vintage photography</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,184,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
  },
  proIcon: {
    backgroundColor: 'rgba(255,184,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proInfo: {
    flex: 1,
    marginLeft: 12,
  },
  proTitle: {
    color: '#FFB800',
    fontWeight: '700',
  },
  proSubtitle: {
    color: '#888888',
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#FFB800',
  },
  upgradeText: {
    color: '#000000',
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#888888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
    borderRadius: 12,
  },
  rowText: {
    color: '#FFFFFF',
    flex: 1,
  },
  devText: {
    color: 'rgba(255,100,100,0.8)',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 4,
  },
  version: {
    color: '#666666',
  },
  copyright: {
    color: '#444444',
  },
});
