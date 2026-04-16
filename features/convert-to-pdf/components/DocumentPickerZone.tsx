import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { scale, moderateScale, verticalScale } from '../../../utils/responsive';

interface DocumentPickerZoneProps {
  onPickDocument: () => void;
  onPickImage: () => void;
  onEnterURL: () => void;
}

export const DocumentPickerZone = ({ onPickDocument, onPickImage, onEnterURL }: DocumentPickerZoneProps) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-upload" size={moderateScale(48)} color="#7C3AED" />
        </View>
        <Text style={styles.title}>Upload Your Source</Text>
        <Text style={styles.subtitle}>Select a document or image to convert to PDF</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={onPickDocument}>
            <Ionicons name="document-text" size={24} color="#FFF" />
            <Text style={styles.optionText}>Document</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.optionButton, styles.accentButton]} onPress={onPickImage}>
            <Ionicons name="images" size={24} color="#FFF" />
            <Text style={styles.optionText}>Images</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionButton} onPress={onEnterURL}>
            <Ionicons name="link" size={24} color="#FFF" />
            <Text style={styles.optionText}>From URL</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: scale(20),
    marginVertical: verticalScale(20),
  },
  blurContainer: {
    borderRadius: moderateScale(24),
    padding: moderateScale(24),
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  title: {
    color: '#FFF',
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(24),
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    marginHorizontal: scale(5),
  },
  accentButton: {
    backgroundColor: 'rgba(124, 58, 237, 0.6)',
  },
  optionText: {
    color: '#FFF',
    fontSize: moderateScale(10),
    fontWeight: '600',
    marginTop: verticalScale(4),
  },
});
