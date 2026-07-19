import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { CTAButton, FadeInUp } from './components';
import { OB2_COLORS } from './theme';

interface Props {
  onDone: () => void;
}

const PERMISSIONS = [
  { icon: '📷', key: 'camera' },
  { icon: '🎙️', key: 'microphone' },
  { icon: '🖼️', key: 'gallery' },
] as const;

// Permission screen matching onboarding2 design system
export const PermissionScreen: React.FC<Props> = ({ onDone }) => {
  const { t } = useTranslation();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [libraryPermission, setLibraryPermission] = useState<{ granted: boolean } | null>(null);

  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExpoGo, setIsExpoGo] = useState(false);

  useEffect(() => {
    const checkMedia = async () => {
      try {
        const result = await MediaLibrary.getPermissionsAsync();
        setLibraryPermission(result);
      } catch (e: any) {
        if (e?.message?.includes('Expo Go')) {
          setIsExpoGo(true);
          setLibraryPermission({ granted: true });
        }
      }
    };
    checkMedia();
  }, []);

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  const alreadyGranted = cameraPermission?.granted && micPermission?.granted && libraryPermission?.granted;

  useEffect(() => {
    if (alreadyGranted) {
      setGranted(true);
      showCheckmark();
    }
  }, [alreadyGranted]);

  const showCheckmark = () => {
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAllow = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const camResult = await requestCameraPermission();
      const micResult = await requestMicPermission();

      let libResult = { granted: false };
      try {
        if (!isExpoGo) {
          libResult = await MediaLibrary.requestPermissionsAsync();
        } else {
          libResult = { granted: true };
        }
      } catch (error: any) {
        // Expo Go limitation - skip MediaLibrary permission
        if (error?.message?.includes('Expo Go')) {
          console.warn('Expo Go detected: MediaLibrary permission skipped');
          setIsExpoGo(true);
          libResult = { granted: true };
        } else {
          throw error;
        }
      }
      setLibraryPermission(libResult);

      if (camResult.granted && micResult.granted && libResult.granted) {
        setGranted(true);
        showCheckmark();
        // Auto continue after animation
        setTimeout(() => {
          onDone();
        }, 1200);
      }
    } catch (e) {
      console.error('Permission error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <FadeInUp>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>📷</Text>
          </View>
        </FadeInUp>

        <FadeInUp delay={120}>
          <Text style={styles.title}>
            {t('onboarding2.permission.title', 'Camera Access')}
          </Text>
          <Text style={styles.subtitle}>
            {t(
              'onboarding2.permission.subtitle',
              'RetroCam needs access to your camera, microphone, and gallery to capture and save vintage photos and videos.'
            )}
          </Text>
        </FadeInUp>

        {isExpoGo && (
          <FadeInUp delay={200}>
            <View style={styles.expoWarning}>
              <Text style={styles.expoWarningText}>
                ⚠️ {t('onboarding2.permission.expo_warning', 'Expo Go: Gallery permissions limited')}
              </Text>
            </View>
          </FadeInUp>
        )}

        <View style={styles.permissions}>
          {PERMISSIONS.map((p, i) => (
            <FadeInUp key={p.key} delay={250 + i * 100}>
              <View style={styles.permissionRow}>
                <View style={styles.permissionIconWrap}>
                  <Text style={styles.permissionIcon}>{p.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.permissionTitle}>
                    {t(`onboarding2.permission.${p.key}.title`, p.key)}
                  </Text>
                  <Text style={styles.permissionDesc}>
                    {t(`onboarding2.permission.${p.key}.desc`, '')}
                  </Text>
                </View>
              </View>
            </FadeInUp>
          ))}
        </View>

        {/* Success checkmark */}
        {granted && !isExpoGo && (
          <Animated.View
            style={[
              styles.checkmark,
              {
                opacity: checkOpacity,
                transform: [{ scale: checkScale }],
              },
            ]}
          >
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
            <Text style={styles.checkLabel}>
              {t('onboarding2.permission.granted', 'All Set!')}
            </Text>
          </Animated.View>
        )}
      </View>

      {!granted && (
        <FadeInUp delay={600}>
          <CTAButton
            label={
              loading
                ? t('onboarding2.permission.requesting', 'Requesting…')
                : t('onboarding2.permission.allow', 'Allow & Continue')
            }
            onPress={handleAllow}
            disabled={loading}
          />
        </FadeInUp>
      )}

      {granted && (
        <FadeInUp delay={400}>
          <TouchableOpacity style={styles.skipBtn} onPress={onDone}>
            <Text style={styles.skipText}>
              {t('onboarding2.permission.skip', 'Continue →')}
            </Text>
          </TouchableOpacity>
        </FadeInUp>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: `${OB2_COLORS.primary}15`,
    borderWidth: 2,
    borderColor: `${OB2_COLORS.primary}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    color: OB2_COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: OB2_COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  expoWarning: {
    backgroundColor: `${OB2_COLORS.warning}15`,
    borderWidth: 1,
    borderColor: `${OB2_COLORS.warning}40`,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  expoWarningText: {
    color: OB2_COLORS.warning,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  permissions: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: OB2_COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OB2_COLORS.cardBorder,
  },
  permissionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${OB2_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIcon: {
    fontSize: 20,
  },
  permissionTitle: {
    color: OB2_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  permissionDesc: {
    color: OB2_COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  checkmark: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: OB2_COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: OB2_COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  checkIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
  },
  checkLabel: {
    color: OB2_COLORS.success,
    fontSize: 15,
    fontWeight: '700',
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  skipText: {
    color: OB2_COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
