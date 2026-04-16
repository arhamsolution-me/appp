import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../hooks/use-app-theme';

const { width } = Dimensions.get('window');

interface ChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: { data: number[] }[];
  };
  type?: 'line' | 'bar';
}

export const PerformanceChart = ({ title, data, type = 'line' }: ChartProps) => {
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];

  const chartConfig = {
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    backgroundGradientFrom: isDark ? '#1E293B' : '#FFFFFF',
    backgroundGradientTo: isDark ? '#0F172A' : '#F8FAFC',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  const ChartComponent = type === 'line' ? LineChart : BarChart;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title.toUpperCase()}</Text>
      <ChartComponent
        data={data}
        width={width - 40} // from react-native
        height={220}
        yAxisLabel=""
        yAxisSuffix="m"
        chartConfig={chartConfig}
        bezier={type === 'line'}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        fromZero
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 16,
    paddingLeft: 4,
  },
});
