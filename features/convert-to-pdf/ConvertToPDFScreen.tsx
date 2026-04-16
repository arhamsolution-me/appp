import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePDFConverter, ConversionSource } from './hooks/usePDFConverter';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

type ConversionItem = { id: string; name: string; date: string; size: string; uri: string };

export default function ConvertToPDFScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { convertToPDF, downloadPDF, isConverting: hookIsConverting, pdfUri } = usePDFConverter();
  
  const [selectedFile, setSelectedFile] = useState<{name: string, size?: string | number, source: ConversionSource} | null>(null);

  const [recentConversions, setRecentConversions] = useState<ConversionItem[]>([
    { id: '1', name: 'Biology_Notes.pdf', date: 'Oct 24, 2023', size: '3.2 MB', uri: 'mock-uri-1' },
    { id: '2', name: 'Chemistry_Lab_Report.pdf', date: 'Oct 22, 2023', size: '1.5 MB', uri: 'mock-uri-2' },
  ]);

  // FIXED: Document Picker Auto-Downloads Instead of Selecting
  const handleUploadClick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'image/*', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({
          name: file.name,
          size: file.size ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : '',
          source: { type: 'document', uri: file.uri, name: file.name, mimeType: file.mimeType } as any
        });
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const handleConvertClick = async () => {
    if (!selectedFile) return;
    await convertToPDF(selectedFile.source, false);
  };

  const handleDownload = (item: ConversionItem) => {
    // open file URI or share
    Sharing.shareAsync(item.uri);
  };

  const handleDelete = (id: string) => {
    setRecentConversions(prev => prev.filter(c => c.id !== id));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* 1. Header */}
      <View style={styles.header}>
        {/* FIXED: Back Button Not Working */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Convert to PDF</Text>
          <Text style={styles.headerSubtitle}>Transform your documents instantly</Text>
        </View>
        
        <View style={styles.headerRightIcon}>
          <Ionicons name="document-text" size={24} color="#2563EB" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. Hero Banner Card */}
        <LinearGradient 
          colors={['#1D4ED8', '#3B82F6']} 
          style={styles.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>PDF Converter</Text>
            <Text style={styles.heroSubtitle}>Upload any document and convert it to PDF in seconds</Text>
          </View>
          <Ionicons name="sync-circle-outline" size={80} color="rgba(255,255,255,0.15)" style={styles.heroBgIcon} />
        </LinearGradient>

        {/* 3. Upload Zone Card */}
        <TouchableOpacity 
          style={styles.uploadCard} 
          activeOpacity={0.8}
          onPress={handleUploadClick}
        >
          <View style={styles.uploadDashedZone}>
            {!selectedFile ? (
              <>
                <Ionicons name="cloud-upload-outline" size={44} color="#2563EB" />
                <Text style={styles.uploadTitle}>Tap to Upload File</Text>
                <Text style={styles.uploadSubtitle}>Supports DOCX, TXT, JPG, PNG</Text>
              </>
            ) : (
              <>
                <View style={styles.fileSelectedWrapper}>
                  <View style={styles.docIconBg}>
                    <Ionicons name="document" size={32} color="#2563EB" />
                  </View>
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
                  </View>
                </View>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                {selectedFile.size ? <Text style={styles.fileSize}>{selectedFile.size}</Text> : null}
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* FIXED: Remove All Conversion Options Section */}
        
        {/* 5. Convert Button */}
        <TouchableOpacity 
          style={[styles.convertButtonWrapper, (!selectedFile || hookIsConverting) && styles.convertButtonDisabled]} 
          activeOpacity={0.8}
          onPress={handleConvertClick}
          disabled={!selectedFile || hookIsConverting}
        >
          <LinearGradient 
            colors={['#2563EB', '#3B82F6']} 
            style={styles.convertButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {hookIsConverting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="document-outline" size={20} color="#FFF" />
                <Text style={styles.convertButtonText}>Convert to PDF</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* 6. Output Result Card */}
        {pdfUri && (
          <View style={styles.outputCard}>
            <View style={styles.outputAccent} />
            <View style={styles.outputContent}>
              
              <View style={styles.outputHeader}>
                <View style={styles.pdfThumbnailBox}>
                  <Ionicons name="document-text" size={36} color="#EF4444" />
                  <Text style={styles.pdfThumbnailLabel}>PDF</Text>
                </View>
                <View style={styles.outputInfo}>
                  <Text style={styles.outputName} numberOfLines={1}>{selectedFile?.name.replace(/\.[^/.]+$/, "")}.pdf</Text>
                  <Text style={styles.outputMeta}>Just now</Text>
                </View>
              </View>
              
              <View style={styles.outputActions} pointerEvents="box-none">
                <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7} onPress={() => downloadPDF(pdfUri, selectedFile?.name)}>
                  <Ionicons name="download-outline" size={18} color="#FFF" />
                  <Text style={styles.downloadBtnText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7} onPress={() => downloadPDF(pdfUri, selectedFile?.name)}>
                  <Ionicons name="share-social-outline" size={18} color="#2563EB" />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        )}

        {/* 7. Recent Conversions Section */}
        <Text style={styles.sectionTitle}>RECENT CONVERSIONS</Text>
        <View style={styles.recentContainer} pointerEvents="box-none">
          {recentConversions.map(item => (
            <View key={item.id} style={styles.recentItemCard}>
              <View style={[styles.recentIconWrapper, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="document-text" size={24} color="#EF4444" />
              </View>
              <View style={styles.recentItemInfo}>
                <Text style={styles.recentItemName}>{item.name}</Text>
                <Text style={styles.recentItemDate}>{item.date} • {item.size}</Text>
              </View>
              
              {/* FIXED: Recent Conversions Buttons Not Interactive */}
              <View style={{ flexDirection: 'row', gap: 4 }} pointerEvents="box-none">
                <TouchableOpacity 
                  onPress={() => handleDownload(item)} 
                  activeOpacity={0.7} 
                  style={{ padding: 10 }}
                >
                  <Ionicons name="download-outline" size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDelete(item.id)} 
                  activeOpacity={0.7} 
                  style={{ padding: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerRightIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    paddingRight: 10,
  },
  heroBgIcon: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    zIndex: 1,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
    padding: 16,
  },
  uploadDashedZone: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.03)',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  fileSelectedWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  docIconBg: {
    width: 64,
    height: 64,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  fileSize: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    marginTop: 32,
    marginBottom: 12,
  },
  convertButtonWrapper: {
    marginTop: 32,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  convertButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  convertButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 8,
  },
  convertButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outputCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  outputAccent: {
    width: 6,
    backgroundColor: '#10B981',
  },
  outputContent: {
    flex: 1,
    padding: 16,
  },
  outputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pdfThumbnailBox: {
    width: 52,
    height: 68,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pdfThumbnailLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    marginTop: 2,
  },
  outputInfo: {
    marginLeft: 14,
    flex: 1,
  },
  outputName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  outputMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  outputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  shareBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  recentContainer: {
    gap: 12,
  },
  recentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  recentIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  recentItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  recentItemDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});
