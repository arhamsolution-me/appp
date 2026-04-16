import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { moderateScale, scale, verticalScale } from '@/utils/responsive';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  DeviceEventEmitter
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const router = useRouter();
  const { toolId } = useLocalSearchParams();
  
  const cameraRef = useRef<CameraView>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'original' | 'bw' | 'contrast'>('original');
  const [flash, setFlash] = useState<boolean>(false);

  const scanLinePos = useSharedValue(0);
  const cornerScale = useSharedValue(1);
  const detectPulse = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  const SCAN_START = verticalScale(150);
  const SCAN_END = verticalScale(450);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: interpolate(scanLinePos.value, [0, 1], [SCAN_START, SCAN_END]),
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cornerScale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  useEffect(() => {
    if (permission?.granted && !capturedImage) {
      scanLinePos.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      
      cornerScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );

      detectPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    }
  }, [permission, capturedImage]);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.4,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !processing) {
      setProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 300 })
      );

      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.4,
          base64: true,
          exif: false,
        });
        if (photo) setCapturedImage(photo.uri);
      } catch (e) {
        console.error(e);
      } finally {
        setProcessing(false);
      }
    }
  };

  const applyFilter = async (type: 'original' | 'bw' | 'contrast') => {
    if (!capturedImage) return;
    setFilter(type);
    setProcessing(true);
    try {
      // Logic for filter preview simulation
    } catch (e) {
      console.log(e);
    } finally {
      setProcessing(false);
    }
  };

  const finishScan = async () => {
    if (!capturedImage) return;
    setProcessing(true);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        capturedImage,
        [{ resize: { width: 1024 } }], 
        { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.4 }
      );

      const targetTool = String(toolId || 'solver');
      console.log("Scanner Logic Target Tool:", targetTool);

      DeviceEventEmitter.emit('fileUploaded', {
        toolId: targetTool,
        fileName: `Scan_${Date.now()}.jpg`,
        base64: manipResult.base64,
        mimeType: 'image/jpeg'
      });

      // Small delay ensures event is processed before unmounting
      setTimeout(() => {
        router.back();
      }, 200);
    } catch (e) {
      console.error("Finish Scan Error:", e);
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  
  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={64} color={theme.primary} />
          <ThemedText style={styles.permissionTitle}>Camera Access Required</ThemedText>
          <ThemedText style={styles.permissionDesc}>We need your camera to scan documents and solve problems.</ThemedText>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={requestPermission}>
            <ThemedText style={styles.btnText}>Enable Camera</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flash}
            autofocus="on"
          />
          <View style={styles.overlay}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
              <ThemedText style={styles.topTitle}>AI SCANNER</ThemedText>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.scannerWindow}>
              <Animated.View style={[styles.corner, styles.topLeft, cornerStyle]} />
              <Animated.View style={[styles.corner, styles.topRight, cornerStyle]} />
              <Animated.View style={[styles.corner, styles.bottomLeft, cornerStyle]} />
              <Animated.View style={[styles.corner, styles.bottomRight, cornerStyle]} />
              
              <Animated.View style={[styles.scanLine, scanLineStyle]}>
                <View style={styles.scanLineGlow} />
              </Animated.View>

              <View style={styles.hintContainer}>
                <ThemedText style={styles.hintText}>Hold steady for better scan</ThemedText>
              </View>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
                <Ionicons name="images-outline" size={24} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.captureBtnOuter}
                activeOpacity={0.8}
                onPress={takePicture}
              >
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.flashBtn, flash && { backgroundColor: '#F59E0B' }]} 
                onPress={() => setFlash(!flash)}
              >
                <Ionicons name={flash ? "flashlight" : "flashlight-outline"} size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <Animated.View entering={FadeIn} style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewOverlay}>
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterTitle}>Enhancement Filters</ThemedText>
              <View style={styles.filterList}>
                <FilterBtn 
                  label="Original" 
                  active={filter === 'original'} 
                  onPress={() => applyFilter('original')} 
                  icon="image"
                />
                <FilterBtn 
                  label="B&W" 
                  active={filter === 'bw'} 
                  onPress={() => applyFilter('bw')} 
                  icon="contrast"
                />
                <FilterBtn 
                  label="Sharp" 
                  active={filter === 'contrast'} 
                  onPress={() => applyFilter('contrast')} 
                  icon="sparkles"
                />
              </View>
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity onPress={() => setCapturedImage(null)} style={[styles.previewBtn, styles.retakeBtn]}>
                <ThemedText style={styles.previewBtnText}>RETAKE</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={finishScan} style={[styles.previewBtn, styles.doneBtn, { backgroundColor: theme.primary }]}>
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <ThemedText style={[styles.previewBtnText, { color: '#FFF' }]}>SUBMIT</ThemedText>
                    <Ionicons name="checkmark-done" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View pointerEvents="none" style={[styles.flashOverlay, flashStyle]} />
    </View>
  );
}

function FilterBtn({ label, active, onPress, icon }: any) {
  return (
    <TouchableOpacity 
      style={[styles.filterBtn, active && styles.filterBtnActive]} 
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={active ? '#FFF' : '#AAA'} />
      <ThemedText style={[styles.filterBtnLabel, active && { color: '#FFF' }]}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: verticalScale(50), 
    paddingHorizontal: scale(20) 
  },
  topTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scannerWindow: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginHorizontal: scale(30),
    marginVertical: verticalScale(100),
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3B82F6',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 15 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 15 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 15 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 15 },
  scanLine: {
    position: 'absolute',
    width: '90%',
    height: 3,
    backgroundColor: '#3B82F6',
    zIndex: 10,
  },
  scanLineGlow: {
    position: 'absolute',
    width: '100%',
    height: 40,
    top: -20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  hintContainer: { 
    position: 'absolute', 
    bottom: -40, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  hintText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  bottomActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingBottom: verticalScale(40),
    paddingHorizontal: 20
  },
  captureBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  galleryBtn: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  flashBtn: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  permissionTitle: { fontSize: 22, fontWeight: '900', marginTop: 20 },
  permissionDesc: { textAlign: 'center', marginTop: 10, opacity: 0.7, marginBottom: 30 },
  btn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  flashOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFF' },
  previewContainer: { flex: 1, backgroundColor: '#000' },
  previewImage: { ...StyleSheet.absoluteFillObject, resizeMode: 'contain' },
  previewOverlay: { flex: 1, justifyContent: 'flex-end' },
  previewActions: { 
    flexDirection: 'row', 
    padding: 20, 
    paddingBottom: verticalScale(40),
    gap: 15 
  },
  previewBtn: { 
    flex: 1, 
    height: 55, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    flexDirection: 'row'
  },
  retakeBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  doneBtn: { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  previewBtnText: { fontWeight: '900', fontSize: 16, color: '#FFF', letterSpacing: 1 },
  filterSection: { padding: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  filterTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', marginBottom: 15, textAlign: 'center', opacity: 0.8 },
  filterList: { flexDirection: 'row', justifyContent: 'space-around' },
  filterBtn: { alignItems: 'center', padding: 10, borderRadius: 15, width: 90 },
  filterBtnActive: { backgroundColor: 'rgba(59, 130, 246, 0.3)', borderColor: '#3B82F6', borderWidth: 1 },
  filterBtnLabel: { color: '#AAA', fontSize: 11, fontWeight: '800', marginTop: 6 }
});
