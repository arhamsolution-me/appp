import { readAsStringAsync } from 'expo-file-system/legacy';
import mammoth from 'mammoth';
import { decode } from 'base64-arraybuffer';

export const docxToHTML = async (fileUri: string): Promise<string> => {
  if (!fileUri) throw new Error('File URI is missing');
  try {
    const base64 = await readAsStringAsync(fileUri, { encoding: 'base64' });
    const arrayBuffer = decode(base64);
    
    // Mammoth converts .docx to HTML
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, system-ui, sans-serif; 
              padding: 40px; 
              line-height: 1.6; 
              color: #1a1a1a;
            }
            h1, h2, h3 { color: #000; }
            table { width: 100%; border-collapse: collapse; }
            td, th { border: 1px solid #ddd; padding: 8px; }
          </style>
        </head>
        <body>
          ${result.value}
        </body>
      </html>
    `;
  } catch (error) {
    console.error('DOCX Conversion Error:', error);
    throw new Error('Failed to convert DOCX to HTML');
  }
};
