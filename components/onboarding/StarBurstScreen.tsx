import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  onComplete: () => void;
  title: string;
}

export const StarBurstScreen: React.FC<Props> = ({ onComplete, title }) => {
  const mascotScale = useRef(new Animated.Value(0.3)).current;
  const titleFade = useRef(new Animated.Value(0)).current;

  const starAnims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      op: new Animated.Value(0),
      sc: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.spring(mascotScale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();

    const burst = starAnims.map((s, i) => {
      const angle = (i / starAnims.length) * Math.PI * 2;
      const dist = 90 + Math.random() * 40;
      return Animated.parallel([
        Animated.timing(s.x, { toValue: Math.cos(angle) * dist, duration: 600, delay: i * 80, useNativeDriver: true }),
        Animated.timing(s.y, { toValue: Math.sin(angle) * dist, duration: 600, delay: i * 80, useNativeDriver: true }),
        Animated.timing(s.op, { toValue: 1, duration: 200, delay: i * 80, useNativeDriver: true }),
        Animated.spring(s.sc, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
      ]);
    });
    Animated.parallel(burst).start();

    Animated.timing(titleFade, {
      toValue: 1,
      duration: 500,
      delay: 500,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(onComplete, 2500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.burstContainer}>
        {starAnims.map((s, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.star,
              {
                opacity: s.op,
                transform: [{ translateX: s.x }, { translateY: s.y }, { scale: s.sc }],
              },
            ]}
          >
            {i % 2 === 0 ? '⭐️' : '✨'}
          </Animated.Text>
        ))}

        <Animated.Text style={[styles.mascot, { transform: [{ scale: mascotScale }] }]}>
          📸
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.title, { opacity: titleFade }]}>{title}</Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  burstContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  star: {
    position: 'absolute',
    fontSize: 24,
  },
  mascot: {
    fontSize: 80,
    zIndex: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
