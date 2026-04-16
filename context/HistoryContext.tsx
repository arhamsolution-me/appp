import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  toolId: string;
  toolTitle: string;
  action: string;
  content: string;
  timestamp: string;
  input?: string;
}

interface HistoryContextType {
  history: HistoryItem[];
  loading: boolean;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>;
  removeFromHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  getItem: (id: string) => HistoryItem | undefined;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

const HISTORY_STORAGE_KEY = 'eduai_local_history_v1';

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
    }
  };

  const saveHistory = async (newHistory: HistoryItem[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  const addToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    await saveHistory(updatedHistory);
  };

  const removeFromHistory = async (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    await saveHistory(updatedHistory);
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  const getItem = (id: string) => {
    return history.find(h => h.id === id);
  };

  return (
    <HistoryContext.Provider value={{ 
      history, 
      loading, 
      addToHistory, 
      removeFromHistory, 
      clearHistory,
      getItem
    }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
};
