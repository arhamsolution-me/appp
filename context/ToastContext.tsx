import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'reminder';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-150)).current;

  const showToast = (msg: string, t: ToastType = 'info') => {
    setMessage(msg);
    setType(t);
    setVisible(true);

    // Slide Down
    Animated.spring(slideAnim, {
      toValue: insets.top + 10,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();

    // Auto Hide (Reminder stays longer)
    const duration = t === 'reminder' ? 8000 : 3000;
    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, duration);
  };

  const getIcon = () => {
    switch(type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'reminder': return 'notifications';
      default: return 'information-circle';
    }
  };

  const getColor = () => {
    switch(type) {
      case 'success': return '#4CAF50';
      case 'error': return '#FF5252';
      case 'reminder': return '#FFB800';
      default: return '#2B65E2';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <BlurView intensity={80} tint="dark" style={styles.blur}>
            <View style={[styles.indicator, { backgroundColor: getColor() }]} />
            <Ionicons name={getIcon()} size={24} color={getColor()} style={styles.icon} />
            <ThemedText style={styles.message}>{message}</ThemedText>
          </BlurView>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  blur: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 15,
    bottom: 15,
    width: 4,
    borderRadius: 2,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
});
