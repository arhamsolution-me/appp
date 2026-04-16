import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../hooks/use-app-theme';

interface AIInsightsCardProps {
  insights: {
    strongest: string | null;
    weakest: string | null;
    avgAccuracy: number;
    streak: number;
  };
}

export const AIInsightsCard = ({ insights }: AIInsightsCardProps) => {
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];

  const getInsightText = () => {
    if (!insights.strongest) return "Keep using EduAI to unlock personalized learning insights and performance patterns!";
    
    let text = `You're excelling in ${insights.strongest.toUpperCase()}. `;
    
    if (insights.weakest) {
      text += `Consider focusing more on ${insights.weakest.toUpperCase()} to balance your profile. `;
    }
    
    if (insights.avgAccuracy > 80) {
      text += "Your high accuracy shows strong conceptual grasp!";
    } else if (insights.streak > 3) {
      text += `Amazing ${insights.streak}-day streak! Consistency is the key to long-term memory.`;
    }
    
    return text;
  };

  return (
    <LinearGradient
      colors={isDark ? ['#1E293B', '#0F172A'] : ['#E0F2FE', '#F0F9FF']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <Ionicons name="sparkles" size={20} color="#3B82F6" />
        <Text style={[styles.title, { color: '#3B82F6' }]}>SMART INSIGHTS</Text>
      </View>
      
      <Text style={[styles.mainText, { color: theme.text }]}>
        {getInsightText()}
      </Text>
      
      <View style={styles.tipRow}>
        <View style={[styles.tipBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.8)' }]}>
          <Text style={[styles.tipText, { color: theme.gray }]}>
            💡 Pro Tip: Short frequent sessions beat long cramps.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  mainText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
  },
  tipBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
