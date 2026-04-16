import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  StatusBar,
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showToast(error.message, 'error');
    } else if (user) {
      showToast('Welcome back!', 'success');
      const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single();
      if (profile?.onboarding_completed) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }
    setLoading(false);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.branding}>
            <View style={[styles.logoIconBg, { backgroundColor: theme.primary }]}>
              <FontAwesome5 name="graduation-cap" size={40} color="#fff" />
            </View>
            <ThemedText type="title" style={[styles.title, { color: theme.text }]}>Welcome Back!</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.gray }]}>Sign in to continue your AI adventure.</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="mail-outline" size={20} color={theme.gray} style={styles.inputPrefix} />
              <TextInput placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" placeholderTextColor={theme.gray} style={[styles.input, { color: theme.text }]} />
            </View>
            <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.gray} style={styles.inputPrefix} />
              <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={theme.gray} style={[styles.input, { color: theme.text }]} />
            </View>
            <TouchableOpacity style={styles.forgotBtn}><ThemedText style={{ color: theme.primary, fontWeight: '700' }}>Forgot Password?</ThemedText></TouchableOpacity>
            <TouchableOpacity style={[styles.loginBtn, { backgroundColor: theme.primary }]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.loginBtnText}>Login</ThemedText>}
            </TouchableOpacity>
            <View style={styles.registerMore}>
              <ThemedText style={{ color: theme.gray }}>Don't have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/register')}><ThemedText style={{ color: theme.primary, fontWeight: '800' }}>Register Now</ThemedText></TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  branding: { alignItems: 'center', marginBottom: 50 },
  logoIconBg: { width: 80, height: 80, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', opacity: 0.8 },
  form: { gap: 15 },
  inputBox: { flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 18, borderWidth: 1, paddingHorizontal: 15 },
  inputPrefix: { marginRight: 10 },
  input: { flex: 1, fontSize: 13, fontWeight: '500' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 10 },
  loginBtn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  registerMore: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 }
});
