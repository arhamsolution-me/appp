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
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { supabase } from '@/utils/supabase';
import { useToast } from '@/context/ToastContext';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !fullName) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Account created! Welcome to EduAI', 'success');
      router.replace('/onboarding');
    }
    setLoading(false);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.branding}>
            <View style={[styles.logoIconBg, { backgroundColor: theme.primary }]}>
              <FontAwesome5 name="graduation-cap" size={40} color="#fff" />
            </View>
            <ThemedText type="title" style={[styles.title, { color: theme.text }]}>Create Account</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.gray }]}>Join EduAI and start your learning journey.</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="person-outline" size={20} color={theme.gray} style={styles.inputPrefix} />
              <TextInput placeholder="Full Name" value={fullName} onChangeText={setFullName} placeholderTextColor={theme.gray} style={[styles.input, { color: theme.text }]} />
            </View>
            <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="mail-outline" size={20} color={theme.gray} style={styles.inputPrefix} />
              <TextInput placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={theme.gray} style={[styles.input, { color: theme.text }]} />
            </View>
            <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.gray} style={styles.inputPrefix} />
              <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={theme.gray} style={[styles.input, { color: theme.text }]} />
            </View>
            <TouchableOpacity style={[styles.registerBtn, { backgroundColor: theme.primary }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.registerBtnText}>Sign Up</ThemedText>}
            </TouchableOpacity>
            <View style={styles.loginMore}>
              <ThemedText style={{ color: theme.gray }}>Already have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/login')}><ThemedText style={{ color: theme.primary, fontWeight: '800' }}>Login</ThemedText></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  branding: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  logoIconBg: { width: 80, height: 80, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', opacity: 0.8 },
  form: { gap: 15 },
  inputBox: { flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 18, borderWidth: 1, paddingHorizontal: 15 },
  inputPrefix: { marginRight: 10 },
  input: { flex: 1, fontSize: 13, fontWeight: '500' },
  registerBtn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  registerBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  loginMore: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 30 }
});
