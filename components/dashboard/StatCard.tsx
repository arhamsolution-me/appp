import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../hooks/use-app-theme';

const { width } = Dimensions.get('window');

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const StatCard = ({ label, value, icon, color }: StatCardProps) => {
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];

  return (
    <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.label, { color: theme.gray }]}>{label.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: (width - 60) / 2,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
