import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Switch, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';

const { width } = Dimensions.get('window');

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];

  const [settings, setSettings] = useState({
    push: true,
    inApp: true,
    sound: true,
    vibrate: false,
    earlyAlert: true
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingRow = ({ icon, label, subLabel, value, onToggle, color }: any) => (
    <View style={[styles.settingRow, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: theme.border }]}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.settingLabel, { color: theme.text }]}>{label}</ThemedText>
        <ThemedText style={[styles.settingSubLabel, { color: theme.gray }]}>{subLabel}</ThemedText>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#94A3B8', true: '#3B82F6' }}
        thumbColor="#FFF"
      />
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Notifications</ThemedText>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        <View style={styles.promoCard}>
          <MaterialCommunityIcons name="bell-ring-outline" size={40} color="#3B82F6" />
          <ThemedText style={styles.promoTitle}>Smart Alerts</ThemedText>
          <ThemedText style={styles.promoSubtitle}>Never miss your homework deadlines with precision real-time tracking.</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Alert Channels</ThemedText>
          <SettingRow 
            icon="notifications" 
            label="Push Notifications" 
            subLabel="Receive alerts when app is closed" 
            value={settings.push} 
            onToggle={() => toggle('push')} 
            color="#3B82F6"
          />
          <SettingRow 
            icon="layers" 
            label="In-App Banners" 
            subLabel="Visual popups while using app" 
            value={settings.inApp} 
            onToggle={() => toggle('inApp')} 
            color="#8B5CF6"
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Experience</ThemedText>
          <SettingRow 
            icon="volume-high" 
            label="Alert Sounds" 
            subLabel="Play audio when deadline reaches" 
            value={settings.sound} 
            onToggle={() => toggle('sound')} 
            color="#10B981"
          />
          <SettingRow 
            icon="pulse" 
            label="Vibration" 
            subLabel="Haptic feedback on alerts" 
            value={settings.vibrate} 
            onToggle={() => toggle('vibrate')} 
            color="#F59E0B"
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Reminders Strategy</ThemedText>
          <SettingRow 
            icon="time" 
            label="Early Reminders" 
            subLabel="Alert 5 mins before homework is due" 
            value={settings.earlyAlert} 
            onToggle={() => toggle('earlyAlert')} 
            color="#EC4899"
          />
        </View>

        <View style={{ alignItems: 'center', marginTop: 10, paddingBottom: 40 }}>
          <ThemedText style={{ color: theme.gray, fontSize: 12, textAlign: 'center' }}>
            System-wide push alerts require EDU+ subscription. Standard in-app alerts are always free.
          </ThemedText>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  scrollPadding: { paddingHorizontal: 25 },
  
  promoCard: { alignItems: 'center', backgroundColor: '#3B82F610', borderRadius: 32, padding: 30, marginVertical: 20, borderWidth: 1.5, borderColor: '#3B82F620' },
  promoTitle: { fontSize: 24, fontWeight: '900', marginTop: 15, color: '#3B82F6' },
  promoSubtitle: { fontSize: 13, textAlign: 'center', color: '#64748B', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 15, letterSpacing: -0.5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, borderWidth: 1.5, marginBottom: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingLabel: { fontSize: 15, fontWeight: '800' },
  settingSubLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 }
});
