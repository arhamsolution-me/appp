import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../hooks/use-app-theme';
import { UserActivity, ActivityType } from '../../services/analyticsService';

interface ActivityHistoryProps {
  activities: UserActivity[];
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'math': return { name: 'calculator-outline', color: '#10B981' };
    case 'quiz': return { name: 'help-circle-outline', color: '#3B82F6' };
    case 'essay': return { name: 'document-text-outline', color: '#F59E0B' };
    case 'grammar': return { name: 'language-outline', color: '#6366F1' };
    case 'summarizer': return { name: 'library-outline', color: '#EC4899' };
    default: return { name: 'flash-outline', color: '#8B5CF6' };
  }
};

const ActivityItem = ({ item }: { item: UserActivity }) => {
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const icon = getActivityIcon(item.type);

  return (
    <View style={[styles.itemContainer, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
      <View style={[styles.iconBox, { backgroundColor: icon.color + '15' }]}>
        <Ionicons name={icon.name as any} size={20} color={icon.color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{item.details}</Text>
        <Text style={[styles.date, { color: theme.gray }]}>
          {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {item.score !== undefined && (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{item.score}%</Text>
        </View>
      )}
    </View>
  );
};

export const ActivityHistory = ({ activities }: ActivityHistoryProps) => {
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>RECENT ACTIVITY</Text>
      
      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-clear-outline" size={40} color={theme.gray} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: theme.gray }]}>No activities tracked yet.</Text>
        </View>
      ) : (
        activities.slice(0, 10).map((item, index) => (
          <ActivityItem key={item.id || index.toString()} item={item} />
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  date: {
    fontSize: 11,
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
});
