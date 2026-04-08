import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Alert } from 'react-native';
import { router } from 'expo-router';
import { usePurchases } from '@/hooks/usePurchases';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '@/i18n';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { ChatBubble } from '@/components/onboarding/ChatBubble';
import { MascotCharacter } from '@/components/onboarding/MascotCharacter';
import { OptionCards } from '@/components/onboarding/OptionCards';
import { BuildingScreen } from '@/components/onboarding/BuildingScreen';
import { FeatureSlides } from '@/components/onboarding/FeatureSlides';
import { StarBurstScreen } from '@/components/onboarding/StarBurstScreen';
import { PremiumIntroScreen } from '@/components/onboarding/PremiumIntroScreen';
import { PermissionScreen } from '@/components/onboarding/PermissionScreen';
import PaywallModal from './paywall';

type OnboardingPhase = 'welcome' | 'permissions' | 'chat' | 'building' | 'features' | 'starburst' | 'premiumIntro';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { setOnboardingComplete, showPaywall, isOnboardingComplete: isComplete } = usePurchases();
  
  const [phase, setPhase] = useState<OnboardingPhase>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Language check on mount
  useEffect(() => {
    const checkLang = async () => {
      const systemLang = Localization.getLocales()[0]?.languageCode || 'en';
      if (systemLang !== 'en' && i18n.language === 'en') {
        Alert.alert(
          t('onboarding.lang_approval.title', 'Language Detection'),
          t('onboarding.lang_approval.desc', 'Switch language?'),
          [
            { text: 'No', style: 'cancel' },
            { 
              text: 'Yes', 
              onPress: async () => {
                await i18n.changeLanguage(systemLang);
                await AsyncStorage.setItem('user-language', systemLang);
              } 
            }
          ]
        );
      }
    };
    checkLang();
  }, [t]);



  const QUESTIONS = [
    { id: 1, type: 'single', q: 'questions.1.q', options: 'questions.1.options' },
    { id: 2, type: 'single', q: 'questions.2.q', options: 'questions.2.options' },
    { id: 3, type: 'single', q: 'questions.3.q', options: 'questions.3.options' },
    { id: 4, type: 'single', q: 'questions.4.q', options: 'questions.4.options' }
  ];

  const transitionTo = (nextPhase: OnboardingPhase, cb?: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setPhase(nextPhase);
      if (cb) cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const handleOptionSelect = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }));
    setOptionsVisible(false);
    
    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length) {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setCurrentQuestion(prev => prev + 1);
          Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
        });
      } else {
        transitionTo('building');
      }
    }, 300);
  };

  const renderActivePhase = () => {
    switch (phase) {
      case 'welcome':
        return (
          <WelcomeScreen 
            onContinue={() => transitionTo('permissions')}
            title={t('onboarding.welcome_title', 'RetroCam AI')}
            subtitle={t('onboarding.welcome_subtitle', 'Shoot authentic analog.')}
            buttonText={t('onboarding.start', 'Get Started')}
          />
        );
      case 'permissions':
        return (
          <PermissionScreen
            onContinue={() => transitionTo('chat')}
          />
        );
      case 'chat':
        const qData = QUESTIONS[currentQuestion - 1];
        const optionsList = t(qData.options, { returnObjects: true }) as string[];

        return (
          <View style={styles.chatPhase}>
            <MascotCharacter emoji="📸" triggerAnimation={currentQuestion} />
            <ChatBubble 
              key={currentQuestion}
              text={t(qData.q, 'Question?')}
              onComplete={() => setOptionsVisible(true)}
              typingSpeed={25}
            />
            <OptionCards 
              options={optionsList}
              visible={optionsVisible}
              onSelect={handleOptionSelect}
            />
          </View>
        );
      case 'building':
        return (
          <BuildingScreen 
            title={t('onboarding.building_title', 'Setting up...')}
            subtitle={t('onboarding.building_subtitle', 'Calibrating filters')}
            onComplete={() => transitionTo('features')}
          />
        );
      case 'features':
        return (
          <FeatureSlides 
            onComplete={() => transitionTo('starburst')}
          />
        );
      case 'starburst':
        return (
          <StarBurstScreen 
            title={t('onboarding.starburst_title', 'Cameras Ready! 🎉')}
            onComplete={() => transitionTo('premiumIntro')}
          />
        );
      case 'premiumIntro':
        return (
          <PremiumIntroScreen 
            onContinue={async () => {
              await setOnboardingComplete(true);
              router.replace('/paywall');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderActivePhase()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  chatPhase: {
    flex: 1,
    paddingTop: 80,
    backgroundColor: '#000',
  }
});
