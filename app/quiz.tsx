import React, { useState } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS } from '@/hooks/use-app-theme';
import { useTheme } from '@/context/ThemeContext';

const QuizOption = ({ label, text, selected, onSelect, theme }: any) => (
  <TouchableOpacity 
    style={[styles.optionCard, { backgroundColor: theme.surface, borderColor: theme.border }, selected && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
    onPress={onSelect}
  >
    <ThemedText style={[styles.optionLabel, { color: theme.text }, selected && { color: '#fff' }]}>
      <ThemedText style={styles.boldLabel}>{label}. </ThemedText>{text}
    </ThemedText>
  </TouchableOpacity>
);

export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const [selectedOption, setSelectedOption] = useState<string | null>('A');

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backTouch}>
              <Ionicons name="arrow-back" size={26} color={theme.text} />
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Quiz</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
             <ThemedText style={[styles.progressText, { color: theme.gray }]}>2/5</ThemedText>
             {/* Dots Removed */}
          </View>
        </View>

        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View style={[styles.progressBarFill, { width: '40%', backgroundColor: theme.primary }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.questionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText style={[styles.questionText, { color: theme.text }]}>
                What is the main function of mitochondria in a cell?
            </ThemedText>

            <View style={styles.optionsList}>
              <QuizOption label="A" text="Produce energy (ATP)" selected={selectedOption === 'A'} onSelect={() => setSelectedOption('A')} theme={theme} />
              <QuizOption label="B" text="Store genetic information" selected={selectedOption === 'B'} onSelect={() => setSelectedOption('B')} theme={theme} />
              <QuizOption label="C" text="Protein synthesis" selected={selectedOption === 'C'} onSelect={() => setSelectedOption('C')} theme={theme} />
              <QuizOption label="D" text="Cell division" selected={selectedOption === 'D'} onSelect={() => setSelectedOption('D')} theme={theme} />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity style={[styles.prevBtn, { backgroundColor: theme.primary + '10' }]}>
            <ThemedText style={[styles.prevBtnText, { color: theme.primary }]}>Previous</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.nextBtnText}>Next →</ThemedText>
          </TouchableOpacity>
        </View>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontWeight: '700',
    fontSize: 14,
  },
  progressBarWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  questionContainer: {
    padding: 25,
    borderRadius: 25,
    borderWidth: 1,
  },
  questionText: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 25,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    padding: 18,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  boldLabel: {
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  prevBtnText: {
    fontWeight: '800',
    fontSize: 16,
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
