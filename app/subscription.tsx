import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, TouchableOpacity, ScrollView,
  StatusBar, Dimensions, Alert, ActivityIndicator, Modal, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { useSubscription, PlanType } from '@/context/SubscriptionContext';
import Animated, { FadeInDown, FadeInUp, ZoomIn, SlideInRight } from 'react-native-reanimated';
import { supabase } from '@/utils/supabase';

const { width } = Dimensions.get('window');

const FEATURES_FREE = [
  { label: '5 AI uses per day', granted: true },
  { label: 'Math Solver & Grammar', granted: true },
  { label: 'Basic MCQ Quiz (5 Qs)', granted: true },
  { label: 'Cloud document sync', granted: false },
  { label: 'Unlimited AI usage', granted: false },
  { label: 'All quiz modes (Case Study, Deep Q&A)', granted: false },
  { label: 'Priority AI processing', granted: false },
  { label: 'Ad-free experience', granted: false },
];

const FEATURES_PREMIUM = [
  { label: 'Unlimited AI uses every day', granted: true },
  { label: 'All 5 AI tools with full power', granted: true },
  { label: 'All quiz modes + Case Studies', granted: true },
  { label: 'Cloud document sync', granted: true },
  { label: 'Priority AI processing', granted: true },
  { label: 'No limits on questions (up to 15)', granted: true },
  { label: 'Ad-free experience', granted: true },
  { label: 'Cancel anytime', granted: true },
];

const PLANS = [
  {
    id: 'yearly' as PlanType,
    name: 'EDU+ Yearly',
    price: '$49.99',
    priceMonthly: '$4.17/mo',
    period: '/yr',
    savings: 'Save 40%',
    isPopular: true,
    desc: 'Best value for dedicated students',
    gradient: ['#3B82F6', '#1E40AF'] as [string, string],
  },
  {
    id: 'monthly' as PlanType,
    name: 'EDU+ Monthly',
    price: '$6.99',
    priceMonthly: null,
    period: '/mo',
    savings: null,
    isPopular: false,
    desc: 'Flexible — cancel anytime',
    gradient: ['#6366F1', '#4338CA'] as [string, string],
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { subscription, isPremium, remainingUses, dailyLimit, activatePlan, cancelPlan, refreshSubscription } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setCheckingAuth(false);
    });
  }, []);

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to your EduAI account to subscribe.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    Alert.alert(
      `Confirm Purchase`,
      `You're subscribing to ${selectedPlan === 'yearly' ? 'EDU+ Yearly ($49.99/yr)' : 'EDU+ Monthly ($6.99/mo)'}.\n\nThis is a simulated purchase for demo purposes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Subscribe',
          onPress: async () => {
            setPurchasing(true);
            try {
              await activatePlan(selectedPlan);
              setShowSuccess(true);
              setTimeout(() => {
                setShowSuccess(false);
                router.back();
              }, 2500);
            } catch (e: any) {
              const msg = e?.message === 'NOT_AUTHENTICATED'
                ? 'Please sign in to continue.'
                : 'Something went wrong. Please try again.';
              Alert.alert('Error', msg);
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure? You will lose premium access immediately.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setPurchasing(true);
            try {
              await cancelPlan();
              Alert.alert('Cancelled', 'Your subscription has been cancelled.');
            } catch {
              Alert.alert('Error', 'Could not cancel. Please try again.');
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#020617' : '#F8FAFC' }]}>
      <StatusBar barStyle="light-content" />

      {/* ✅ SUCCESS MODAL */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.successCard}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.successGradient}>
              <MaterialCommunityIcons name="check-circle" size={70} color="#FFF" />
              <ThemedText style={styles.successTitle}>You're Premium!</ThemedText>
              <ThemedText style={styles.successSubtitle}>
                EDU+ {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} activated successfully.{'\n'}Enjoy unlimited academic power!
              </ThemedText>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── HERO HEADER ── */}
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6', '#6366F1']}
          style={[styles.hero, { paddingTop: insets.top + 10 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>

          {/* Decorative orbs */}
          <View style={[styles.heroOrb, { top: -30, right: -30, width: 160, height: 160, opacity: 0.12 }]} />
          <View style={[styles.heroOrb, { bottom: 20, left: -40, width: 120, height: 120, opacity: 0.08 }]} />

          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.heroBadgeRow}>
            <MaterialCommunityIcons name="star-circle" size={26} color="#FFD700" />
            <ThemedText style={styles.heroBadgeText}>EDU+ PREMIUM</ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(700)}>
            <ThemedText style={styles.heroTitle}>Unlock Your Full{'\n'}Academic Potential</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Unlimited AI power, all tools, zero limits.
            </ThemedText>
          </Animated.View>

          {/* Usage meter for free users */}
          {!isPremium && !subscription.loading && (
            <Animated.View entering={FadeInUp.delay(350).duration(600)} style={styles.usageMeter}>
              <View style={styles.usageMeterRow}>
                <ThemedText style={styles.usageMeterLabel}>Today's AI Uses</ThemedText>
                <ThemedText style={styles.usageMeterCount}>
                  {subscription.dailyUsageCount}/{dailyLimit}
                </ThemedText>
              </View>
              <View style={styles.usageBarBg}>
                <View
                  style={[
                    styles.usageBarFill,
                    {
                      width: `${Math.min((subscription.dailyUsageCount / dailyLimit) * 100, 100)}%`,
                      backgroundColor: subscription.dailyUsageCount >= dailyLimit ? '#EF4444' : '#10B981',
                    },
                  ]}
                />
              </View>
              <ThemedText style={styles.usageMeterHint}>
                {remainingUses > 0 ? `${remainingUses} uses remaining today` : 'Daily limit reached — upgrade to continue!'}
              </ThemedText>
            </Animated.View>
          )}
        </LinearGradient>

        <View style={styles.body}>

          {/* ── ACTIVE PLAN CARD (if premium) ── */}
          {isPremium && (
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.activePlanCard}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.activePlanGradient}>
                <View style={styles.activePlanRow}>
                  <View style={styles.activePlanIconBox}>
                    <MaterialCommunityIcons name="crown" size={28} color="#FFD700" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.activePlanTitle}>
                      EDU+ {subscription.plan === 'yearly' ? 'Yearly' : 'Monthly'} — Active
                    </ThemedText>
                    <ThemedText style={styles.activePlanDate}>
                      Renews {formatDate(subscription.expiresAt)}
                    </ThemedText>
                  </View>
                  <View style={styles.activeBadge}>
                    <ThemedText style={styles.activeBadgeText}>ACTIVE</ThemedText>
                  </View>
                </View>
                <View style={styles.activePlanDivider} />
                <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                  <ThemedText style={styles.cancelBtnText}>Cancel Subscription</ThemedText>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── COMPARISON TABLE ── */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              {isPremium ? 'Your Premium Benefits' : "What You're Missing"}
            </ThemedText>
            <View style={[styles.compareCard, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0' }]}>
              {(isPremium ? FEATURES_PREMIUM : FEATURES_FREE).map((f, i) => (
                <View key={i} style={[styles.featureRow, i !== 0 && { borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                  <View style={[styles.featureIcon, { backgroundColor: f.granted ? '#10B98115' : '#EF444415' }]}>
                    <Ionicons
                      name={f.granted ? 'checkmark' : 'close'}
                      size={14}
                      color={f.granted ? '#10B981' : '#EF4444'}
                    />
                  </View>
                  <ThemedText style={[styles.featureText, { color: f.granted ? theme.text : theme.gray, opacity: f.granted ? 1 : 0.55 }]}>
                    {f.label}
                  </ThemedText>
                  {!f.granted && !isPremium && (
                    <View style={styles.lockedTag}>
                      <Ionicons name="lock-closed" size={10} color="#EF4444" />
                      <ThemedText style={styles.lockedTagText}>PRO</ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── PLAN CARDS (only show if not premium or for upgrading) ── */}
          {!isPremium && (
            <>
              <Animated.View entering={FadeInDown.delay(250).duration(600)}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text, marginTop: 30 }]}>
                  Choose Your Plan
                </ThemedText>
              </Animated.View>

              {PLANS.map((plan, idx) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <Animated.View
                    key={plan.id}
                    entering={SlideInRight.delay(300 + idx * 100).duration(500)}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setSelectedPlan(plan.id)}
                      style={[
                        styles.planCard,
                        {
                          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                          borderColor: isSelected ? '#3B82F6' : (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                          borderWidth: isSelected ? 2.5 : 1.5,
                          shadowColor: isSelected ? '#3B82F6' : 'transparent',
                          shadowOpacity: isSelected ? 0.3 : 0,
                          shadowRadius: 20,
                          elevation: isSelected ? 8 : 2,
                        },
                      ]}
                    >
                      {/* Popular badge */}
                      {plan.isPopular && (
                        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.popularBadge}>
                          <MaterialCommunityIcons name="star" size={10} color="#FFF" />
                          <ThemedText style={styles.popularBadgeText}>BEST VALUE</ThemedText>
                        </LinearGradient>
                      )}

                      <View style={styles.planCardTop}>
                        {/* Left: gradient icon + info */}
                        <LinearGradient colors={plan.gradient} style={styles.planIconBox}>
                          <MaterialCommunityIcons
                            name={plan.id === 'yearly' ? 'crown' : 'star-outline'}
                            size={22}
                            color="#FFF"
                          />
                        </LinearGradient>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                          <ThemedText style={[styles.planName, { color: theme.text }]}>{plan.name}</ThemedText>
                          <ThemedText style={[styles.planDesc, { color: theme.gray }]}>{plan.desc}</ThemedText>
                        </View>
                        {/* Radio */}
                        <View style={[styles.radio, { borderColor: isSelected ? '#3B82F6' : theme.gray }]}>
                          {isSelected && <View style={styles.radioFill} />}
                        </View>
                      </View>

                      <View style={styles.planPriceRow}>
                        <ThemedText style={[styles.planPrice, { color: isSelected ? '#3B82F6' : theme.text }]}>
                          {plan.price}
                          <ThemedText style={[styles.planPeriod, { color: theme.gray }]}>{plan.period}</ThemedText>
                        </ThemedText>
                        <View style={{ alignItems: 'flex-end' }}>
                          {plan.priceMonthly && (
                            <ThemedText style={[styles.planPerMonth, { color: theme.gray }]}>
                              {plan.priceMonthly}
                            </ThemedText>
                          )}
                          {plan.savings && (
                            <View style={styles.savingsTag}>
                              <ThemedText style={styles.savingsText}>{plan.savings}</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}

              {/* ── CTA BUTTON ── */}
              <Animated.View entering={FadeInUp.delay(500).duration(600)}>
                <TouchableOpacity
                  style={styles.ctaBtn}
                  activeOpacity={0.88}
                  onPress={handlePurchase}
                  disabled={purchasing || checkingAuth}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#1E40AF']}
                    style={styles.ctaGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {purchasing ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="crown" size={22} color="#FFD700" style={{ marginRight: 10 }} />
                        <ThemedText style={styles.ctaBtnText}>
                          Unlock EDU+ {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}
                        </ThemedText>
                        <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 10 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.trust}>
                  <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  <ThemedText style={[styles.trustText, { color: theme.gray }]}>
                    {'  '}7-day money-back guarantee {'·'} Cancel anytime {'·'} Secure checkout
                  </ThemedText>
                </View>
              </Animated.View>
            </>
          )}

          {/* Already Premium — show manage info */}
          {isPremium && (
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={[styles.manageBox, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
              <Ionicons name="information-circle-outline" size={20} color={theme.gray} />
              <ThemedText style={[styles.manageText, { color: theme.gray }]}>
                {'  '}Manage your subscription in the Account Settings of your app store, or cancel above.
              </ThemedText>
            </Animated.View>
          )}

        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // HERO
  hero: {
    paddingHorizontal: 25,
    paddingBottom: 35,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  heroOrb: { position: 'absolute', borderRadius: 999, backgroundColor: '#FFFFFF' },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  heroBadgeText: {
    color: '#FFD700', fontSize: 13, fontWeight: '900',
    marginLeft: 8, letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#FFF', fontSize: 30, fontWeight: '900',
    lineHeight: 38, letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)', fontSize: 14,
    fontWeight: '600', marginTop: 10,
  },

  // USAGE METER
  usageMeter: {
    marginTop: 22, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, padding: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  usageMeterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  usageMeterLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
  usageMeterCount: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  usageBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: 10 },
  usageMeterHint: {
    color: 'rgba(255,255,255,0.7)', fontSize: 11,
    fontWeight: '600', marginTop: 8, textAlign: 'center',
  },

  // BODY
  body: { paddingHorizontal: 22, paddingTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, letterSpacing: -0.3 },

  // ACTIVE PLAN
  activePlanCard: { marginBottom: 28, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15 },
  activePlanGradient: { padding: 22 },
  activePlanRow: { flexDirection: 'row', alignItems: 'center' },
  activePlanIconBox: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  activePlanTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  activePlanDate: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 3 },
  activeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 10,
  },
  activeBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  activePlanDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 18 },
  cancelBtn: { alignItems: 'center' },
  cancelBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },

  // COMPARE TABLE
  compareCard: {
    borderRadius: 24, borderWidth: 1.5,
    overflow: 'hidden', marginBottom: 5,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13 },
  featureIcon: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  featureText: { flex: 1, fontSize: 13, fontWeight: '700' },
  lockedTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EF444415', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 8,
  },
  lockedTagText: { color: '#EF4444', fontSize: 9, fontWeight: '900', marginLeft: 4 },

  // PLAN CARDS
  planCard: { borderRadius: 26, padding: 20, marginBottom: 14, overflow: 'visible', position: 'relative' },
  popularBadge: {
    position: 'absolute', top: -11, right: 22,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 10, elevation: 4,
  },
  popularBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', marginLeft: 4, letterSpacing: 0.8 },
  planCardTop: { flexDirection: 'row', alignItems: 'center' },
  planIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '900' },
  planDesc: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioFill: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6' },
  planPriceRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 16,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
  },
  planPrice: { fontSize: 30, fontWeight: '900' },
  planPeriod: { fontSize: 14, fontWeight: '600' },
  planPerMonth: { fontSize: 11, fontWeight: '700', opacity: 0.6 },
  savingsTag: {
    backgroundColor: '#10B981', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 10, marginTop: 5,
  },
  savingsText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  // CTA
  ctaBtn: {
    height: 64, borderRadius: 22, overflow: 'hidden',
    marginTop: 8, elevation: 12,
    shadowColor: '#3B82F6', shadowOpacity: 0.45, shadowRadius: 18,
  },
  ctaGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  ctaBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  trust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingHorizontal: 10 },
  trustText: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 16 },

  // MANAGE BOX
  manageBox: {
    flexDirection: 'row', alignItems: 'center', padding: 18,
    borderRadius: 20, borderWidth: 1.5, marginTop: 24,
  },
  manageText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 18 },

  // SUCCESS MODAL
  successOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', padding: 30,
  },
  successCard: { width: '100%', borderRadius: 32, overflow: 'hidden' },
  successGradient: { padding: 40, alignItems: 'center' },
  successTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 20, marginBottom: 12 },
  successSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
});
