import { readAsStringAsync } from 'expo-file-system/legacy';

export const imageToHTML = async (imageUri: string): Promise<string> => {
  if (!imageUri) throw new Error('Image URI is missing');
  const base64 = await readAsStringAsync(imageUri, { encoding: 'base64' });
  const mimeType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: white; }
          img { max-width: 100%; max-height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="data:${mimeType};base64,${base64}" />
      </body>
    </html>
  `;
};
