import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  onComplete: () => void;
  title: string;
  subtitle: string;
}

export const BuildingScreen: React.FC<Props> = ({ onComplete, title, subtitle }) => {
  const bars = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const anims = bars.map((bar, i) =>
      Animated.timing(bar, {
        toValue: 1,
        duration: 1500 + i * 400,
        useNativeDriver: false, // width requires false
      })
    );

    Animated.parallel(anims).start();

    const timeout = setTimeout(onComplete, 2800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <Text style={styles.emoji}>⚙️</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.progressContainer}>
        {bars.map((bar, i) => (
          <View key={i} style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: bar.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#000',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 30,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 50,
  },
  progressContainer: {
    width: '100%',
    gap: 15,
  },
  barTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFD166',
    borderRadius: 3,
  },
});
