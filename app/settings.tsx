import { useState, useEffect, useCallback } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { markAppReviewed } from '@/utils/storeReview';
import { X, Crown, RefreshCcw, Mail, Shield, Star, Grid3x3, Volume2, VolumeX, Globe, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePurchases } from '@/hooks/usePurchases';
import { useDevice } from '@/hooks/useDevice';
import { SUPPORTED_LANGUAGES, setAppLanguage, type SupportedLanguage } from '@/i18n';

const SHOW_DEV_TOOLS = true ;

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { isPro, restorePurchases, showPaywall, subscriptionPlan, setOnboardingComplete, simulateDevPurchase, setIsProOverride } = usePurchases();
  const { isTablet, scale: uiScale } = useDevice();

  const [showGrid, setShowGrid] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const currentLang = (i18n.language || 'en').toLowerCase().split('-')[0];
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setAppLanguage(code);
    setLanguageModalVisible(false);
  };

  useEffect(() => {
    AsyncStorage.getItem('camera_grid_enabled').then((val) => {
      if (val !== null) setShowGrid(val === 'true');
    }).catch(() => {});
    AsyncStorage.getItem('camera_shutter_muted').then((val) => {
      if (val !== null) setIsMuted(val === 'true');
    }).catch(() => {});
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid((prev) => {
      const next = !prev;
      AsyncStorage.setItem('camera_grid_enabled', next ? 'true' : 'false').catch(() => {});
      return next;
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      AsyncStorage.setItem('camera_shutter_muted', next ? 'true' : 'false').catch(() => {});
      return next;
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

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
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
        await markAppReviewed();
      }
    } catch (e) {
      console.warn('Store review error:', e);
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
          <Text style={[styles.sectionTitle, { fontSize: 12 * uiScale }]}>{t('settings.language', 'Language')}</Text>

          <TouchableOpacity style={styles.row} onPress={() => setLanguageModalVisible(true)}>
            <Globe size={20 * uiScale} color="#FFB800" />
            <Text style={[styles.rowText, { fontSize: 16 * uiScale }]}>{t('settings.language', 'Language')}</Text>
            <Text style={[styles.valueText, { color: '#FFB800', fontSize: 14 * uiScale }]}>
              {currentLangObj.nativeName}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { paddingHorizontal: isTablet ? 0 : 16 }]}>
          <Text style={[styles.sectionTitle, { fontSize: 12 * uiScale }]}>Camera Controls</Text>

          <TouchableOpacity style={styles.row} onPress={toggleGrid}>
            <Grid3x3 size={20 * uiScale} color={showGrid ? "#FFB800" : "#888888"} />
            <Text style={[styles.rowText, { fontSize: 16 * uiScale }]}>Composition Grid (3x3)</Text>
            <Text style={[styles.valueText, { color: showGrid ? '#FFB800' : '#888888', fontSize: 13 * uiScale }]}>
              {showGrid ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={toggleMute}>
            {isMuted ? (
              <VolumeX size={20 * uiScale} color="#FF453A" />
            ) : (
              <Volume2 size={20 * uiScale} color="#888888" />
            )}
            <Text style={[styles.rowText, { fontSize: 16 * uiScale }]}>Shutter Sound</Text>
            <Text style={[styles.valueText, { color: isMuted ? '#FF453A' : '#4CD964', fontSize: 13 * uiScale }]}>
              {isMuted ? 'MUTED' : 'ON'}
            </Text>
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
          <Text style={[styles.version, { fontSize: 13 * uiScale }]}>RetroCam AI v1.0.2</Text>
          <Text style={[styles.copyright, { fontSize: 12 * uiScale }]}>Made with love for vintage photography</Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.language', 'Language')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={styles.modalCloseButton}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === currentLang;
                return (
                  <TouchableOpacity
                    style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                    onPress={() => handleSelectLanguage(item.code)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.languageNative, isSelected && { color: '#FFB800' }]}>
                        {item.nativeName}
                      </Text>
                      <Text style={styles.languageLabel}>{item.label}</Text>
                    </View>
                    {isSelected && <Check size={20} color="#FFB800" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
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
  valueText: {
    fontWeight: '700',
    letterSpacing: 0.5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  languageItemSelected: {
    backgroundColor: 'rgba(255,184,0,0.1)',
  },
  languageNative: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  languageLabel: {
    color: '#888888',
    fontSize: 13,
    marginTop: 2,
  },
});
