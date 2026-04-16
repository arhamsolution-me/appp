import { GlobalHeader } from '@/components/GlobalHeader';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { moderateScale, scale, verticalScale } from '@/utils/responsive';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/context/SubscriptionContext';
import { searchWeb, getAIResponse } from '@/utils/api';
import { RichTextRenderer } from '@/components/RichTextRenderer';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Text,
  Image,
  Modal,
  Alert
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  useAnimatedStyle
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const STUDIO_ACTIONS = [
  { id: 'solver', label: 'MATH SOLVER', icon: 'calculator', color: '#10B981' },
  { id: 'writer', label: 'ESSAY WRITER', icon: 'document-text', color: '#F59E0B' },
  { id: 'quiz', label: 'QUIZ GENESIS', icon: 'help-circle', color: '#8B5CF6' },
  { id: 'grammar', label: 'GRAMMAR', icon: 'language', color: '#6366F1' },
  { id: 'summarizer', label: 'SUMMARIZER', icon: 'library', color: '#EC4899' },
];

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const router = useRouter();
  const { isPremium, dailyLimit, remainingUses, canUseAI, consumeAIUse } = useSubscription();
  const [command, setCommand] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const searchBarScale = useSharedValue(1);
  const searchBarGlow = useSharedValue(0);
  const floatAnim = useSharedValue(0);

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
    shadowOpacity: searchBarGlow.value,
    borderColor: withTiming(searchBarGlow.value > 0 ? '#3B82F6' : (isDark ? 'rgba(59,130,246,0.2)' : '#E2E8F0')),
  }));

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const PremiumLogo = ({ icon, color }: any) => (
    <View style={logoStyles.container}>
      <LinearGradient colors={[color + '50', color + '20']} style={[logoStyles.ring, { borderColor: color + '40', borderWidth: 1.5 }]} />
      <View style={[logoStyles.logoBackground, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255,255,255,0.7)' }]}>
        <Ionicons name={icon} size={moderateScale(22)} color={color} />
      </View>
    </View>
  );

  const handleSearch = async () => {
    if (!command.trim()) return;

    if (!canUseAI) {
      Alert.alert(
        "Usage Limit Reached",
        "You've consumed your daily AI research credits. Upgrade to EDU+ for unlimited search power!",
        [{ text: "Upgrade Now", onPress: () => router.push('/subscription') }, { text: "Later", style: "cancel" }]
      );
      return;
    }

    setIsSearching(true);
    try {
      // 1. Research via Tavily
      console.log("Researching via Tavily Protocol...");
      const results = await searchWeb(command);
      
      let context = "";
      if (results && results.length > 0) {
        context = results.map(r => `Source: ${r.title}\nContent: ${r.content}`).join("\n\n");
      }

      // 2. Synthesize via Groq
      const prompt = `
        User Question: ${command}
        
        Search Context:
        ${context || "No real-time data found."}
        
        Task: Provide a detailed, academic response. 
        Formatting: 
        - Use <section>Header Name</section> for titles.
        - Use <p>Paragraphs</p> for logic.
        - Use <b>Bold</b> for key terms.
        - If data was found, cite the importance of the findings.
      `;

      const aiResponse = await getAIResponse(prompt, "You are an Elite Academic Researcher with real-time web access.");
      
      await consumeAIUse();
      setSearchResult(aiResponse);
      setShowResultModal(true);
      setCommand('');
    } catch (error) {
      console.error("Search Error:", error);
      Alert.alert("Search Error", "Could not complete the research. Please check your connection.");
    } finally {
      setIsSearching(false);
    }
  };

  const QuickTool = ({ id, icon, label, color }: any) => (
    <View style={styles.actionMain}>
      <TouchableOpacity activeOpacity={0.6} style={styles.glassBtn} onPress={() => router.push({ pathname: '/tool/[id]', params: { id } })}>
        <PremiumLogo icon={icon} color={color} />
        <Text style={[styles.gridMiniText, { color: theme.text }]} numberOfLines={2}>{label}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#020617' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <GlobalHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.bgPattern} />

        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.searchSection}>
          <Animated.View style={[
            styles.searchBarContainer, 
            searchBarAnimatedStyle,
            { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF' }
          ]}>
            <LinearGradient colors={['#3B82F6', '#6366F1']} style={styles.searchIconOrb}>
              <Ionicons name="search" size={16} color="#FFF" />
            </LinearGradient>
            <TextInput
              placeholder={'Ask your academic assistant...'}
              placeholderTextColor={theme.gray}
              style={[styles.searchInput, { color: theme.text }]}
              value={command}
              onChangeText={setCommand}
              onSubmitEditing={handleSearch}
              onFocus={() => {
                searchBarScale.value = withSpring(1.02);
                searchBarGlow.value = withTiming(0.4);
              }}
              onBlur={() => {
                searchBarScale.value = withSpring(1);
                searchBarGlow.value = withTiming(0);
              }}
              returnKeyType="search"
              editable={!isSearching}
            />
            {isSearching ? (
              <ActivityIndicator color="#3B82F6" style={{ marginRight: 10 }} />
            ) : (
              <TouchableOpacity onPress={handleSearch} style={styles.researchActionBtn}>
                <Text style={styles.researchActionText}>RESEARCH</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>

        {/* 🚀 New Dedicated Dashboard Entry Point (Replacement for preloaded screen) */}
        <View style={styles.heroContainer}>
          <Animated.View style={[styles.threeDCard, animatedHeroStyle, { shadowColor: '#3B82F6', shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 20, elevation: 12 }]}>
            <LinearGradient colors={isDark ? ['#1E293B', '#0F172A'] : ['#2563EB', '#1D4ED8']} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
               <View style={styles.cardContent}>
                  <View style={styles.cardTextCol}>
                     <View style={styles.dashboardBadge}>
                        <Ionicons name="analytics" size={10} color="#FFF" />
                        <Text style={styles.dashboardBadgeText}>STUDENT INSIGHTS</Text>
                     </View>
                     <Text style={styles.cardTitle}>Your Learning Intelligence</Text>
                     <TouchableOpacity 
                        style={styles.dashboardBtn} 
                        activeOpacity={0.9}
                        onPress={() => router.push('/dashboard')}
                      >
                        <Text style={styles.dashboardBtnText}>VIEW DASHBOARD</Text>
                        <Ionicons name="arrow-forward" size={16} color="#3B82F6" style={{ marginLeft: 8 }} />
                     </TouchableOpacity>
                  </View>
                  <View style={styles.heroImgWrapper}>
                     <Image source={require('../../assets/images/onboarding_blue.png')} style={styles.heroImg} resizeMode="contain" />
                  </View>
               </View>
            </LinearGradient>
          </Animated.View>
        </View>
        {/* 📊 Usage or Premium Status */}
        {!isPremium ? (
          <Animated.View entering={FadeInDown.delay(300).duration(800)} style={dashboardStyles.usageContainer}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/subscription')}
              style={[dashboardStyles.usageCard, { backgroundColor: isDark ? 'rgba(59,130,246,0.05)' : '#FFF', borderColor: isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.15)' }]}
            >
              <View style={dashboardStyles.usageTop}>
                <View style={dashboardStyles.usageLabelBox}>
                   <MaterialCommunityIcons name="lightning-bolt" size={14} color="#3B82F6" />
                   <Text style={[dashboardStyles.usageLabel, { color: theme.text }]}>FREE AI USAGE</Text>
                </View>
                <Text style={[dashboardStyles.usageValue, { color: '#3B82F6' }]}>{dailyLimit - remainingUses}/{dailyLimit}</Text>
              </View>
              <View style={dashboardStyles.usageBarBase}>
                 <View style={[dashboardStyles.usageBarFill, { width: `${((dailyLimit - remainingUses) / dailyLimit) * 100}%` }]} />
              </View>
              <View style={dashboardStyles.upgradeRow}>
                <Text style={dashboardStyles.upgradeText}>Upgrade for unlimited AI power</Text>
                <Ionicons name="chevron-forward" size={12} color="#3B82F6" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(300).duration(800)} style={dashboardStyles.usageContainer}>
            <LinearGradient colors={['#3B82F620', 'transparent']} style={dashboardStyles.premiumStatusCard}>
               <View style={dashboardStyles.premiumHeader}>
                  <View style={dashboardStyles.premiumBadgeBox}>
                     <MaterialCommunityIcons name="crown" size={18} color="#FFD700" />
                     <Text style={dashboardStyles.premiumBadgeText}>EDU+ PREMIUM ACTIVE</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/subscription')}>
                     <Text style={{ fontSize: 10, fontWeight: '900', color: '#3B82F6' }}>VIEW PLAN</Text>
                  </TouchableOpacity>
               </View>
               <Text style={[dashboardStyles.premiumDesc, { color: theme.gray }]}>You have full access to all AI writing, solving, and research tools with zero limits.</Text>
            </LinearGradient>
          </Animated.View>
        )}
        {/* Studio Tools Grid */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.sectionContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: verticalScale(15) }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>ACADEMIC STUDIO</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.toolsScrollContent}
          >
            {STUDIO_ACTIONS.map(tool => (
              <QuickTool key={tool.id} id={tool.id} icon={tool.icon} label={tool.label} color={tool.color} />
            ))}
          </ScrollView>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.gray }]}>Powered by <Text style={{ color: theme.primary, fontWeight: '800' }}>Devnexes digital solution</Text></Text>
        </View>
      </ScrollView>
    </ThemedView>
    <Modal visible={showResultModal} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalOverlay, { backgroundColor: isDark ? '#020617' : '#FFF', paddingTop: insets.top + 20 }]}>
         <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
               <Text style={styles.vpBadge}>REAL-TIME RESEARCH</Text>
               <Text style={[styles.vpTitle, { color: theme.text }]} numberOfLines={1}>Search Results</Text>
            </View>
            <TouchableOpacity onPress={() => setShowResultModal(false)} style={styles.closeBtn}>
               <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
         </View>
         
         <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={[styles.visualResultBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
               <RichTextRenderer 
                  content={searchResult || ''} 
                  highlightColor="#3B82F6" 
                  textColor={theme.text}
                  isDark={isDark}
               />
            </View>
         </ScrollView>

         <TouchableOpacity 
           style={[styles.vpCloseBtn, { margin: 20, marginBottom: insets.bottom + 20 }]} 
           onPress={() => setShowResultModal(false)}
         >
            <Text style={styles.vpCloseBtnText}>CONTINUE LEARNING</Text>
         </TouchableOpacity>
      </View>
    </Modal>
    </>
  );
}

const mathStyles = StyleSheet.create({});

const logoStyles = StyleSheet.create({
  container: { width: moderateScale(50), height: moderateScale(50), justifyContent: 'center', alignItems: 'center', marginBottom: verticalScale(10) },
  ring: { position: 'absolute', width: moderateScale(50), height: moderateScale(50), borderRadius: moderateScale(18) },
  logoBackground: { width: moderateScale(38), height: moderateScale(38), borderRadius: moderateScale(14), justifyContent: 'center', alignItems: 'center' },
});

const illustrationBoxStyles = StyleSheet.create({
  illustrationBox: { flex: 0.42, height: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  heroImage: { width: moderateScale(160), height: moderateScale(160), zIndex: 10 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalOverlay: { flex: 1, paddingTop: 60 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 10 },
  closeBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: verticalScale(150), zIndex: 10 },
  bgPattern: { position: 'absolute', top: 0, left: 0, right: 0, height: 500, opacity: 0.03, zIndex: -1 },
  searchSection: { paddingHorizontal: scale(15), marginTop: 10, marginBottom: 15 },
  searchBarContainer: { 
    height: 64, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
    borderColor: 'rgba(59,130,246,0.2)'
  },
  searchIconOrb: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  researchActionBtn: { backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  researchActionText: { color: '#3B82F6', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  micBtnPremium: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  heroContainer: { height: 210, paddingHorizontal: 15, justifyContent: 'center', marginTop: 10 },
  threeDCard: { height: 180, borderRadius: 24, overflow: 'hidden' },
  cardGradient: { flex: 1, padding: 20 },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  cardTextCol: { flex: 0.6, justifyContent: 'center' },
  dashboardBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 15 },
  dashboardBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginLeft: 6 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', marginBottom: 20, lineHeight: 28 },
  dashboardBtn: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  dashboardBtnText: { color: '#3B82F6', fontSize: 13, fontWeight: '900' },
  heroImgWrapper: { flex: 0.4, alignItems: 'center', justifyContent: 'center' },
  heroImg: { width: 140, height: 140 },
  sectionContainer: { marginTop: 65, paddingHorizontal: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 5 },
  toolsScrollContent: { paddingRight: 30, paddingLeft: 10, paddingVertical: 10 },
  actionMain: { width: 110, alignItems: 'center', marginRight: 15 },
  glassBtn: { 
    width: '100%', 
    height: 120, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 15, 
    backgroundColor: 'transparent',
    borderWidth: 0
  },
  gridMiniText: { fontSize: 9, fontWeight: '900', textAlign: 'center', letterSpacing: 1, marginTop: 5, textTransform: 'uppercase' },
  agentCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, borderWidth: 1 },
  agentIconBox: { width: moderateScale(45), height: moderateScale(45), borderRadius: moderateScale(12), justifyContent: 'center', alignItems: 'center' },
  agentInfo: { flex: 1, marginLeft: scale(12) },
  agentName: { fontSize: moderateScale(14), fontWeight: '800' },
  agentDesc: { fontSize: moderateScale(11), marginTop: 2, opacity: 0.7 },
  footer: { marginTop: verticalScale(40), marginBottom: verticalScale(30), alignItems: 'center' },
  footerText: { fontSize: moderateScale(11), fontWeight: '600', letterSpacing: 0.8 },
  visualPageLayer: { zIndex: 9999 },
  vpGlowOrb: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#3B82F6', opacity: 0.05 },
  vpHeader: { paddingHorizontal: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  vpBackBtn: { width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  vpHeaderIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.08)', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  vpBadge: { fontSize: 10, fontWeight: '900', color: '#3B82F6', letterSpacing: 3 },
  vpTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  visualResultBox: { padding: 30, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', boxShadow: '0px 10px 30px rgba(59, 130, 246, 0.1)', elevation: 8, overflow: 'hidden' },
  vpCloseBtn: { marginTop: 40, height: 70, borderRadius: 20, backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 10px 20px rgba(59, 130, 246, 0.6)', elevation: 15 },
  vpCloseBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  pulseContainer: { height: 400, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  neuralPulse: { position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth: 2, borderColor: '#3B82F6' },
  neuralPulseInner: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(59,130,246,0.1)' },
  pulseCenterOrb: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(59,130,246,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#3B82F6' },
  pulseText: { marginTop: 60, fontSize: 11, fontWeight: '900', color: '#3B82F6', letterSpacing: 2.5, opacity: 0.7, textAlign: 'center' }
});
const dashboardStyles = StyleSheet.create({
  usageContainer: { paddingHorizontal: 15, marginTop: 10, marginBottom: 15 },
  usageCard: { padding: 20, borderRadius: 24, borderWidth: 1.5, elevation: 4 },
  usageTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  usageLabelBox: { flexDirection: 'row', alignItems: 'center' },
  usageLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginLeft: 6 },
  usageValue: { fontSize: 13, fontWeight: '900' },
  usageBarBase: { height: 8, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 10, overflow: 'hidden' },
  usageBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 10 },
  upgradeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  upgradeText: { fontSize: 10, fontWeight: '800', color: '#3B82F6' },
  premiumStatusCard: { padding: 20, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(59,130,246,0.35)' },
  premiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  premiumBadgeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F620', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  premiumBadgeText: { fontSize: 10, fontWeight: '900', color: '#3B82F6', marginLeft: 6, letterSpacing: 0.5 },
  premiumDesc: { fontSize: 11, fontWeight: '600', lineHeight: 18, opacity: 0.8 }
});
