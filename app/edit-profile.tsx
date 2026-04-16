import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { supabase } from '@/utils/supabase';
import { useToast } from '@/context/ToastContext';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    institution: '',
    qualification: '',
    country: ''
  });

  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  const fetchCurrentProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            institution: data.institution || '',
            qualification: data.qualification || '',
            country: data.country || ''
          });
        }
      }
    } catch (e) {
      console.log('[FETCH_ERROR]', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name) {
      Alert.alert("Required", "Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString()
      });
      if (!error) {
        showToast("Profile Updated!", "info");
        router.back();
      } else {
        Alert.alert("Error", error.message);
      }
    } catch (e) {
      console.log('[UPDATE_ERROR]', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* ── 🔙 CUSTOM HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</ThemedText>
        <View style={{ width: 45 }} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="person" size={70} color="#3B82F6" />
              <TouchableOpacity style={styles.cameraBtn}>
                <Ionicons name="camera" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ThemedText style={{ color: theme.gray, marginTop: 15, fontSize: 13, fontWeight: '700' }}>PERSONAL DETAILS</ThemedText>
          </View>

          <View style={styles.formSection}>
            {[
              { key: 'full_name', label: 'FULL NAME', icon: 'person-outline', placeholder: 'Enter your full name' },
              { key: 'institution', label: 'INSTITUTION', icon: 'school-outline', placeholder: 'School or University' },
              { key: 'qualification', label: 'QUALIFICATION', icon: 'ribbon-outline', placeholder: 'Grade or Degree' },
              { key: 'country', label: 'COUNTRY', icon: 'earth-outline', placeholder: 'Your current location' }
            ].map((input) => (
              <View key={input.key} style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name={input.icon as any} size={14} color="#3B82F6" />
                  <ThemedText style={[styles.inputLabel, { color: theme.gray }]}>{input.label}</ThemedText>
                </View>
                <TextInput
                  placeholder={input.placeholder}
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                  value={(formData as any)[input.key]}
                  onChangeText={(text) => setFormData({ ...formData, [input.key]: text })}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleSave} activeOpacity={0.8} style={styles.saveBtn}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              {saving ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" />
                  <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  scrollPadding: { paddingHorizontal: 25, paddingBottom: 60 },
  
  avatarSection: { alignItems: 'center', marginVertical: 30 },
  avatarCircle: { width: 130, height: 130, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3B82F630' },
  cameraBtn: { position: 'absolute', bottom: -5, right: -5, width: 40, height: 40, borderRadius: 14, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },

  formSection: { gap: 20 },
  inputGroup: { marginBottom: 5 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  input: { height: 65, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 20, fontSize: 16, fontWeight: '700' },

  saveBtn: { height: 75, marginTop: 40, overflow: 'hidden', borderRadius: 24, elevation: 8, shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 15 },
  saveBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' }
});
