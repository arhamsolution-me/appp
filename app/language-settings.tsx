import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { supabase } from '@/utils/supabase';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';

const LANGUAGES = [
  { id: 'en', label: 'English', sub: 'Default Language', icon: 'flag-variant' },
  { id: 'ur', label: 'Urdu', sub: 'اردو', icon: 'translate' },
  { id: 'hi', label: 'Hindi', sub: 'हिन्दी', icon: 'translate' },
  { id: 'ar', label: 'Arabic', sub: 'العربية', icon: 'mosque' },
  { id: 'fr', label: 'French', sub: 'Français', icon: 'flag-variant-outline' },
  { id: 'es', label: 'Spanish', sub: 'Español', icon: 'flag-outline' },
];

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { showToast } = useToast();

  const { setLanguage, currentLanguage, t } = useLanguage();

  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const [saving, setSaving] = useState(false);

  const handleApply = async () => {
    setSaving(true);
    try {
      await setLanguage(selectedLang);
      showToast('Language preference has been saved successfully.', 'success');
      setTimeout(() => router.back(), 1000);
    } catch (e: any) {
      showToast(e.message || 'Failed to update language.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
         </TouchableOpacity>
         <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Language Settings</ThemedText>
         <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
          <View style={styles.infoBox}>
             <ThemedText style={[styles.infoText, { color: theme.gray }]}>
               Choose your preferred language for the AI Assistant and the application interface.
             </ThemedText>
          </View>

          <View style={styles.langList}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.id;
              return (
                <TouchableOpacity 
                  key={lang.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedLang(lang.id)}
                  style={[
                    styles.langCard, 
                    { 
                      backgroundColor: isSelected ? (isDark ? '#1E293B' : '#EFF6FF') : (isDark ? '#0F172A' : '#F8FAFC'),
                      borderColor: isSelected ? '#3B82F6' : theme.border,
                      borderWidth: isSelected ? 2 : 1
                    }
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: isSelected ? '#3B82F615' : (isDark ? '#FFFFFF05' : '#E2E8F0') }]}>
                    <MaterialCommunityIcons name={lang.icon as any} size={22} color={isSelected ? '#3B82F6' : theme.gray} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.langLabel, { color: theme.text }]}>{lang.label}</ThemedText>
                    <ThemedText style={[styles.langSub, { color: theme.gray }]}>{lang.sub}</ThemedText>
                  </View>
                  <View style={[styles.radio, { borderColor: isSelected ? '#3B82F6' : theme.gray }]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
             disabled={saving}
             onPress={handleApply}
             style={styles.applyBtn}
          >
            <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.applyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
               {saving ? <ActivityIndicator color="#FFF" /> : (
                 <>
                   <ThemedText style={styles.applyText}>Apply Changes</ThemedText>
                   <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                 </>
               )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  backBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollPadding: { paddingHorizontal: 25, paddingBottom: 50 },
  
  infoBox: { marginBottom: 30, marginTop: 10 },
  infoText: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
  
  langList: { gap: 12 },
  langCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, borderStyle: 'solid' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  langLabel: { fontSize: 16, fontWeight: '800' },
  langSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6' },
  
  applyBtn: { height: 70, marginTop: 40, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 10 },
  applyGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  applyText: { color: '#FFF', fontSize: 18, fontWeight: '900' }
});
