import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../hooks/use-app-theme';
import { StatCard } from '../components/dashboard/StatCard';
import { PerformanceChart } from '../components/dashboard/PerformanceChart';
import { ActivityHistory } from '../components/dashboard/ActivityHistory';
import { AIInsightsCard } from '../components/dashboard/AIInsightsCard';
import { useUserActivity } from '../context/UserActivityContext';

export const DashboardScreen = () => {
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const router = useRouter();
  const { 
    stats, 
    activities, 
    studyTimeLineData, 
    performanceInsights, 
    loading 
  } = useDashboardData();
  const { refreshStats } = useUserActivity();

  if (loading && activities.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#020617' : '#F8FAFC' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.loadingText, { color: theme.gray }]}>Accessing Academic Vault...</Text>
      </View>
    );
  }

  const hasData = activities.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#020617' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* 1. Sticky Header with Back Button */}
      <View style={[styles.stickyHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF' }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Dashboard</Text>
        <TouchableOpacity onPress={refreshStats} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshStats} colors={['#3B82F6']} />
        }
      >
        {!hasData ? (
          <View style={styles.emptyState}>
             <View style={styles.emptyIconCircle}>
                <Ionicons name="analytics" size={40} color={theme.gray} />
             </View>
             <Text style={[styles.emptyTitle, { color: theme.text }]}>No Activity Tracked Yet</Text>
             <Text style={[styles.emptyDesc, { color: theme.gray }]}>
                Start using tools like Math Solver or Text Extractor to begin generating your academic profile.
             </Text>
             <TouchableOpacity 
                style={[styles.ctaBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.back()}
              >
                <Text style={styles.ctaText}>START LEARNING</Text>
             </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 2. Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard label="Tasks Done" value={stats.totalTasks} icon="checkbox-outline" color="#10B981" />
              <StatCard label="Study Time" value={`${stats.totalStudyTime}m`} icon="time-outline" color="#3B82F6" />
              <StatCard label="Avg Score" value={`${Math.round(stats.avgAccuracy)}%`} icon="trending-up-outline" color="#F59E0B" />
              <StatCard label="Streak" value={`${stats.streak}d`} icon="flame-outline" color="#EC4899" />
            </View>

            {/* 3. AI Insights (Only if >= 3 sessions) */}
            {performanceInsights.hasEnoughData && (
              <AIInsightsCard insights={{ ...performanceInsights, avgAccuracy: stats.avgAccuracy, streak: stats.streak }} />
            )}

            {/* 4. Study Time Graph */}
            <PerformanceChart title="Study Minutes (Last 7 Days)" data={studyTimeLineData} type="line" />

            {/* 5. Recent Activity List */}
            <ActivityHistory activities={activities} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, fontWeight: '600' },
  stickyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.1)' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  refreshBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(128,128,128,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 40, marginBottom: 30 },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  ctaText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});

