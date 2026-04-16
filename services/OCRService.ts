import { apiClient } from './apiClient';

/**
 * Service for OCR related tasks.
 * Abstracts the OCR.Space logic completely from the ui.
 */
class OCRService {
  private readonly OCR_API_URL = 'https://api.ocr.space/parse/image';
  // Standard demo key or private key from env
  private readonly OCR_KEY = process.env.EXPO_PUBLIC_OCR_KEY || 'helloworld';

  /**
   * Primary extraction logic.
   * @param base64Data Raw image Base64 data block without the prefix descriptor.
   * @param mimeType Image filetype.
   */
  public async extractTextFromImage(base64Data: string, mimeType: string = 'image/jpeg'): Promise<string> {
    const prefixedBase64 = `data:${mimeType};base64,${base64Data}`;
    
    // Using FormData is required by the OCR.space standard
    const formData = new FormData();
    formData.append('base64Image', prefixedBase64);
    formData.append('apikey', this.OCR_KEY);
    formData.append('language', 'eng');
    formData.append('OCREngine', '2'); // Fast Engine
    
    try {
      const response = await fetch(this.OCR_API_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.IsErroredOnProcessing) {
         throw new Error(data.ErrorMessage ? data.ErrorMessage.join(', ') : 'Unknown OCR Engine error');
      }
      
      const parts = data.ParsedResults?.map((r: any) => r.ParsedText) || [];
      const text = parts.join('\n').trim();
      
      if (!text) {
         return 'No text recovered from OCR engine.';
      }
      return text;
    } catch (error: any) {
      throw new Error(`OCR Processing failed: ${error.message}`);
    }
  }
}

export const ocrService = new OCRService();
