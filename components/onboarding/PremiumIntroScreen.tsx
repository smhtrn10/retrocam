import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Crown, Play } from 'lucide-react-native';

interface Props {
  onContinue: () => void;
}

export const PremiumIntroScreen: React.FC<Props> = ({ onContinue }) => {
  const { t } = useTranslation();
  
  const titleOp = useRef(new Animated.Value(0)).current;
  const featuresAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  const btnOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.stagger(150, featuresAnims.map(anim => 
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true })
      )),
      Animated.timing(btnOp, { toValue: 1, duration: 400, useNativeDriver: true })
    ]).start();
  }, []);

  const features = [
    { icon: '🚀', title: t('premium_intro.f1_title', 'Infinite Resolution'), desc: t('premium_intro.f1_desc', 'Export in maximum quality without compression') },
    { icon: '✨', title: t('premium_intro.f2_title', 'No Watermarks'), desc: t('premium_intro.f2_desc', 'Clean and professional exports') },
    { icon: '🎥', title: t('premium_intro.f3_title', 'All Cameras'), desc: t('premium_intro.f3_desc', 'VHS, 8mm, Polaroid and more') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.header, { opacity: titleOp }]}>
          <Crown size={56} color="#FFD166" />
          <Text style={styles.title}>{t('premium_intro.title', 'Go Premium')}</Text>
          <Text style={styles.subtitle}>{t('premium_intro.subtitle', 'Unlock all 40+ cameras')}</Text>
        </Animated.View>

        <View style={styles.featureList}>
          {features.map((f, i) => (
            <Animated.View 
              key={i} 
              style={[
                styles.featureCard, 
                { 
                  opacity: featuresAnims[i],
                  transform: [{
                    translateY: featuresAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.icon}>{f.icon}</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

      </ScrollView>

      <Animated.View style={[styles.footer, { opacity: btnOp }]}>
        <TouchableOpacity style={styles.btn} onPress={onContinue}>
          <Text style={styles.btnText}>{t('onboarding.continue', 'Continue')}</Text>
          <Play size={16} fill="#000" color="#000" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#FFD166',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    textAlign: 'center',
  },
  featureList: {
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  icon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  btn: {
    flexDirection: 'row',
    backgroundColor: '#FFD166',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
});
