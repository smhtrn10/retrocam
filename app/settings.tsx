import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Crown, RefreshCcw, Mail, Shield } from 'lucide-react-native';
import { usePurchases } from '@/hooks/usePurchases';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { isPro, restorePurchases, showPaywall, subscriptionPlan, setOnboardingComplete, simulateDevPurchase } = usePurchases();

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* PR-1: isPro ise aktif plan göster, değilse upgrade banner */}
        {isPro ? (
          <View style={styles.proBanner}>
            <View style={styles.proIcon}>
              <Crown size={32} color="#FFB800" />
            </View>
            <View style={styles.proInfo}>
              <Text style={styles.proTitle}>{t('settings.pro_title')}</Text>
              <Text style={styles.proSubtitle}>
                {/* PR-1: null fallback ile plan adı göster */}
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
          <View style={styles.proBanner}>
            <View style={styles.proIcon}>
              <Crown size={32} color="#FFB800" />
            </View>
            <View style={styles.proInfo}>
              <Text style={styles.proTitle}>{t('settings.pro_title')}</Text>
              <Text style={styles.proSubtitle}>
                {t('settings.pro_subtitle')}
              </Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeText}>{t('settings.upgrade')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>

          {/* PR-3: Restore purchases settings'te erişilebilir */}
          <TouchableOpacity style={styles.row} onPress={handleRestore}>
            <RefreshCcw size={20} color="#888888" />
            <Text style={styles.rowText}>{t('settings.restore')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>


          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://semihtrn4.github.io/retrocam_privacy/')}>
            <Mail size={20} color="#888888" />
            <Text style={styles.rowText}>{t('settings.contact')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://semihtrn4.github.io/retrocam_privacy/')}>
            <Shield size={20} color="#888888" />
            <Text style={styles.rowText}>{t('settings.privacy', 'Privacy Policy')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Shield size={20} color="#888888" />
            <Text style={styles.rowText}>{t('settings.terms', 'Terms of Use')}</Text>
          </TouchableOpacity>
        </View>

        {/* DEV Tools — sadece __DEV__ modunda görünür */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEV Tools</Text>
            <TouchableOpacity style={styles.row} onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              void simulateDevPurchase();
            }}>
              <Crown size={20} color="rgba(255,100,100,0.8)" />
              <Text style={styles.devText}>Simulate Pro Purchase</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} onPress={handleRestartOnboarding}>
              <RefreshCcw size={20} color="rgba(255,100,100,0.8)" />
              <Text style={styles.devText}>Restart Onboarding</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.version}>RetroCam AI v1.0</Text>
          <Text style={styles.copyright}>Made with love for vintage photography</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,184,0,0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
  },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 16,
    fontWeight: '700',
  },
  proSubtitle: {
    color: '#888888',
    fontSize: 13,
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  upgradeText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 13,
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
    fontSize: 16,
    flex: 1,
  },
  devText: {
    color: 'rgba(255,100,100,0.8)',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 4,
  },
  version: {
    color: '#666666',
    fontSize: 13,
  },
  copyright: {
    color: '#444444',
    fontSize: 12,
  },
});
