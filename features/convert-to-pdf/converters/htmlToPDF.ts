export const urlOrHtmlToHTML = async (input: string): Promise<string> => {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      const response = await fetch(input);
      const html = await response.text();
      // Simple sanitize: we could add more complex logic here or use a library
      return html;
    } catch (error) {
      console.error('URL Fetch Error:', error);
      throw new Error('Failed to fetch content from URL');
    }
  }
  
  // If it's just HTML string
  return input;
};
