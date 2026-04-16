import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { useLanguage } from '@/context/LanguageContext';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { t } = useLanguage();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t('privacy_policy') || 'Privacy Policy'}</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <ThemedText style={[styles.title, { color: theme.text }]}>EduAI Data Privacy & Security Policy</ThemedText>
          <ThemedText style={[styles.date, { color: theme.gray }]}>Effective Date: April, 2026</ThemedText>

          <View style={[styles.section, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
            <Ionicons name="shield-checkmark" size={28} color="#10B981" style={{ marginBottom: 10 }} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>1. Information We Collect</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.text, opacity: 0.8 }]}>
              We collect information to provide better services to all our users. We only collect the minimal required information, including account details and generated learning materials. Your personal queries and uploaded documents remain private and are only used to contextually enhance your AI tutor experience.
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
            <Ionicons name="lock-closed" size={28} color="#3B82F6" style={{ marginBottom: 10 }} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>2. How We Secure Your Data</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.text, opacity: 0.8 }]}>
              Security is built into our core backend powered by Supabase. Your data is encrypted at rest and in transit using state-of-the-art cryptographic algorithms (AES-256). We utilize PostgreSQL Row-Level Security (RLS) to ensure zero unauthorized access.
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
            <Ionicons name="share-social" size={28} color="#F59E0B" style={{ marginBottom: 10 }} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>3. Data Sharing</ThemedText>
            <ThemedText style={[styles.paragraph, { color: theme.text, opacity: 0.8 }]}>
              Devnexes Digital Solutions absolutely does not sell your personal data. We only share anonymized analytical data with necessary LLM infrastructure providers (e.g. Google Gemini, Groq) strictly for generating your requested academic outputs.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  scrollContent: { paddingBottom: 60 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 5 },
  date: { fontSize: 13, fontWeight: '600', marginBottom: 30 },
  section: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  paragraph: { fontSize: 14, lineHeight: 22 },
});
