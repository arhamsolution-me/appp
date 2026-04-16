import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  TextInput,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Progress from 'react-native-progress';
import { useApp } from '@/context/AppContext';
import { useUserActivity } from '@/context/UserActivityContext';
import { ocrService } from '@/services/OCRService';

interface SelectedImage {
  uri: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  base64: string;
  mimeType: string;
}

interface RecentExtraction {
  id: string;
  imageUri: string;
  fileName: string;
  extractedText: string;
  wordCount: number;
  charCount: number;
  date: string;
  language: string;
}

interface Language {
  label: string;
  code: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { label: 'English', code: 'eng', flag: '🇺🇸' },
  { label: 'Urdu', code: 'urd', flag: '🇵🇰' },
  { label: 'Arabic', code: 'ara', flag: '🇸🇦' },
  { label: 'French', code: 'fra', flag: '🇫🇷' },
  { label: 'Spanish', code: 'spa', flag: '🇪🇸' },
  { label: 'German', code: 'deu', flag: '🇩🇪' },
  { label: 'Chinese', code: 'chi_sim', flag: '🇨🇳' },
];

export default function ExtractTextScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, consumeCredit } = useApp();
  const { logActivity, startSession, endSession } = useUserActivity();
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('eng');
  const [recentExtractions, setRecentExtractions] = useState<RecentExtraction[]>([]);

  // Fake Progress Bar Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExtracting && progress < 85) {
      interval = setInterval(() => {
        setProgress((old) => {
          const next = old + Math.floor(Math.random() * 8) + 2;
          return next > 85 ? 85 : next;
        });
        setStatusMessage('Scanning document with internal AI...');
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isExtracting, progress]);

  // Session Tracking
  useEffect(() => {
    const initSession = async () => {
      const id = await startSession('ocr');
      setCurrentSessionId(id);
    };
    initSession();

    return () => {
      endSession(currentSessionId);
    };
  }, []);

  // Pick Image (Gallery)
  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow photo library access');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        fileName: asset.fileName || 'selected_image.jpg',
        fileSize: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
        base64: asset.base64 || '',
        mimeType: asset.mimeType || 'image/jpeg'
      });
      setExtractedText('');
    }
  };

  // Pick Image (Camera)
  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow camera access');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        fileName: asset.fileName || 'scanned_image.jpg',
        fileSize: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
        base64: asset.base64 || '',
        mimeType: asset.mimeType || 'image/jpeg'
      });
      setExtractedText('');
    }
  };
  
  const addToRecent = (text: string) => {
    if (!selectedImage) return;
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
    const newItem: RecentExtraction = {
      id: Date.now().toString(),
      imageUri: selectedImage.uri,
      fileName: selectedImage.fileName,
      extractedText: text,
      wordCount: wordCount,
      charCount: text.length,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      language: selectedLanguage,
    };
    
    setRecentExtractions(prev => {
      const newArr = [newItem, ...prev];
      if (newArr.length > 10) return newArr.slice(0, 10);
      return newArr;
    });
  };

  // OCR Extraction (using utils/api.js instead of crashing tesseract.js)
  const extractText = async () => {
    if (!selectedImage || !selectedImage.base64) return;
    setIsExtracting(true);
    setProgress(0);
    setStatusMessage('Uploading to OCR Engine...');
    
    try {
      // Consume a credit for the transaction (Demonstrating global state)
      consumeCredit();
      
      // Use the production-ready service layer
      const extractedStr = await ocrService.extractTextFromImage(
        selectedImage.base64, 
        selectedImage.mimeType
      );
      
      setProgress(100);
      setStatusMessage('Text extracted successfully!');
      
      const cleanText = extractedStr.trim();
      if (!cleanText || cleanText.includes("No text recovered")) {
        Alert.alert('Extraction Note', cleanText);
        setExtractedText('');
        return;
      }
      setExtractedText(cleanText);
      addToRecent(cleanText);
      
      // 📊 Log Activity for Student Dashboard
      logActivity('ocr', `Extracted ${selectedImage.fileName}`, 100);
    } catch (error: any) {
      Alert.alert('Extraction Failed', 'Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setIsExtracting(false);
      setProgress(0);
    }
  };

  // Copy
  const copyText = async () => {
    await Clipboard.setStringAsync(extractedText);
    Alert.alert('Copied!', 'Text copied to clipboard');
  };

  // Save TXT
  const saveAsTxt = async () => {
    const fileName = `extracted_${Date.now()}.txt`;
    const filePath = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(filePath, extractedText);
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/plain',
      dialogTitle: 'Save Extracted Text',
    });
  };

  // Share
  const shareText = async () => {
    await Share.share({
      message: extractedText,
      title: 'Extracted Text from EduAI',
    });
  };

  // Utils
  const clearCurrent = () => {
    setExtractedText('');
    setSelectedImage(null);
  };
  
  const getFileSizeStr = (bytes?: number) => {
    if (!bytes) return '';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  const handleViewRecent = (item: RecentExtraction) => {
    setExtractedText(item.extractedText);
    setSelectedImage({
      uri: item.imageUri,
      fileName: item.fileName,
      fileSize: 0,
      width: 0,
      height: 0,
      base64: '',
      mimeType: 'image/jpeg'
    });
    setSelectedLanguage(item.language);
  };

  const handleDeleteRecent = (id: string) => {
    setRecentExtractions(prev => prev.filter(c => c.id !== id));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Extract Text from Image</Text>
          <Text style={styles.headerSubtitle}>Native OCR Engine Module</Text>
        </View>
        
        <View style={styles.headerRightIcon}>
          <View style={styles.creditsPill}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <Text style={styles.creditsText}>{state.userCredits}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. Hero Banner */}
        <LinearGradient 
          colors={['#1D4ED8', '#3B82F6']} 
          style={styles.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>EduAI OCR Engine</Text>
            <Text style={styles.heroSubtitle}>High precision matching • Advanced Layout Support</Text>
            
            <View style={styles.badgesWrapper}>
              <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>🔒 Private</Text></View>
              <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>🆓 Free</Text></View>
            </View>
          </View>
          <Ionicons name="scan-circle-outline" size={80} color="rgba(255,255,255,0.15)" style={styles.heroBgIcon} />
        </LinearGradient>

        {/* 3. Language Selector Card */}
        <View style={styles.languageCard}>
          <Text style={styles.sectionLabel}>SELECT LANGUAGE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
            {LANGUAGES.map(lang => {
              const isActive = selectedLanguage === lang.code;
              return (
                <TouchableOpacity 
                  key={lang.code}
                  style={[styles.langPill, isActive ? styles.langPillActive : styles.langPillInactive]}
                  onPress={() => setSelectedLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={isActive ? styles.langPillTextActive : styles.langPillTextInactive}>
                    {lang.flag} {lang.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* 4. Image Upload Card */}
        <View style={styles.uploadCard}>
          <View style={styles.uploadDashedZone}>
            {!selectedImage ? (
              <>
                <Ionicons name="image-outline" size={48} color="#2563EB" />
                <Text style={styles.uploadTitle}>Tap to Select Image</Text>
                <Text style={styles.uploadSubtitle}>Supports JPG, PNG, WEBP</Text>
                
                <View style={styles.pickButtonsRow}>
                  <TouchableOpacity style={styles.pickBtn} activeOpacity={0.7} onPress={pickFromGallery}>
                    <Ionicons name="images-outline" size={20} color="#2563EB" />
                    <Text style={styles.pickBtnText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pickBtn} activeOpacity={0.7} onPress={pickFromCamera}>
                    <Ionicons name="camera-outline" size={20} color="#2563EB" />
                    <Text style={styles.pickBtnText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.fileSelectedWrapper}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.fullThumbnail} />
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
                  </View>
                </View>
                <Text style={styles.fileName} numberOfLines={1}>{selectedImage.fileName}</Text>
                {selectedImage.fileSize ? <Text style={styles.fileSize}>{getFileSizeStr(selectedImage.fileSize)}</Text> : null}
                
                <View style={styles.changeImgActions}>
                   <TouchableOpacity activeOpacity={0.7} onPress={pickFromGallery}>
                      <Text style={styles.changeImageText}>Change Image</Text>
                   </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* 5. Extract Button */}
        <TouchableOpacity 
          style={[styles.extractButtonWrapper, (!selectedImage || isExtracting) && styles.extractButtonDisabled]} 
          activeOpacity={0.7}
          onPress={extractText}
          disabled={!selectedImage || isExtracting}
        >
          <LinearGradient 
            colors={['#2563EB', '#3B82F6']} 
            style={styles.extractButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="scan-outline" size={20} color="#FFF" />
            <Text style={styles.extractButtonText}>Extract Text</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 6. Progress Card */}
        {isExtracting && (
          <View style={styles.progressCard}>
            <View style={styles.progressAccent} />
            <View style={styles.progressContent}>
              <View style={styles.progressHeader}>
                 <Ionicons name="hourglass-outline" size={28} color="#2563EB" />
                 <View style={{ marginLeft: 12, flex: 1 }}>
                   <Text style={styles.progressTitle}>Extracting Text...</Text>
                   <Text style={styles.progressSubtitle} numberOfLines={1}>{statusMessage}</Text>
                 </View>
                 <Text style={styles.progressPercent}>{progress}%</Text>
              </View>
              <Progress.Bar 
                  progress={progress / 100} 
                  width={null} 
                  color="#2563EB" 
                  unfilledColor="#E2E8F0"
                  borderWidth={0}
                  height={6}
                  style={{ marginTop: 12, borderRadius: 3 }}
              />
            </View>
          </View>
        )}

        {/* 7. Extracted Text Result Card */}
        {extractedText ? (
          <View style={styles.resultCard}>
            <View style={styles.resultAccent} />
            <View style={styles.resultContent}>
              <View style={styles.resultHeaderRow}>
                 <Text style={styles.sectionLabel}>EXTRACTED TEXT</Text>
                 <Text style={styles.wordCountMeta}>
                   {extractedText.split(/\s+/).filter(w => w.length > 0).length} words • {extractedText.length} chars
                 </Text>
              </View>
              
              <TextInput
                style={styles.textInputArea}
                multiline
                value={extractedText}
                onChangeText={setExtractedText}
              />
              
              <View style={styles.actionGridContainer}>
                <TouchableOpacity style={styles.gridBtnSolid} activeOpacity={0.7} onPress={copyText}>
                  <Ionicons name="copy-outline" size={18} color="#FFF" />
                  <Text style={styles.gridBtnSolidText}>Copy Text</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridBtnOutline} activeOpacity={0.7} onPress={shareText}>
                  <Ionicons name="share-outline" size={18} color="#2563EB" />
                  <Text style={styles.gridBtnOutlineText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridBtnSolidGreen} activeOpacity={0.7} onPress={saveAsTxt}>
                  <Ionicons name="save-outline" size={18} color="#FFF" />
                  <Text style={styles.gridBtnSolidText}>Save as TXT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridBtnOutlineRed} activeOpacity={0.7} onPress={clearCurrent}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.gridBtnOutlineRedText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* 8. Recent Extractions Section */}
        <Text style={styles.recentSectionTitle}>RECENT EXTRACTIONS</Text>
        
        {recentExtractions.length === 0 ? (
          <View style={styles.emptyRecentContainer}>
            <Text style={styles.emptyRecentText}>No recent extractions yet</Text>
          </View>
        ) : (
          <View style={styles.recentContainer} pointerEvents="box-none">
            {recentExtractions.map(item => (
              <View key={item.id} style={styles.recentItemCard}>
                <Image source={{ uri: item.imageUri }} style={styles.recentThumbnail} />
                <View style={styles.recentItemInfo}>
                  <Text style={styles.recentItemName} numberOfLines={1}>{item.fileName}</Text>
                  <Text style={styles.recentItemDate}>{item.date} • {item.wordCount} words</Text>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 6 }} pointerEvents="box-none">
                  <TouchableOpacity onPress={() => handleViewRecent(item)} activeOpacity={0.7} style={styles.recentViewBtn}>
                    <Text style={styles.recentViewBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteRecent(item.id)} activeOpacity={0.7} style={styles.recentDeleteBtn}>
                     <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { width: 44, height: 44, backgroundColor: '#FFFFFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  headerRightIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  heroBanner: { borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative' },
  heroContent: { flex: 1, zIndex: 2 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 18, paddingRight: 10, marginBottom: 12 },
  badgesWrapper: { flexDirection: 'row', gap: 8 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  heroBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  heroBgIcon: { position: 'absolute', right: -16, bottom: -16, zIndex: 1 },
  languageCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#1E293B', letterSpacing: 1.2, marginBottom: 12 },
  langScroll: { paddingVertical: 4 },
  langPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  langPillActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  langPillInactive: { backgroundColor: '#FFFFFF', borderColor: '#EEF2F7' },
  langPillTextActive: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  langPillTextInactive: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  uploadCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 4, padding: 16 },
  uploadDashedZone: { borderWidth: 1.5, borderColor: '#2563EB', borderStyle: 'dashed', borderRadius: 20, paddingVertical: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(37, 99, 235, 0.03)' },
  uploadTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  uploadSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 20 },
  pickButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#2563EB', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  pickBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  fileSelectedWrapper: { position: 'relative', marginBottom: 12, width: '90%' },
  fullThumbnail: { width: '100%', height: 200, borderRadius: 12, resizeMode: 'cover' },
  checkBadge: { position: 'absolute', right: -8, top: -8, backgroundColor: '#10B981', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  fileName: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 8, textAlign: 'center' },
  fileSize: { fontSize: 13, color: '#64748B', marginTop: 4 },
  changeImgActions: { marginTop: 16 },
  changeImageText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  extractButtonWrapper: { marginTop: 24, borderRadius: 14, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  extractButtonDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  extractButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 14, gap: 8 },
  extractButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  progressCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, marginTop: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  progressAccent: { width: 6, backgroundColor: '#2563EB' },
  progressContent: { flex: 1, padding: 16 },
  progressHeader: { flexDirection: 'row', alignItems: 'center' },
  progressTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  progressSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  progressPercent: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
  resultCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, marginTop: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5 },
  resultAccent: { width: 6, backgroundColor: '#10B981' },
  resultContent: { flex: 1, padding: 16 },
  resultHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  wordCountMeta: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  textInputArea: { minHeight: 200, backgroundColor: '#F8FAFF', borderRadius: 12, padding: 12, fontSize: 14, color: '#1E293B', lineHeight: 22, textAlignVertical: 'top', marginBottom: 16 },
  actionGridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridBtnSolid: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 12, gap: 6 },
  gridBtnSolidGreen: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 12, gap: 6 },
  gridBtnSolidText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  gridBtnOutline: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#2563EB', paddingVertical: 12, borderRadius: 12, gap: 6 },
  gridBtnOutlineText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
  gridBtnOutlineRed: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EF4444', paddingVertical: 12, borderRadius: 12, gap: 6 },
  gridBtnOutlineRedText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  recentSectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', letterSpacing: 1.2, marginTop: 32, marginBottom: 12 },
  recentContainer: { gap: 12 },
  emptyRecentContainer: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyRecentText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  recentItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  recentThumbnail: { width: 60, height: 60, borderRadius: 8, resizeMode: 'cover', backgroundColor: '#F1F5F9' },
  recentItemInfo: { flex: 1, marginLeft: 12, marginRight: 10 },
  recentItemName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  recentItemDate: { fontSize: 12, color: '#64748B' },
  recentViewBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, justifyContent: 'center' },
  recentViewBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  recentDeleteBtn: { borderWidth: 1.5, borderColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  creditsText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
});
