import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { COLORS } from '@/hooks/use-app-theme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Modal, ScrollView } from 'react-native';
import { supabase } from '@/utils/supabase';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { ThemedText } from './themed-text';

export const GlobalHeader = () => {
  const { theme: themeName, toggleTheme, isDark } = useTheme();
  const { state } = useApp();
  const theme = COLORS[themeName];

  // 🌗 Toggle Animation Logic
  const translateX = useSharedValue(isDark ? 32 : 4);
  const notifPulse = useSharedValue(1);
  const logoSlide = useSharedValue(-50);
  const [notifCount, setNotifCount] = React.useState(0);

  const fetchCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count: docCount } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: remCount } = await supabase.from('homework_reminders').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setNotifCount((docCount || 0) + (remCount || 0));
      
      // Pulse animation when count changes
      notifPulse.value = withSequence(
        withTiming(1.5, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.bounce })
      );
    } catch(e) {}
  };

  useEffect(() => {
    fetchCount();
    
    const uid = Date.now().toString();
    const docChannel = supabase.channel(`header_docs_${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, fetchCount)
      .subscribe();
      
    const remChannel = supabase.channel(`header_rems_${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework_reminders' }, fetchCount)
      .subscribe();

    return () => {
      supabase.removeChannel(docChannel);
      supabase.removeChannel(remChannel);
    };
  }, []);

  useEffect(() => {
    translateX.value = withSpring(isDark ? 32 : 4, { damping: 15, stiffness: 120 });

    // Wait... pulse happens on change now via fetchCount
    // But we can keep a subtle idle pulse
    notifPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // 🚀 Logo Entry
    logoSlide.value = withSpring(0, { damping: 12, stiffness: 100 });
  }, [isDark]);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: isDark ? '#0066FF' : '#FFFFFF',
    shadowColor: isDark ? '#0066FF' : '#FFB800',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  }));

  const animatedTrackStyle = useAnimatedStyle(() => {
    const bgColor = isDark ? '#172A45' : '#E6F0FF';
    return {
      backgroundColor: bgColor,
      borderColor: isDark ? 'rgba(0,102,255,0.3)' : 'rgba(0,102,255,0.1)',
    };
  });

  const animatedNotifStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notifPulse.value }],
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: logoSlide.value }],
    opacity: withTiming(1, { duration: 800 }),
  }));

  const [notifModal, setNotifModal] = React.useState(false);
  const [reminders, setReminders] = React.useState<any[]>([]);
  const [recentDocs, setRecentDocs] = React.useState<any[]>([]);

  const fetchNotifs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: rems } = await supabase.from('homework_reminders').select('*').eq('user_id', user.id).order('due_date', { ascending: true }).limit(5);
      const { data: docs } = await supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
      
      setReminders(rems || []);
      setRecentDocs(docs || []);
      setNotifCount((rems?.length || 0) + (docs?.length || 0));
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  return (
    <View style={styles.headerContainer}>
      <Animated.View style={[styles.logoWrapper, animatedLogoStyle]}>
        <View style={[styles.logoIconBg, { backgroundColor: isDark ? '#0066FF' + '15' : '#0066FF' + '10' }]}>
          <FontAwesome5 name="graduation-cap" size={20} color="#0066FF" />
        </View>
        <View style={styles.logoTextContainer}>
          <ThemedText style={[styles.logoText, { color: theme.text }]}>
            Edu<ThemedText style={[styles.logoText, { color: '#0066FF' }]}>AI</ThemedText>
          </ThemedText>
          <ThemedText style={[styles.poweredByText, { color: theme.gray }]}>by Devnexes Digital Solution</ThemedText>
        </View>
      </Animated.View>

      <View style={styles.rightSection}>
        <View style={[styles.creditsBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB', borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
           <Ionicons name="flash" size={12} color="#F59E0B" />
           <Text style={styles.creditsLabel}>{state.userCredits}</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => setNotifModal(true)}
          activeOpacity={0.7} 
          style={[styles.notifBtn, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#F1F5F9', borderColor: theme.border }]}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
          {notifCount > 0 && (
            <Animated.View style={[styles.notifBadge, animatedNotifStyle]}>
               <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                  {notifCount > 99 ? '99+' : notifCount}
               </Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      {/* 🔔 ELITE NOTIFICATION MODAL */}
      <Modal visible={notifModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setNotifModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#0F172A' : '#FFF' }]}>
            <View style={styles.modalHeaderRow}>
               <ThemedText style={styles.modalTitle}>STUDIO UPDATES</ThemedText>
               <TouchableOpacity onPress={() => setNotifModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={theme.gray} />
               </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 📖 REMINDERS SECTION */}
              <View style={styles.notifSection}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="time" size={16} color="#3B82F6" />
                  <ThemedText style={[styles.sectionLabel, { color: isDark ? theme.gray : '#334155' }]}>ACADEMIC REMINDERS</ThemedText>
                </View>
                {reminders.length === 0 ? (
                  <ThemedText style={[styles.emptyMsg, { color: isDark ? '#475569' : '#94A3B8' }]}>No upcoming tasks</ThemedText>
                ) : reminders.map(rem => (
                  <View key={rem.id} style={[styles.notifItem, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                    <View style={[styles.itemIcon, { backgroundColor: '#3B82F615' }]}>
                      <Ionicons name="book" size={14} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.itemTitle, { color: theme.text }]}>{rem.book_name}</ThemedText>
                      <ThemedText style={[styles.itemDesc, { color: theme.gray }]}>{new Date(rem.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {rem.status}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              {/* 🔬 RECENT STUDY SECTION */}
              <View style={styles.notifSection}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="flask" size={16} color="#F59E0B" />
                  <ThemedText style={[styles.sectionLabel, { color: isDark ? theme.gray : '#334155' }]}>RECENT RESEARCH</ThemedText>
                </View>
                {recentDocs.length === 0 ? (
                  <ThemedText style={[styles.emptyMsg, { color: isDark ? '#475569' : '#94A3B8' }]}>No recent uploads</ThemedText>
                ) : recentDocs.map(doc => (
                  <View key={doc.id} style={[styles.notifItem, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                    <View style={[styles.itemIcon, { backgroundColor: '#F59E0B15' }]}>
                      <Ionicons name="document-text" size={14} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.itemTitle, { color: theme.text }]}>{doc.file_name}</ThemedText>
                      <ThemedText style={[styles.itemDesc, { color: theme.gray }]}>{new Date(doc.created_at).toLocaleDateString()}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0,102,255,0.05)',
    marginTop: 15,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 255, 0.03)',
    paddingRight: 15,
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 6,
  },
  logoIconBg: {
    width: 42,
    height: 42,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 102, 255, 0.1)',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  logoTextContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  poweredByText: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: -2,
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    position: 'relative',
    elevation: 2,
  },
  notifBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  // Toggle Styles
  toggleTrack: {
    width: 58,
    height: 30,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  trackContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  toggleThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  // 🔔 NOTIFICATION CENTER STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.8)', justifyContent: 'flex-start', paddingTop: 100 },
  modalContent: { marginHorizontal: 20, borderRadius: 24, padding: 25, maxHeight: '75%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 2, color: '#3B82F6' },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center' },
  notifSection: { marginBottom: 25 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, opacity: 0.85 },
  emptyMsg: { fontSize: 13, opacity: 0.6, fontStyle: 'italic', marginLeft: 26 },
  notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 15 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '800', opacity: 0.95 },
  itemDesc: { fontSize: 11, opacity: 0.7, marginTop: 2 },
  creditsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  creditsLabel: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
  },
});
