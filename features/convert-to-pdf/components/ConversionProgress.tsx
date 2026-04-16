import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { moderateScale, verticalScale } from '../../../utils/responsive';

export const ConversionProgress = () => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, animatedStyle]} />
      <View style={styles.content}>
        <ActivityIndicator color="#7C3AED" size="large" />
        <Text style={styles.text}>Converting to PDF...</Text>
        <Text style={styles.subtext}>Please wait, optimizing your document</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: 4,
    borderColor: '#7C3AED',
    borderTopColor: 'transparent',
    borderRightColor: 'rgba(124, 58, 237, 0.3)',
    opacity: 0.5,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginTop: verticalScale(20),
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(12),
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
});
