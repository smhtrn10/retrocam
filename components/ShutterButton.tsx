import { useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ShutterButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function ShutterButton({ onPress, disabled }: ShutterButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const innerScale = useRef(new Animated.Value(1)).current;

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
      <Animated.View style={[styles.outerRing, { transform: [{ scale }], opacity: disabled ? 0.4 : 1 }]}>
        {/* Outer decorative ring */}
        <View style={styles.middleRing}>
          <Animated.View style={[styles.innerCircle, { transform: [{ scale: innerScale }] }]} />
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
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  middleRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
});
