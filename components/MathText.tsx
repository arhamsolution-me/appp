import React from 'react';
import { View, StyleSheet } from 'react-native';
import Katex from 'react-native-katex';
import { ThemedText } from './themed-text';

interface MathTextProps {
  content: string;
  textColor?: string;
  accentColor?: string;
  fontSize?: number;
}

export const MathText: React.FC<MathTextProps> = ({ 
  content, 
  textColor = '#000', 
  accentColor = '#3B82F6',
  fontSize = 16 
}) => {
  if (!content) return null;

  // Split by inline math $...$ and display math $$...$$
  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        if (!part) return null;

        const isDisplayMath = part.startsWith('$$') && part.endsWith('$$');
        const isInlineMath = part.startsWith('$') && part.endsWith('$');

        if (isDisplayMath || isInlineMath) {
          const expression = part.replace(/\$\$/g, '').replace(/\$/g, '').trim();
          
          return (
            <View key={index} style={isDisplayMath ? styles.displayMath : styles.inlineMath}>
              <Katex
                expression={expression}
                style={[
                    styles.katex, 
                    isDisplayMath ? { height: 60 } : { height: 30, width: (expression.length * 10) + 20 }
                ]}
                inlineStyle={`
                  body { 
                    color: ${textColor}; 
                    font-size: ${isDisplayMath ? fontSize + 4 : fontSize}px; 
                    background: transparent;
                  }
                `}
              />
            </View>
          );
        }

        return (
          <ThemedText 
            key={index} 
            style={{ 
              color: textColor, 
              fontSize: fontSize, 
              lineHeight: fontSize * 1.6,
              opacity: 0.9 
            }}
          >
            {part}
          </ThemedText>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  displayMath: {
    width: '100%',
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    padding: 15,
    borderRadius: 12,
  },
  inlineMath: {
    marginHorizontal: 4,
  },
  katex: {
    backgroundColor: 'transparent',
  },
});
