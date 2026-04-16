import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Share, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { useLanguage } from '@/context/LanguageContext';

const { width } = Dimensions.get('window');

export default function ReferFriendScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { t } = useLanguage();

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Unlock your true potential with EduAI! The most advanced AI study companion. Join me and study smarter: https://devnexes.com/eduai?ref=EDU-XA9V',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t('refer_friend') || 'Refer a Friend'}</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="gift-outline" size={70} color="#FFF" style={{ marginBottom: 10 }} />
            <ThemedText style={styles.heroTitle}>Invite & Earn Premium</ThemedText>
            <ThemedText style={styles.heroSubtitle}>Share your unique code to unlock 30 days of EduAI Studio for both of you!</ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.contentSection}>
          <ThemedText style={[styles.sectionLabel, { color: theme.gray }]}>YOUR UNIQUE LINK</ThemedText>
          
          <View style={[styles.codeBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
            <ThemedText style={[styles.codeText, { color: theme.text }]}>https://eduai.app/ref/EDU-XA9V</ThemedText>
            <TouchableOpacity onPress={handleShare} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.benefitsBox}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              <ThemedText style={[styles.benefitText, { color: theme.text }]}>You get 30 days of Premium</ThemedText>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              <ThemedText style={[styles.benefitText, { color: theme.text }]}>Your friend gets 30 days of Premium</ThemedText>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              <ThemedText style={[styles.benefitText, { color: theme.text }]}>Unlock unlimited AI Chats</ThemedText>
            </View>
          </View>

          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-social" size={22} color="#FFF" />
            <ThemedText style={styles.shareBtnText}>Share Invitation Link</ThemedText>
          </TouchableOpacity>
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
  heroSection: { padding: 20, alignItems: 'center' },
  heroGradient: {
    width: '100%',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 10 },
  heroSubtitle: { color: '#FFF', fontSize: 14, fontWeight: '600', opacity: 0.9, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  contentSection: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 30,
  },
  codeText: { fontSize: 13, fontWeight: '700', flex: 1 },
  copyBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitsBox: { marginBottom: 30, gap: 15 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitText: { fontSize: 15, fontWeight: '600' },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  shareBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});
