import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import { useDevice } from '@/hooks/useDevice';

interface Props {
  onContinue: () => void;
  title: string;
  subtitle: string;
  buttonText: string;
}

export const WelcomeScreen: React.FC<Props> = ({ onContinue, title, subtitle, buttonText }) => {
  const { isTablet, scale } = useDevice();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(40)).current;
  const subtitleOp = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(titleSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(subtitleOp, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(btnSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const imageSize = isTablet ? 320 : 220;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#181822', '#000000']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.heroSection}>
        <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
          <Image
            source={require('@/assets/images/caracter.png')}
            style={{ width: imageSize, height: imageSize }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <View style={[styles.contentSection, { paddingHorizontal: isTablet ? 80 : 30 }]}>
        <Animated.View style={{ transform: [{ translateY: titleSlide }], opacity: opacityAnim }}>
          <Text style={[styles.title, { fontSize: isTablet ? 56 : 42 }]}>{title}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: subtitleOp }}>
          <Text style={[styles.subtitle, { fontSize: isTablet ? 20 : 16 }]}>{subtitle}</Text>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: btnSlide }], opacity: opacityAnim, width: '100%', alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.button, { paddingVertical: isTablet ? 22 : 18, paddingHorizontal: isTablet ? 60 : 40 }]}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { fontSize: isTablet ? 22 : 18 }]}>{buttonText}</Text>
            <Play size={isTablet ? 22 : 18} color="#000" fill="#000" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    flex: 0.55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    flex: 0.45,
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 50,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#FFD166',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '90%',
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
  },
});
