import React, { useCallback, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Dimensions, StatusBar, Switch, Share, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect as useExpoFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { supabase } from '@/utils/supabase';
import { GlobalHeader } from '@/components/GlobalHeader';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeName, toggleTheme, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { t, isRTL } = useLanguage();
  const { isPremium, subscription: subPlan } = useSubscription();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [taskCount, setTaskCount] = useState(0);

  const fetchProfileAndStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profData) {
          setProfile({ ...profData, email: user.email });
        }

        const { count } = await supabase.from('homework_reminders').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        setTaskCount(count || 0);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.log('[PROFILE_FETCH_ERROR]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useExpoFocusEffect(useCallback(() => {
    fetchProfileAndStats();

    const uid = Date.now().toString();
    const profRemSub = supabase
      .channel(`profile_stats_${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework_reminders' }, () => {
        fetchProfileAndStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profRemSub);
    };
  }, [fetchProfileAndStats]));

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to logout?", [
      { text: "No", style: "cancel" },
      { text: "Sign Out", onPress: async () => {
         await supabase.auth.signOut();
         setProfile(null);
         router.replace('/(tabs)');
      }, style: "destructive" }
    ]);
  };

  const handleReferFriend = () => {
    router.push('/refer-friend');
  };

  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  const handleExportData = () => {
    Alert.alert(
      t('export_data') || "Export Data",
      "Your data export request is processing. You will receive an email shortly with a secure download link.",
      [{ text: "OK" }]
    );
  };

  const ActionItem = ({ icon, label, subLabel, color, onPress }: any) => (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      style={[styles.actionItem, { 
        backgroundColor: isDark ? color + '0D' : '#FFFFFF', 
        borderColor: isDark ? color + '25' : theme.border 
      }]}
    >
      <View style={[styles.actionIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.actionLabel, { color: theme.text }]}>{label}</ThemedText>
        {subLabel && <ThemedText style={[styles.actionSubLabel, { color: theme.gray }]}>{subLabel}</ThemedText>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.gray} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <GlobalHeader />
      
      {loading && !profile ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={theme.primary} size="large" /></View>
      ) : profile ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          
          <View style={styles.headerCard}>
            <LinearGradient
              colors={isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F8FAFC']}
              style={[styles.headerGradient, { borderColor: theme.border, borderWidth: 1 }]}
            >
              <View style={styles.avatarRow}>
                <View style={[styles.avatarBox, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                  <Ionicons name="person" size={50} color={theme.primary} />
                  <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name={isPremium ? "crown" : "check-decagram"} size={20} color={isPremium ? "#FFD700" : "#3B82F6"} />
                  </View>
                </View>
                <View style={styles.nameSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText style={[styles.userName, { color: theme.text }]}>{profile?.full_name || 'EduAI Student'}</ThemedText>
                    {isPremium && (
                      <View style={{ backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                         <ThemedText style={{ fontSize: 9, fontWeight: '900', color: '#000' }}>PRO</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={{ color: theme.gray, fontSize: 13 }}>{profile?.email}</ThemedText>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <ThemedText style={[styles.statVal, { color: theme.text }]}>{taskCount}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.gray }]}>Active Tasks</ThemedText>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statCol}>
                  <ThemedText style={[styles.statVal, { color: theme.text }]}>{profile?.institution?.split(' ')[0] || 'V-Status'}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.gray }]}>EDU</ThemedText>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statCol}>
                  <ThemedText style={[styles.statVal, { color: theme.text }]}>100%</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.gray }]}>SECURE</ThemedText>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{t('reminders')}</ThemedText>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/subscription')}
              style={styles.premiumBanner}
            >
              <LinearGradient colors={isPremium ? ['#10B981', '#059669'] : ['#3B82F6', '#2563EB']} style={styles.premiumGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                 <View style={styles.premiumIconBox}>
                    <MaterialCommunityIcons name={isPremium ? "crown" : "star-circle"} size={30} color={isPremium ? "#FFD700" : "#FFD700"} />
                 </View>
                 <View style={{ flex: 1 }}>
                    <ThemedText style={styles.premiumTitle}>{isPremium ? `EDU+ ${subPlan.plan === 'yearly' ? 'Yearly' : 'Monthly'}` : 'Upgrade to EDU+'}</ThemedText>
                    <ThemedText style={styles.premiumSubtitle}>{isPremium ? 'Your premium sub is active' : 'Unlock AI features & No Ads'}</ThemedText>
                 </View>
                 <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ opacity: 0.8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{t('settings')}</ThemedText>
            <ActionItem 
              icon="person-outline" 
              label={t('personal_info')} 
              subLabel={t('manage_profile')} 
              color="#3B82F6" 
              onPress={() => router.push('/edit-profile')} 
            />
            <ActionItem 
              icon="notifications-outline" 
              label={t('notifications')} 
              subLabel={t('alert_exp')} 
              color="#8B5CF6" 
              onPress={() => router.push('/notifications-settings')} 
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{t('preferences')}</ThemedText>
            <View 
              style={[
                styles.actionItem, 
                { backgroundColor: isDark ? '#3B82F60D' : '#FFFFFF', borderColor: isDark ? '#3B82F625' : theme.border }
              ]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="color-palette-outline" size={22} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.actionLabel, { color: theme.text }]}>{t('appearance')}</ThemedText>
                <ThemedText style={[styles.actionSubLabel, { color: theme.gray }]}>{t('themes_mode')}</ThemedText>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
            <ActionItem 
              icon="language-outline" 
              label={t('language')} 
              subLabel={t('choose_locale')} 
              color="#10B981" 
              onPress={() => router.push('/language-settings')} 
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{t('app_info')}</ThemedText>
            <ActionItem 
              icon="share-social-outline" 
              label={t('refer_friend')} 
              subLabel={t('refer_sub')}
              color="#F59E0B" 
              onPress={handleReferFriend} 
            />
            <ActionItem 
              icon="shield-checkmark-outline" 
              label={t('privacy_policy')} 
              subLabel={t('privacy_sub')}
              color="#64748B" 
              onPress={handlePrivacyPolicy} 
            />
            <ActionItem 
              icon="cloud-download-outline" 
              label={t('export_data')} 
              subLabel={t('export_sub')}
              color="#3B82F6" 
              onPress={handleExportData} 
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{t('support')}</ThemedText>
            <ActionItem icon="help-circle-outline" label={t('help_center')} color="#F59E0B" onPress={() => router.push('/help-center')} />
          </View>

          <View style={styles.footerBranding}>
            <FontAwesome5 name="code" size={12} color={theme.gray} />
            <ThemedText style={styles.footerText}>Powered by Devnexes Digital Solution</ThemedText>
          </View>

          <TouchableOpacity 
            onPress={handleLogout}
            style={[styles.logoutBtn, { borderColor: '#EF4444', backgroundColor: '#EF444410' }]}
          >
            <Ionicons name="log-out" size={22} color="#EF4444" />
            <ThemedText style={styles.logoutText}>Sign Out Account</ThemedText>
          </TouchableOpacity>

        </ScrollView>
      ) : (
        <View style={styles.guestContainer}>
          <LinearGradient colors={['#3B82F610', 'transparent']} style={styles.guestGradient}>
             <View style={[styles.guestLogo, { backgroundColor: '#3B82F615' }]}>
                <MaterialCommunityIcons name="shield-account-outline" size={80} color="#3B82F6" />
             </View>
             <ThemedText style={[styles.guestTitle, { color: theme.text }]}>Unlock Your Potential</ThemedText>
             <ThemedText style={[styles.guestSubtitle, { color: theme.gray }]}>
               Join EduAI to sync your homework and secure your documents.
             </ThemedText>
             <TouchableOpacity 
               activeOpacity={0.8}
               style={styles.mainLoginBtn}
               onPress={() => router.push('/login')}
             >
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.btnGradient}>
                   <ThemedText style={styles.btnText}>Login with EduAccount</ThemedText>
                </LinearGradient>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => router.push('/register')} style={{ marginTop: 20 }}>
                <ThemedText style={{ color: theme.gray, fontWeight: '600' }}>
                  New here? <ThemedText style={{ color: '#3B82F6', fontWeight: '900' }}>Create an Account</ThemedText>
                </ThemedText>
             </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollPadding: { paddingHorizontal: 20, paddingBottom: 150 },
  headerCard: { marginTop: 20, marginBottom: 30 },
  headerGradient: { padding: 25, borderRadius: 32, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 85, height: 85, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  verifiedBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFF', borderRadius: 12 },
  nameSection: { marginLeft: 20, flex: 1 },
  userName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statsRow: { flexDirection: 'row', marginTop: 30, paddingTop: 25, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', justifyContent: 'space-between' },
  statCol: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 30, alignSelf: 'center', opacity: 0.2 },
  section: { marginBottom: 35 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 18, letterSpacing: -0.5 },
  actionItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, borderWidth: 1.5, marginBottom: 12 },
  actionIconBox: { width: 45, height: 45, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionLabel: { fontSize: 16, fontWeight: '800' },
  actionSubLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', height: 70, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  logoutText: { fontSize: 18, fontWeight: '900', color: '#EF4444', marginLeft: 12 },
  guestContainer: { flex: 1 },
  guestGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  guestLogo: { width: 150, height: 150, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  guestTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
  guestSubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  mainLoginBtn: { width: '100%', height: 75, borderRadius: 28, overflow: 'hidden', elevation: 12, shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 15 },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },

  // SEC: SUBSCRIPTION BANNER
  premiumBanner: { height: 100, borderRadius: 24, overflow: 'hidden', marginBottom: 25, elevation: 8, shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 10, marginTop: 5 },
  premiumGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  premiumIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  premiumTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  premiumSubtitle: { color: '#FFF', fontSize: 13, fontWeight: '600', opacity: 0.85, marginTop: 2 },
  footerBranding: { marginTop: 40, marginBottom: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', opacity: 0.6 },
  footerText: { fontSize: 10, fontWeight: '700', marginLeft: 8, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' },
  contactInfo: { marginTop: 10, padding: 15, borderRadius: 20, borderWidth: 1, gap: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
});
