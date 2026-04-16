import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { supabase } from '@/utils/supabase';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];

  const [institution, setInstitution] = useState('');
  const [country, setCountry] = useState('');
  const [qualification, setQualification] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCompleteOnboarding() {
    if (!institution || !country || !qualification) {
      Alert.alert('Incomplete', 'Please fill in all details to personalize your experience.');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          institution,
          country,
          qualification,
          onboarding_completed: true,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', 'Something went wrong saving your details: ' + error.message);
      } else {
        router.replace('/(tabs)');
      }
    } else {
      Alert.alert('Session Error', 'Your session expired. Please login again.');
      router.replace('/login');
    }
    setLoading(false);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <ThemedText type="title" style={[styles.title, { color: theme.text }]}>Almost there!</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.gray }]}>Let's customize EduAI for your studies.</ThemedText>
          </View>

          <View style={styles.form}>
            {/* Institution */}
            <View style={[styles.inputGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <View style={styles.iconTag}><Ionicons name="school-outline" size={20} color={theme.primary} /></View>
               <View style={{ flex: 1 }}>
                 <ThemedText style={[styles.label, { color: theme.gray }]}>School / College / University</ThemedText>
                 <TextInput 
                   placeholder="e.g. PU, NUST, Harvard" 
                   value={institution}
                   onChangeText={setInstitution}
                   placeholderTextColor={theme.gray}
                   style={[styles.input, { color: theme.text }]}
                 />
               </View>
            </View>

            {/* Qualification */}
            <View style={[styles.inputGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <View style={styles.iconTag}><MaterialIcons name="workspace-premium" size={20} color={theme.primary} /></View>
               <View style={{ flex: 1 }}>
                 <ThemedText style={[styles.label, { color: theme.gray }]}>Current Qualification</ThemedText>
                 <TextInput 
                   placeholder="e.g. BS CS, MBBS, A Levels" 
                   value={qualification}
                   onChangeText={setQualification}
                   placeholderTextColor={theme.gray}
                   style={[styles.input, { color: theme.text }]}
                 />
               </View>
            </View>

            {/* Country */}
            <View style={[styles.inputGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <View style={styles.iconTag}><Ionicons name="earth-outline" size={20} color={theme.primary} /></View>
               <View style={{ flex: 1 }}>
                 <ThemedText style={[styles.label, { color: theme.gray }]}>Country</ThemedText>
                 <TextInput 
                   placeholder="e.g. Pakistan, USA, UAE" 
                   value={country}
                   onChangeText={setCountry}
                   placeholderTextColor={theme.gray}
                   style={[styles.input, { color: theme.text }]}
                 />
               </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: theme.primary }]} 
              onPress={handleCompleteOnboarding}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ThemedText style={styles.submitBtnText}>Start Exploring </ThemedText>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25, flexGrow: 1 },
  header: { marginTop: 40, marginBottom: 40 },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  form: { gap: 15 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 24, borderWidth: 1.5 },
  iconTag: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  input: { fontSize: 16, fontWeight: '600', padding: 0 },
  submitBtn: { height: 65, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginTop: 30, elevation: 8, shadowOpacity: 0.3, shadowRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 } },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});
