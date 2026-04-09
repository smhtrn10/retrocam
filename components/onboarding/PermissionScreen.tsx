import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

interface Props {
  onContinue: () => void;
}

export const PermissionScreen: React.FC<Props> = ({ onContinue }) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [libraryPermission, requestLibraryPermission] = MediaLibrary.usePermissions();
  
  const alreadyGranted = cameraPermission?.granted && micPermission?.granted && libraryPermission?.granted;
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  const tickScale = React.useRef(new Animated.Value(0)).current;
  const tickOp = React.useRef(new Animated.Value(0)).current;
  const btnOp = React.useRef(new Animated.Value(alreadyGranted ? 1 : 0)).current;

  // If already granted on mount, show tick immediately
  React.useEffect(() => {
    if (alreadyGranted) {
      setGranted(true);
      tickScale.setValue(1);
      tickOp.setValue(1);
      btnOp.setValue(1);
    }
  }, [alreadyGranted]);

  const handleAllow = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const camResult = await requestCameraPermission();
      const micResult = await requestMicPermission();
      const libResult = await requestLibraryPermission();

      if (camResult.granted && micResult.granted && libResult.granted) {
        setGranted(true);
        Animated.sequence([
          Animated.parallel([
            Animated.spring(tickScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
            Animated.timing(tickOp, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]),
          Animated.timing(btnOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
      }
      // if denied, granted stays false — Continue button stays disabled
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#181822', '#000000']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <Camera size={56} color="#FFD166" />
        </View>
      </View>

      <Text style={styles.title}>Access Required</Text>
      <Text style={styles.subtitle}>
        RetroCam needs access to your camera, microphone, and gallery to capture and save retro-style photos and videos.
      </Text>

      <View style={styles.permissionList}>
        <View style={styles.permRow}>
          <Text style={styles.permIcon}>📷</Text>
          <View>
            <Text style={styles.permTitle}>Camera</Text>
            <Text style={styles.permDesc}>Capture photos & videos</Text>
          </View>
        </View>
        <View style={styles.permRow}>
          <Text style={styles.permIcon}>🎙️</Text>
          <View>
            <Text style={styles.permTitle}>Microphone</Text>
            <Text style={styles.permDesc}>Record audio with video</Text>
          </View>
        </View>
        <View style={styles.permRow}>
          <Text style={styles.permIcon}>🖼️</Text>
          <View>
            <Text style={styles.permTitle}>Gallery</Text>
            <Text style={styles.permDesc}>Save & edit your shots</Text>
          </View>
        </View>
      </View>

      {/* Tick animation */}
      {granted && (
        <Animated.View style={[styles.tickWrap, { opacity: tickOp, transform: [{ scale: tickScale }] }]}>
          <View style={styles.tickCircle}>
            <Text style={styles.tickIcon}>✓</Text>
          </View>
          <Text style={styles.tickLabel}>Permission Granted</Text>
        </Animated.View>
      )}

      {/* Allow button — shown when not yet granted */}
      {!granted && (
        <TouchableOpacity
          style={[styles.allowBtn, loading && styles.allowBtnDisabled]}
          onPress={handleAllow}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.allowBtnText}>{loading ? 'Requesting...' : 'Allow Access'}</Text>
        </TouchableOpacity>
      )}

      {/* Continue button — only active after permission granted */}
      <Animated.View style={{ width: '100%', alignItems: 'center', opacity: granted ? btnOp : 0 }}>
        <TouchableOpacity
          style={[styles.continueBtn, !granted && styles.continueBtnDisabled]}
          onPress={granted ? onContinue : undefined}
          disabled={!granted}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  iconWrap: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,209,102,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,209,102,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 36,
  },
  permissionList: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  permIcon: { fontSize: 28 },
  permTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  permDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },

  tickWrap: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  tickCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#06D6A0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06D6A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  tickIcon: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  tickLabel: { color: '#06D6A0', fontSize: 14, fontWeight: '700' },

  allowBtn: {
    backgroundColor: '#FFD166',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginBottom: 16,
    width: '90%',
    alignItems: 'center',
  },
  allowBtnDisabled: { opacity: 0.6 },
  allowBtnText: { color: '#000', fontSize: 17, fontWeight: '800' },

  continueBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  continueBtnDisabled: { opacity: 0.3 },
  continueBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
