import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../../../utils/responsive';

interface PDFPreviewerProps {
  uri: string;
  onDownload: () => void;
  onShare: () => void;
}

export const PDFPreviewer = ({ uri, onDownload, onShare }: PDFPreviewerProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.previewCard}>
        <Ionicons name="checkmark-circle" size={moderateScale(64)} color="#10B981" />
        <Text style={styles.successText}>Conversion Successful!</Text>
        <Text style={styles.uriText} numberOfLines={1}>{uri.split('/').pop()}</Text>
        
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
            <Ionicons name="download" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Save PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={onShare}>
            <Ionicons name="share-social" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(20),
    marginVertical: verticalScale(20),
  },
  previewCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: moderateScale(24),
    padding: moderateScale(30),
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  successText: {
    color: '#FFF',
    fontSize: moderateScale(22),
    fontWeight: '800',
    marginTop: verticalScale(16),
  },
  uriText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: moderateScale(12),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(30),
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  downloadButton: {
    flex: 1.1,
    backgroundColor: '#7C3AED',
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  shareButton: {
    flex: 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginLeft: scale(8),
  },
});
