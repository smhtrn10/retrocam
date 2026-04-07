import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface Props {
  options: string[];
  visible: boolean;
  onSelect: (value: string) => void;
  selectedValue?: string;
}

export const OptionCards: React.FC<Props> = ({ options, visible, onSelect, selectedValue }) => {
  const animations = useRef(options.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      const anims = options.map((_, i) =>
        Animated.parallel([
          Animated.timing(animations[i], {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      );
      Animated.stagger(80, anims).start();
    } else {
      animations.forEach((anim) => anim.setValue(0));
    }
  }, [visible, animations, options]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {options.map((opt, i) => {
        const isSelected = selectedValue === opt;
        return (
          <Animated.View
            key={i}
            style={[
              {
                opacity: animations[i],
                transform: [
                  {
                    translateY: animations[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(opt)}
              activeOpacity={0.8}
            >
              <Text style={[styles.text, isSelected && styles.textSelected]}>{opt}</Text>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardSelected: {
    borderColor: '#FFD166',
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
  },
  text: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
  },
  textSelected: {
    color: '#FFD166',
    fontWeight: '700',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FFD166',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD166',
  },
});
