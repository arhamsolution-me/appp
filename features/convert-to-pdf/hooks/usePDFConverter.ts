import { useState, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync, copyAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import * as Print from 'expo-print';
import { getAIResponse } from '../../../utils/api';
import { imageToHTML } from '../converters/imageToPDF';
import { docxToHTML } from '../converters/docxToPDF';
import { textToHTML } from '../converters/textToPDF';
import { urlOrHtmlToHTML } from '../converters/htmlToPDF';

export type ConversionSource = 
  | { type: 'document', uri: string, name: string, mimeType?: string }
  | { type: 'image', uri: string }
  | { type: 'url', value: string };

export const usePDFConverter = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(false);

  const convertToPDF = async (source: ConversionSource, enhanceWithAI: boolean = false) => {
    setIsConverting(true);
    setError(null);
    setPdfUri(null);

    try {
      let html = '';
      let rawText = '';

      if (source.type === 'document') {
        const { uri, mimeType } = source;
        if (uri.endsWith('.docx') || mimeType?.includes('officedocument.wordprocessingml.document')) {
          html = await docxToHTML(uri);
          rawText = html.replace(/<[^>]*>?/gm, ''); 
        } else if (uri.endsWith('.txt') || mimeType === 'text/plain') {
          rawText = await readAsStringAsync(uri);
          html = await textToHTML(uri);
        } else if (mimeType?.includes('image/')) {
          html = await imageToHTML(uri);
        } else {
          throw new Error('Unsupported document format');
        }
      } else if (source.type === 'image') {
        html = await imageToHTML(source.uri);
      } else if (source.type === 'url') {
        html = await urlOrHtmlToHTML(source.value);
        rawText = html.replace(/<[^>]*>?/gm, '');
      }

      if (enhanceWithAI && rawText) {
        const AI_PROMPT = `
          Format and clean the following document content for a professional PDF export. 
          Preserve all important information but improve readability, structure, and grammar.
          Return ONLY the cleaned text content.
          
          CONTENT:
          ${rawText}
        `;
        const cleanedContent = await getAIResponse(AI_PROMPT, "You are a professional document formatter.");
        
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, system-ui, sans-serif; padding: 50px; line-height: 1.6; color: #1a1a1a; }
                h1, h2, h3 { color: #000; margin-top: 24px; }
                p { margin-bottom: 16px; text-align: justify; }
              </style>
            </head>
            <body>
              ${cleanedContent.replace(/\n/g, '<br/>')}
            </body>
          </html>
        `;
      }

      const { uri } = await Print.printToFileAsync({ html });
      setPdfUri(uri);
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
      console.error('Conversion process error:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const downloadPDF = async (uri: string, originalFileName?: string) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this device');
      }

      const newFileName = originalFileName 
        ? originalFileName.replace(/\.[^/.]+$/, "") + ".pdf" 
        : `EduAI_Export_${Date.now()}.pdf`;
      
      const directory = uri.substring(0, uri.lastIndexOf('/') + 1);
      const localUri = directory + newFileName;
      
      await copyAsync({
        from: uri,
        to: localUri
      });

      // Show share sheet first - most reliable way to save PDFs across both iOS and Android
      await Sharing.shareAsync(localUri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
      

      return true;
    } catch (err: any) {
      setError(err.message || 'Download failed');
      return false;
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/*'
        ],
      });

      if (!result.canceled) {
        const file = result.assets[0];
        return { 
          type: 'document' as const, 
          uri: file.uri, 
          name: file.name, 
          mimeType: file.mimeType 
        };
      }
    } catch (err) {
      console.error('Document Picker Error:', err);
    }
    return null;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        return { 
          type: 'image' as const, 
          uri: result.assets[0].uri 
        };
      }
    } catch (err) {
      console.error('Image Picker Error:', err);
    }
    return null;
  };

  return {
    pickDocument,
    pickImage,
    convertToPDF,
    downloadPDF,
    isConverting,
    pdfUri,
    error,
  };
};
