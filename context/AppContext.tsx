import React, { createContext, useContext, useState, ReactNode } from 'react';

// Domain model definitions for our global state
interface AppState {
  userSessionActive: boolean;
  userCredits: number;
  apiEngine: 'claude' | 'groq' | 'ocr.space';
}

interface AppContextType {
  state: AppState;
  login: () => void;
  logout: () => void;
  consumeCredit: () => void;
  setEngine: (engine: AppState['apiEngine']) => void;
}

// 1. Create the Context with a default undefined to enforce provider usage
const AppContext = createContext<AppContextType | undefined>(undefined);

// 2. Define the Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    userSessionActive: false,
    userCredits: 10,
    apiEngine: 'ocr.space',
  });

  // Action Creators
  const login = () => setState((prev) => ({ ...prev, userSessionActive: true }));
  const logout = () => setState((prev) => ({ ...prev, userSessionActive: false }));
  
  const consumeCredit = () => {
    setState((prev) => ({ 
      ...prev, 
      userCredits: Math.max(0, prev.userCredits - 1) 
    }));
  };

  const setEngine = (apiEngine: AppState['apiEngine']) => {
    setState((prev) => ({ ...prev, apiEngine }));
  };

  return (
    <AppContext.Provider value={{ state, login, logout, consumeCredit, setEngine }}>
      {children}
    </AppContext.Provider>
  );
};

// 3. Custom Hook for easy consumption and null-safety
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
