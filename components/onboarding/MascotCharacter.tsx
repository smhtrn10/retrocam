import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

interface Props {
  triggerAnimation?: number;
  size?: number;
  emoji?: string;
}

export const MascotCharacter: React.FC<Props> = ({ triggerAnimation, size = 120, emoji }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    bounceAnim.setValue(0);
    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [triggerAnimation, bounceAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: bounceAnim },
            {
              translateY: bounceAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [20, -10, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Glow Effect behind the character */}
      <View style={styles.glow} />
      
      {emoji && (
        <View style={styles.emojiContainer}>
          <Animated.Text style={styles.emojiText}>{emoji}</Animated.Text>
        </View>
      )}

      <Image
        source={require('@/assets/images/caracter.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 20,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD166',
    top: '20%',
    opacity: 0.3,
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
  },
  emojiContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#333',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD166',
    zIndex: 10,
  },
  emojiText: {
    fontSize: 20,
  },
});
