import { readAsStringAsync } from 'expo-file-system';

export const textToHTML = async (fileUri: string): Promise<string> => {
  if (!fileUri) throw new Error('File URI is missing');
  const content = await readAsStringAsync(fileUri);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            font-family: 'Courier New', Courier, monospace; 
            padding: 40px; 
            line-height: 1.5; 
            white-space: pre-wrap;
            color: #1a1a1a;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
};
