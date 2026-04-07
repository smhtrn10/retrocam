import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  text: string;
  onComplete: () => void;
  typingSpeed?: number;
}

export const ChatBubble: React.FC<Props> = ({ text, onComplete, typingSpeed = 28 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
      }, typingSpeed);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [index, text, typingSpeed, onComplete]);

  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>{displayedText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    maxWidth: '90%',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 30,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 32,
  },
});
