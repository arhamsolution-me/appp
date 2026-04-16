import { GlobalHeader } from '@/components/GlobalHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { COLORS } from '@/hooks/use-app-theme';
import { supabase } from '@/utils/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  ActivityIndicator,
  Alert,
  Dimensions, Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, verticalScale } from '@/utils/responsive';

const { width, height } = Dimensions.get('window');

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { t } = useLanguage();
  const { showToast } = useToast();

  // 🧩 State
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [userName, setUserName] = useState('Student');

  // 📝 Form State
  const [bookName, setBookName] = useState('');
  const [homework, setHomework] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const notifiedTasks = useRef<Set<string>>(new Set());

  // 🔄 Fetch Logic with Real-time Support
  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTasks([]); 
        setUserName('Student');
        return;
      }

      const { data: profile, error: profError } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      if (profError) throw profError;
      if (profile?.full_name) setUserName(profile.full_name);

      const { data, error } = await supabase
        .from('homework_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });
        
      if (error) throw error;
      if (data) setTasks(data);
    } catch (e: any) {
      console.log('[FETCH_ERROR]', e);
      showToast(`Network Error: ${e.message}`, "info");
    } finally {
      setLoading(false);
    }
  };

  // 📡 Real-time Subscription Engine
  useEffect(() => {
    let channel: any;
    
    const initRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (channel) supabase.removeChannel(channel);

      channel = supabase
        .channel(`homework_sync_${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'homework_reminders',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchTasks();
        })
        .subscribe();
    };

    initRealtime();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  // 🔔 Precision Notification Scheduler
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date().getTime();
      tasks.forEach(task => {
        if (task.status === 'Completed' || notifiedTasks.current.has(task.id)) return;
        
        const dueTime = new Date(task.due_date).getTime();
        const diff = dueTime - now;

        if (diff <= 0 && diff > -20000) {
           notifiedTasks.current.add(task.id);
           showToast(`⏰ REMINDER: "${task.book_name}" time is up!`, 'reminder');
           
           supabase.from('homework_reminders').delete().eq('id', task.id).then(({ error }) => {
             if (error) console.log('[AUTO_DELETE_ERROR]', error);
           });
        }
      });
    };

    const interval = setInterval(checkReminders, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  useFocusEffect(useCallback(() => { fetchTasks(); }, []));

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('homework_reminders').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      Alert.alert(t('deletion_failed'), e.message);
    }
  };

  const toggleStatus = async (item: any) => {
    try {
      const newStatus = item.status === 'Completed' ? 'Assigned' : 'Completed';
      const { error } = await supabase.from('homework_reminders')
        .update({ status: newStatus })
        .eq('id', item.id);
      if (error) throw error;
    } catch (e: any) {
      showToast(t('update_failed'), "info");
    }
  };

  const handleSave = async () => {
    if (!bookName || !homework) {
      Alert.alert("Missing Info", t('missing_info'));
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('homework_reminders').insert({
        user_id: user.id,
        book_name: bookName,
        task_description: homework,
        due_date: dueDate.toISOString(),
        status: 'Assigned'
      });

      if (error) throw error;

      showToast(t('reminder_set'), 'reminder');
      setModalVisible(false);
      setBookName(''); setHomework('');
    } catch (e: any) {
      Alert.alert(t('database_error'), e.message);
    } finally {
      setLoading(false);
    }
  };

  const generateWeek = () => {
    const week = [];
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    const startOfWeek = new Date(today.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      week.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate().toString(),
        fullDate: d.toDateString()
      });
    }
    return week;
  };

  const WEEK_DAYS = generateWeek();
  const IS_TODAY = new Date().toDateString();

  const onDateChange = (event: any, selected: any) => {
    setShowDatePicker(false);
    if (selected) {
      const current = new Date(dueDate);
      if (pickerMode === 'date') {
        current.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        current.setHours(selected.getHours(), selected.getMinutes());
      }
      setDueDate(current);
    }
  };

  const TaskCard = ({ item }: any) => {
    const isCompleted = item.status === 'Completed';
    const taskDate = new Date(item.due_date);
    const isOverdue = !isCompleted && taskDate.getTime() < new Date().getTime();

    return (
      <TouchableOpacity
        onPress={() => toggleStatus(item)}
        activeOpacity={0.8}
        style={[styles.taskCard, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0' }]}
      >
        <View style={[styles.taskIconBox, { backgroundColor: isCompleted ? '#22C55E20' : (isOverdue ? '#EF444420' : '#3B82F615') }]}>
          <MaterialCommunityIcons
            name={isCompleted ? "check-decagram" : (isOverdue ? "alert-circle-outline" : "book-open-variant")}
            size={24}
            color={isCompleted ? '#22C55E' : (isOverdue ? '#EF4444' : '#3B82F6')}
          />
        </View>
        <View style={styles.taskInfo}>
          <View style={styles.taskHeader}>
            <ThemedText style={[styles.taskSubject, { color: theme.text, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>
              {item.book_name}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#22C55E' : (isOverdue ? '#EF4444' : '#1E3A8A') }]}>
              <ThemedText style={styles.statusTextHighContrast}>
                {isCompleted ? 'COMPLETED' : (isOverdue ? 'EXPIRED' : 'PENDING')}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.taskTitle, { color: theme.gray }]} numberOfLines={1}>{item.task_description}</ThemedText>
          <View style={styles.taskFooter}>
            <View style={styles.timeBadge}>
              <Ionicons name="time" size={12} color="#3B82F6" />
              <ThemedText style={styles.timeText}>
                {taskDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} · {taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#020617' : '#F1F5F9' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <GlobalHeader />

      <View style={[styles.bgGlow, { backgroundColor: isDark ? '#3B82F610' : '#3B82F605' }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerGreeting}>👋 SHARPEN YOUR FOCUS</ThemedText>
            <ThemedText style={[styles.mainTitle, { color: theme.text }]}>Academic Planner</ThemedText>
          </View>
          <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.9} style={styles.addBtnWrapper}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.addBtnContainer}>
              <Ionicons name="add" size={28} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={[styles.plannerCard, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFF' }]}>
          <View style={styles.plannerHeader}>
            <ThemedText style={[styles.currentMonth, { color: theme.text }]}>Weekly Schedule</ThemedText>
            <View style={styles.calendarIconBox}>
               <Ionicons name="calendar-clear" size={16} color="#3B82F6" />
            </View>
          </View>
          
          <View style={styles.datesRowWrapper}>
            {WEEK_DAYS.map((item, idx) => {
              const active = item.fullDate === IS_TODAY;
              return (
                <View key={idx} style={styles.dateCol}>
                  <ThemedText style={[styles.dayText, { color: active ? '#3B82F6' : theme.gray, fontWeight: active ? '900' : '600' }]}>{item.day}</ThemedText>
                  <View style={[styles.dateCircle, active && styles.activeDateCircle]}>
                    <ThemedText style={[styles.dateText, { color: active ? '#FFF' : theme.text }]}>{item.date}</ThemedText>
                    {active && <View style={styles.activeDot} />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Tasks</ThemedText>
            <View style={styles.badgeStudio}>
               <ThemedText style={styles.badgeStudioText}>{tasks.length} ACTIVE</ThemedText>
            </View>
          </View>
          {loading && tasks.length === 0 ? (
            <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
          ) : tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="clipboard-text-search-outline" size={50} color="#3B82F6" style={{ opacity: 0.3 }} />
              </View>
              <ThemedText style={styles.emptyText}>No academic tasks found</ThemedText>
              <ThemedText style={styles.emptySubText}>Tap '+' to organize your study session</ThemedText>
            </View>
          ) : (
            tasks.map(task => <TaskCard key={task.id} item={task} />)
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#0F172A' : '#FFF' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <ThemedText style={[styles.modalHeader, { color: '#3B82F6' }]}>{t('new_reminder')}</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="book-outline" size={16} color="#3B82F6" />
                  <ThemedText style={[styles.inputLabel, { color: '#3B82F6' }]}>{t('subject')}</ThemedText>
                </View>
                <TextInput
                  placeholder="e.g. Mathematics"
                  placeholderTextColor="#3B82F650"
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                  value={bookName}
                  onChangeText={setBookName}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="create-outline" size={16} color="#3B82F6" />
                  <ThemedText style={[styles.inputLabel, { color: '#3B82F6' }]}>TASK DETAILS</ThemedText>
                </View>
                <TextInput
                  placeholder="Homework details..."
                  placeholderTextColor="#3B82F650"
                  multiline
                  style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                  value={homework}
                  onChangeText={setHomework}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="time-outline" size={16} color="#3B82F6" />
                  <ThemedText style={[styles.inputLabel, { color: '#3B82F6' }]}>SCHEDULE</ThemedText>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => { setPickerMode('date'); setShowDatePicker(true); }} style={[styles.dateTimeBtn, { backgroundColor: isDark ? '#3B82F610' : '#EFF6FF', borderColor: '#3B82F6' }]}>
                    <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
                    <ThemedText style={{ marginLeft: 8, fontWeight: '900', color: '#3B82F6' }}>{dueDate.toLocaleDateString()}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setPickerMode('time'); setShowDatePicker(true); }} style={[styles.dateTimeBtn, { backgroundColor: isDark ? '#3B82F610' : '#EFF6FF', borderColor: '#3B82F6' }]}>
                    <Ionicons name="time-outline" size={18} color="#3B82F6" />
                    <ThemedText style={{ marginLeft: 8, fontWeight: '900', color: '#3B82F6' }}>{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {showDatePicker && (<DateTimePicker value={dueDate} mode={pickerMode} is24Hour={true} onChange={onDateChange} />)}

              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.saveBtnGradient}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.saveBtnText}>{t('save_securely')}</ThemedText>}
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGlow: { position: 'absolute', top: -150, right: -150, width: 400, height: 400, borderRadius: 200, zIndex: -1 },
  scrollPadding: { paddingBottom: 150, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 30 },
  headerGreeting: { fontSize: 11, fontWeight: '900', color: '#3B82F6', letterSpacing: 2.5, marginBottom: 5 },
  mainTitle: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  addBtnWrapper: { width: 56, height: 56, borderRadius: 16, shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
  addBtnContainer: { flex: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  plannerCard: { padding: 25, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.1)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  plannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  currentMonth: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  calendarIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center' },
  
  datesRowWrapper: { flexDirection: 'row', justifyContent: 'space-between' },
  dateCol: { alignItems: 'center', flex: 1 },
  dayText: { fontSize: 10, marginBottom: 12, letterSpacing: 1 },
  dateCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activeDateCircle: { backgroundColor: '#3B82F6' },
  dateText: { fontSize: 15, fontWeight: '900' },
  activeDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF' },
  
  tasksSection: { marginTop: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  sectionTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  badgeStudio: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#1E3A8A' },
  badgeStudioText: { fontSize: 9, color: '#FFF', fontWeight: '900', letterSpacing: 1.5 },
  
  taskCard: { flexDirection: 'row', padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 18, alignItems: 'center' },
  taskIconBox: { width: 55, height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  taskInfo: { flex: 1 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  taskSubject: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  taskTitle: { fontSize: 13, fontWeight: '600', lineHeight: 20, marginBottom: 12 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59,130,246,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  timeText: { fontSize: 10, color: '#3B82F6', fontWeight: '900', marginLeft: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusTextHighContrast: { fontSize: 8, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  deleteBtn: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)' },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(59,130,246,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 18, fontWeight: '900', opacity: 0.8 },
  emptySubText: { fontSize: 13, opacity: 0.5, marginTop: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.9)', justifyContent: 'flex-end' },
  modalContent: { padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: height * 0.85 },
  modalHandle: { width: 40, height: 5, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: 2.5, alignSelf: 'center', marginBottom: 30 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 },
  modalHeader: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  closeBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.08)', justifyContent: 'center', alignItems: 'center' },
  inputGroup: { marginBottom: 25 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  inputLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  input: { borderRadius: 16, padding: 18, fontSize: 15, fontWeight: '700', borderWidth: 1 },
  textArea: { height: 120, textAlignVertical: 'top' },
  dateTimeBtn: { flex: 1, padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  saveBtn: { height: 65, marginTop: 25 },
  saveBtnGradient: { flex: 1, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 }
});
