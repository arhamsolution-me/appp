import { aiService } from '../services/AIService';
import { apiClient } from '../services/apiClient';

// Mock the apiClient to avoid actual network calls during tests
jest.mock('../services/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('AIService Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup environment variables for testing
    process.env.EXPO_PUBLIC_GROQ_API_KEY_1 = 'test-key';
  });

  it('successfully calls groq api and returns summary', async () => {
    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: 'This is a test summary.',
            },
          },
        ],
      },
    };
    
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await aiService.summarizeDocument('Sample text to summarize', 'quick');

    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringContaining('groq.com'),
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ content: 'Sample text to summarize' })
        ])
      }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-key' }
      })
    );
    expect(result).toBe('This is a test summary.');
  });

  it('handles API failure gracefully', async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    await expect(aiService.summarizeDocument('test', 'quick'))
      .rejects.toThrow('Summary generation failed: Network Error');
  });
});
