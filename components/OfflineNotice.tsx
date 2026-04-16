import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineNotice = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      } else {
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
      }
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <Animated.View style={[
      styles.container, 
      { 
        opacity: fadeAnim, 
        paddingTop: insets.top + 10,
        backgroundColor: '#EF4444' 
      }
    ]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={18} color="#FFF" />
        <Text style={styles.text}>Offline Mode: AI Tools & Sync Disabled</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 10,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
