import { ThemedText } from '@/components/themed-text';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    key: 's1',
    titleLine1: 'Master every',
    titleLine2: 'lesson with ease!',
    desc: 'Dive into an interactive world of learning. Our AI-powered platform turns complex study materials into fun experiences.',
    color: '#0066FF',
    // We reuse the existing hero asset
    img: require('../assets/images/onboarding_blue.png')
  },
  {
    key: 's2',
    titleLine1: 'Your 24/7',
    titleLine2: 'AI Study Buddy',
    desc: 'Stuck on challenging math or need urgent essay help? EduAI Tutor is always available with step-by-step guidance.',
    color: '#10B981',
    img: require('../assets/images/3d_brain.png')
  },
  {
    key: 's3',
    titleLine1: 'Organize and',
    titleLine2: 'Crush Exams',
    desc: 'Get smart push reminders, instant quiz generations, and powerful notifications to track your academic mastery natively.',
    color: '#F59E0B',
    img: require('../assets/images/3d_molecule.png')
  }
];

/**
 * UPDATED: Onboarding with Original Graduation Logo Splash
 */
export default function InitialEntryScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    // 1. Splash Logic (2.2s Duration)
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 2200);

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    return () => clearTimeout(timer);
  }, []);

  /* ── 🎓 SPLASH VIEW (WITH ORIGINAL LOGO) ── */
  if (showSplash) {
    return (
      <View style={styles.splashBg}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={[styles.splashCard, {
          opacity: fadeAnim, transform: [{
            scale: scaleAnim
          }]
        }]}>
          <View style={styles.logoCircle}>
            <FontAwesome5 name="graduation-cap" size={60} color="#0066FF" />
          </View>
          <ThemedText style={styles.splashBrand}>EduAI</ThemedText>
          <ThemedText style={styles.splashTagline}>The Future of Learning</ThemedText>
        </Animated.View>
      </View>
    );
  }

  /* ── 🔵 ONBOARDING VIEW (DYNAMIC SLIDER) ── */
  const slide = SLIDES[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: slide.key === 's1' ? '#E6F0FF' : slide.key === 's2' ? '#ECFDF5' : '#FFFBEB' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Illustration Header ── */}
      <View style={styles.headerSection}>
        <Image
          source={slide.img}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* ── Content Card ── */}
      <View style={styles.contentCard}>
        <View style={styles.textContent}>
          <ThemedText style={styles.title}>
            {slide.titleLine1}{"\n"}
            <ThemedText style={[styles.title, { color: slide.color }]}>{slide.titleLine2}</ThemedText>
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            {slide.desc}
          </ThemedText>
        </View>

        {/* ── Dots & Navigation ── */}
        <View style={styles.buttonRow}>
          {/* Pagination Indicators */}
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: currentSlideIndex === index ? slide.color : '#CBD5E1',
                    width: currentSlideIndex === index ? 30 : 10
                  }
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.arrowBtn, { backgroundColor: slide.color + '15' }]}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <Ionicons
              name={currentSlideIndex === SLIDES.length - 1 ? "checkmark-done" : "arrow-forward"}
              size={26}
              color={slide.color}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F0FF',
  },
  splashBg: {
    flex: 1,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashCard: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  splashBrand: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: 2,
  },
  splashTagline: {
    fontSize: 16,
    color: '#E6F0FF',
    opacity: 0.8,
    fontWeight: '600',
    marginTop: 5,
  },
  headerSection: {
    flex: 0.55,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  illustration: {
    width: width * 0.90,
    height: width * 0.90,
  },
  contentCard: {
    flex: 0.45,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 35,
    paddingTop: 45,
    paddingBottom: Platform.OS === 'ios' ? 70 : 45,
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1A1C1E',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#667085',
    lineHeight: 22,
    marginTop: 15,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  arrowBtn: {
    width: 65,
    height: 65,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
