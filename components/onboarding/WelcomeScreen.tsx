import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  onContinue: () => void;
  title: string;
  subtitle: string;
  buttonText: string;
}

export const WelcomeScreen: React.FC<Props> = ({ onContinue, title, subtitle, buttonText }) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(40)).current;
  const subtitleOp = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(subtitleOp, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(btnSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#181822', '#000000']} style={StyleSheet.absoluteFillObject} />

      {/* Hero Visual */}
      <View style={styles.heroSection}>
        <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
           <Image
             source={require('@/assets/images/caracter.png')}
             style={styles.splashImage}
             resizeMode="contain"
           />
        </Animated.View>

        {/* Floating elements can be placed around here */}
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <Animated.View style={{ transform: [{ translateY: titleSlide }], opacity: opacityAnim }}>
          <Text style={styles.title}>{title}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: subtitleOp }}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
        
        <Animated.View style={{ transform: [{ translateY: btnSlide }], opacity: opacityAnim, width: '100%', alignItems: 'center' }}>
          <TouchableOpacity style={styles.button} onPress={onContinue} activeOpacity={0.8}>
            <Text style={styles.buttonText}>{buttonText}</Text>
            <Play size={18} color="#000" fill="#000" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    flex: 0.55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: 220,
    height: 220,
  },
  contentSection: {
    flex: 0.45,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 50,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#FFD166',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '90%',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
});
