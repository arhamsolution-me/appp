import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { COLORS } from '@/hooks/use-app-theme';
import { moderateScale, scale, verticalScale } from '@/utils/responsive';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Dimensions,
  Modal, Pressable,
  StyleSheet, TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { t } = useLanguage();
  const { showToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const rippleAnim = useSharedValue(0);

  React.useEffect(() => {
    rippleAnim.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(rippleAnim.value, [0, 1], [1, 1.8]) }],
    opacity: interpolate(rippleAnim.value, [0, 0.6, 1], [0.3, 0.1, 0]),
  }));

  const pickAndUpload = async (activeToolId?: string, useCamera: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Please sign in to process files', 'error');
        return;
      }

      setShowFabMenu(false);
      let result: any;

      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission Required", "Camera access is needed for scanning documents.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.5,
          base64: true
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        });
      }

      if (result.canceled) return;

      setUploading(true);
      const file = result.assets[0];

      // Content Reading
      let base64Data = file.base64 || "";
      if (!base64Data) {
        try {
          base64Data = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
        } catch (e) {
          console.warn("Content reading error:", e);
        }
      }

      const fileName = file.name || `Snap_${Date.now()}.jpg`;
      const mimeType = file.mimeType || "image/jpeg";

      if (activeToolId) {
        DeviceEventEmitter.emit('fileUploaded', {
          toolId: activeToolId,
          fileName: fileName,
          base64: base64Data,
          mimeType: mimeType
        });
      }

      showToast(t('uploaded'), 'success');
    } catch (err) {
      showToast(t('error_uploading'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFabPress = () => {
    if (pathname.includes('/tool/')) {
      const toolId = pathname.split('/').pop();
      router.push({ pathname: '/scanner', params: { toolId } });
    } else {
      setShowFabMenu(true);
    }
  };

  const isToolScreen = pathname.includes('/tool/');

  const FabOption = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={styles.fabOption} onPress={onPress}>
      <View style={[styles.fabOptionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <ThemedText style={[styles.fabOptionLabel, { color: theme.text }]}>{label}</ThemedText>
    </TouchableOpacity>
  );

  const TabIcon = ({ name, focused, color }: any) => {
    const scale = useSharedValue(focused ? 1.2 : 1);
    
    React.useEffect(() => {
      scale.value = withTiming(focused ? 1.25 : 1, { duration: 300 });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View style={[animatedStyle, { alignItems: 'center' }]}>
        <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />
        {focused && (
          <View style={[styles.activeIndicator, { backgroundColor: color }]} />
        )}
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => (
            <BlurView intensity={isDark ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]} />
          ),
        }}
      >
        <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} color={focused ? theme.primary : theme.gray} /> }} />
        <Tabs.Screen name="files" options={{ tabBarIcon: ({ focused }) => <TabIcon name="folder-open" focused={focused} color={focused ? theme.primary : theme.gray} /> }} />
        <Tabs.Screen name="explore" options={{ tabBarIcon: () => <View style={{ width: 40 }} /> }} />
        <Tabs.Screen name="history" options={{ tabBarIcon: ({ focused }) => <TabIcon name="time" focused={focused} color={focused ? theme.primary : theme.gray} /> }} />
        <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} color={focused ? theme.primary : theme.gray} /> }} />
        <Tabs.Screen name="tool/[id]" options={{ href: null }} />
        <Tabs.Screen name="upload_dummy" options={{ href: null }} />
      </Tabs>

      <View style={styles.fabWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.fabRipple, rippleStyle, { backgroundColor: theme.primary }]} />
        <TouchableOpacity style={styles.fabTouch} activeOpacity={0.9} onPress={handleFabPress}>
          <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.fabGradient}>
            {uploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Ionicons name={isToolScreen ? "camera" : "add"} size={isToolScreen ? 28 : 32} color="#FFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showFabMenu} transparent animationType="fade" onRequestClose={() => setShowFabMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFabMenu(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIndicator, { backgroundColor: theme.gray + '40' }]} />
            </View>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Quick Actions</ThemedText>

            <View style={styles.fabOptionsGrid}>
              <FabOption 
                icon="camera" 
                label="Camera Scan" 
                color="#3B82F6" 
                onPress={() => {
                  setShowFabMenu(false);
                  const toolId = pathname.includes('/tool/') ? pathname.split('/').pop() : undefined;
                  router.push({ pathname: '/scanner', params: { toolId } });
                }} 
              />
              <FabOption
                icon="document"
                label="Upload Document"
                color="#10B981"
                onPress={() => {
                  const toolId = pathname.includes('/tool/') ? pathname.split('/').pop() : undefined;
                  pickAndUpload(toolId, false);
                }}
              />
              <FabOption 
                icon="swap-horizontal" 
                label="Convert to pdf" 
                color="#6366F1" 
                onPress={() => { 
                  setShowFabMenu(false); 
                  router.push('/convert-to-pdf');
                }} 
              />
              <FabOption 
                icon="document-text" 
                label="Text Extractor" 
                color="#EC4899" 
                onPress={() => { 
                  setShowFabMenu(false); 
                  router.push('/extract-text'); 
                }} 
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { position: 'absolute', bottom: verticalScale(8), left: scale(15), right: scale(15), height: moderateScale(65), borderRadius: moderateScale(32), borderTopWidth: 1, borderColor: 'rgba(59,130,246,0.1)', elevation: 20, shadowOpacity: 0.15, shadowRadius: 15, shadowColor: '#000', backgroundColor: 'transparent' },
  activeIndicator: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  fabWrapper: { position: 'absolute', bottom: verticalScale(28), width: width, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  fabTouch: { width: moderateScale(64), height: moderateScale(64), borderRadius: moderateScale(32), elevation: 12, shadowOpacity: 0.4, shadowRadius: 12, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 } },
  fabGradient: { flex: 1, borderRadius: moderateScale(32), justifyContent: 'center', alignItems: 'center' },
  fabRipple: { position: 'absolute', width: moderateScale(64), height: moderateScale(64), borderRadius: moderateScale(32) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 50, elevation: 20, shadowOpacity: 0.2, shadowRadius: 15 },
  modalHeader: { alignItems: 'center', marginBottom: 15 },
  modalIndicator: { width: 40, height: 5, borderRadius: 3 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 25, textAlign: 'center' },
  fabOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  fabOption: { width: '48%', marginBottom: 15, alignItems: 'center', padding: 15, borderRadius: 20, backgroundColor: 'rgba(128,128,128,0.05)' },
  fabOptionIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  fabOptionLabel: { fontSize: 13, fontWeight: '700' }
});
