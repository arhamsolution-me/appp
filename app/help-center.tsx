import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Linking, Share, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { useLanguage } from '@/context/LanguageContext';

const { width } = Dimensions.get('window');

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { t } = useLanguage();

  const handleEmail = () => {
    Linking.openURL('mailto:devnexes.solution@gmail.com');
  };

  const handleCall = () => {
    Linking.openURL('tel:03030111550');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Get help with EduAI! Contact Devnexes at devnexes.solution@gmail.com',
      });
    } catch (error) {
      console.log(error);
    }
  };

  const SupportCard = ({ icon, title, value, onPress, color }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: theme.border }]}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardInfo}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <ThemedText style={[styles.cardValue, { color: theme.text }]}>{value}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.gray} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t('help_center')}</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="headset" size={60} color="#FFF" style={{ opacity: 0.9 }} />
            <ThemedText style={styles.heroTitle}>{t('support_hero_title')}</ThemedText>
            <ThemedText style={styles.heroSubtitle}>{t('support_hero_subtitle')}</ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.contentSection}>
          <ThemedText style={[styles.sectionLabel, { color: theme.gray }]}>{t('contact_us')}</ThemedText>
          
          <SupportCard 
            icon="mail-outline" 
            title={t('email_support')} 
            value="devnexes.solution@gmail.com" 
            color="#3B82F6"
            onPress={handleEmail}
          />

          <SupportCard 
            icon="call-outline" 
            title={t('phone_support')} 
            value="03030111550" 
            color="#3B82F6"
            onPress={handleCall}
          />
        </View>

        <View style={styles.brandingFooter}>
          <View style={styles.devnexesLogo}>
            <FontAwesome5 name="code" size={14} color="#3B82F6" />
          </View>
          <ThemedText style={[styles.footerMainText, { color: theme.text }]}>Powered by Devnexes Digital Solution</ThemedText>
          <ThemedText style={[styles.footerVersion, { color: theme.gray }]}>v1.0.4 Premium Studio Edition</ThemedText>
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
  shareBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 60 },
  heroSection: { padding: 20 },
  heroGradient: {
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 15 },
  heroSubtitle: { color: '#FFF', fontSize: 13, fontWeight: '600', opacity: 0.8, textAlign: 'center', marginTop: 8 },
  contentSection: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    marginBottom: 15,
    elevation: 2,
  },
  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  cardValue: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  resourceLabel: { fontSize: 15, fontWeight: '700' },
  brandingFooter: { marginTop: 40, alignItems: 'center', paddingHorizontal: 40 },
  devnexesLogo: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  footerMainText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  footerVersion: { fontSize: 11, fontWeight: '600', marginTop: 4, opacity: 0.6 }
});
