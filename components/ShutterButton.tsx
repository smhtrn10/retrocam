import { useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ShutterButtonProps {
  onPress: () => void;
  disabled?: boolean;
  scale?: number;
}

export function ShutterButton({ onPress, disabled, scale: baseScale = 1 }: ShutterButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const innerScale = useRef(new Animated.Value(1)).current;

  const SIZE = 80 * baseScale;
  const MIDDLE_SIZE = 68 * baseScale;
  const INNER_SIZE = 58 * baseScale;

  const handlePressIn = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, friction: 6, tension: 200 }),
      Animated.spring(innerScale, { toValue: 0.85, useNativeDriver: true, friction: 6, tension: 200 }),
    ]).start();
  }, [scale, innerScale]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 150 }),
      Animated.spring(innerScale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 150 }),
    ]).start();
  }, [scale, innerScale]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={styles.hitArea}
    >
      <Animated.View style={[
        styles.outerRing,
        {
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          transform: [{ scale }],
          opacity: disabled ? 0.4 : 1
        }
      ]}>
        {/* Outer decorative ring */}
        <View style={[
          styles.middleRing,
          {
            width: MIDDLE_SIZE,
            height: MIDDLE_SIZE,
            borderRadius: MIDDLE_SIZE / 2,
          }
        ]}>
          <Animated.View style={[
            styles.innerCircle,
            {
              width: INNER_SIZE,
              height: INNER_SIZE,
              borderRadius: INNER_SIZE / 2,
              transform: [{ scale: innerScale }]
            }
          ]} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  middleRing: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    backgroundColor: '#FFFFFF',
  },
});
