import { GlobalHeader } from '@/components/GlobalHeader';
import { RichTextRenderer } from '@/components/RichTextRenderer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { useHistory, HistoryItem } from '@/context/HistoryContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { t } = useLanguage();
  const { history, loading, removeFromHistory, clearHistory } = useHistory();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const FILTERS = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'math', label: 'Math', icon: 'calculator', color: '#10B981' },
    { id: 'summarizer', label: 'Summary', icon: 'library', color: '#EC4899' },
    { id: 'writer', label: 'Writing', icon: 'pencil-outline', color: '#F59E0B' },
    { id: 'grammar', label: 'Grammar', icon: 'text-outline', color: '#6366F1' },
    { id: 'quiz', label: 'Quizzes', icon: 'help-circle-outline', color: '#8B5CF6' },
  ];

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const toolType = item.toolId.toLowerCase();
      const matchesFilter = activeFilter === 'all' || toolType.includes(activeFilter);
      const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.toolTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [history, activeFilter, searchQuery]);

  const handleClear = () => {
    Alert.alert(
      "Clear All History?",
      "This will remove ALL local discoveries from your device. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: clearHistory }
      ]
    );
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert("Delete Item?", "Remove this discovery?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeFromHistory(id) }
    ]);
  };

  const HistoryCard = ({ item }: { item: HistoryItem }) => {
    const config = FILTERS.find(f => item.toolId.toLowerCase().includes(f.id)) || FILTERS[0];
    const date = new Date(item.timestamp);

    return (
      <Animated.View 
        layout={Layout.springify()} 
        entering={FadeInDown.duration(400)}
      >
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => {
            setSelectedItem(item);
            setModalVisible(true);
          }}
          style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0' }]}
        >
          <View style={styles.cardHeader}>
             <View style={[styles.iconBox, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.icon as any} size={16} color={config.color} />
             </View>
             <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.toolTitle, { color: theme.text }]}>{item.toolTitle}</ThemedText>
                <ThemedText style={[styles.actionLabel, { color: theme.gray }]}>{item.action}</ThemedText>
             </View>
             <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ opacity: 0.6 }} />
             </TouchableOpacity>
          </View>

          <ThemedText style={[styles.previewText, { color: theme.gray }]} numberOfLines={2}>
            {item.content.replace(/<[^>]*>/g, '').trim()}
          </ThemedText>

          <View style={styles.cardFooter}>
             <ThemedText style={[styles.dateText, { color: theme.gray }]}>
               {date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </ThemedText>
             <Ionicons name="chevron-forward" size={16} color={theme.gray} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#020617' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <GlobalHeader title="Discoveries" />

      <View style={styles.searchBarWrapper}>
         <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
            <Ionicons name="search-outline" size={20} color={theme.gray} />
            <TextInput 
              placeholder="Search past results..." 
              style={[styles.searchInput, { color: theme.text }]}
              placeholderTextColor={theme.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {history.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearBadge}>
                 <ThemedText style={styles.clearBadgeText}>CLEAR</ThemedText>
              </TouchableOpacity>
            )}
         </View>
      </View>

      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item: filter }) => {
            const active = activeFilter === filter.id;
            return (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setActiveFilter(filter.id)}
                style={[styles.filterBtn, active && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              >
                <Ionicons name={filter.icon as any} size={14} color={active ? '#FFF' : (filter.color || theme.gray)} style={{ marginRight: 6 }} />
                <ThemedText style={[styles.filterText, { color: active ? '#FFF' : theme.text }]}>{filter.label}</ThemedText>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}><ActivityIndicator color={theme.primary} size="large" /></View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryCard item={item} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="time-outline" size={80} color={theme.gray} style={{ opacity: 0.2 }} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Discoveries Yet</ThemedText>
              <ThemedText style={{ color: theme.gray, textAlign: 'center', opacity: 0.6 }}>Your local AI history will appear here.</ThemedText>
            </View>
          }
        />
      )}

      {/* RESULT VIEW MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? '#020617' : '#FFFFFF' }]}>
          <LinearGradient colors={[theme.primary + '15', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={{ paddingTop: insets.top + 20, flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                 <Ionicons name="chevron-down" size={24} color={theme.primary} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <ThemedText style={styles.modalTypeBadge}>{selectedItem?.toolTitle?.toUpperCase()}</ThemedText>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>{selectedItem?.action}</ThemedText>
              </View>
            </View>

            <FlatList
              data={[1]}
              keyExtractor={() => 'content'}
              renderItem={() => (
                <View style={styles.itemDetailContent}>
                   {selectedItem?.input && (
                     <View style={[styles.inputSnapshot, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9' }]}>
                        <ThemedText style={[styles.inputLabel, { color: theme.primary }]}>YOU ENTERED:</ThemedText>
                        <ThemedText style={[styles.inputText, { color: theme.gray }]} numberOfLines={3}>{selectedItem.input}</ThemedText>
                     </View>
                   )}
                   
                   <View style={{ marginTop: 20 }}>
                     <ThemedText style={[styles.inputLabel, { color: theme.primary, marginBottom: 10 }]}>AI RESULT:</ThemedText>
                     <RichTextRenderer 
                        content={selectedItem?.content || ''} 
                        highlightColor={theme.primary} 
                        textColor={isDark ? '#FFF' : '#1E293B'}
                        isDark={isDark}
                     />
                   </View>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBarWrapper: { paddingHorizontal: 20, marginTop: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 20, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  clearBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  clearBadgeText: { fontSize: 9, fontWeight: '900', color: '#EF4444' },

  filterSection: { paddingVertical: 15 },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 38, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(128,128,128,0.1)', backgroundColor: 'transparent' },
  filterText: { fontSize: 12, fontWeight: '800' },

  listContainer: { paddingHorizontal: 20, paddingBottom: 150 },
  card: { padding: 18, borderRadius: 24, borderWidth: 1, marginBottom: 15, elevation: 2, shadowOpacity: 0.05, shadowRadius: 10, shadowColor: '#000' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  toolTitle: { fontSize: 16, fontWeight: '800' },
  actionLabel: { fontSize: 11, fontWeight: '600', opacity: 0.6 },
  previewText: { fontSize: 13, lineHeight: 18, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 10, fontWeight: '600', opacity: 0.5 },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(128,128,128,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },

  modalOverlay: { flex: 1 },
  modalHeader: { paddingHorizontal: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(128,128,128,0.05)', justifyContent: 'center', alignItems: 'center' },
  modalTypeBadge: { fontSize: 9, fontWeight: '900', color: '#3B82F6', letterSpacing: 2, marginBottom: 2 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  itemDetailContent: { paddingHorizontal: 20 },
  inputSnapshot: { padding: 15, borderRadius: 18, marginBottom: 10 },
  inputLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  inputText: { fontSize: 13, marginTop: 5, lineHeight: 18 },
});
