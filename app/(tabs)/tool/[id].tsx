import { RichTextRenderer } from '@/components/RichTextRenderer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/hooks/use-app-theme';
import { getAcademicStudioAI } from '@/utils/api';
import { moderateScale, verticalScale } from '@/utils/responsive';
import { supabase } from '@/utils/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import Animated, { FadeInDown, FadeInUp, Layout, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay } from 'react-native-reanimated';
import { useSubscription } from '@/context/SubscriptionContext';
import { useUserActivity } from '@/context/UserActivityContext';
import { useHistory } from '@/context/HistoryContext';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

export default function ToolScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme: themeName, isDark } = useTheme();
  const theme = COLORS[themeName];
  const { t } = useLanguage();
  const { isPremium, canUseAI, consumeAIUse } = useSubscription();
  const { logActivity } = useUserActivity();
  const { addToHistory } = useHistory();

  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [base64Content, setBase64Content] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [quizMode, setQuizMode] = useState<'mcq' | 'case' | 'qa' | 'self'>('mcq');
  const [userAnswers, setUserAnswers] = useState<any>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradeFeedback, setGradeFeedback] = useState<string | null>(null);

  const exportResultToPDF = async () => {
    if (!aiResult) return;
    try {
      const toolColor = tool.color || '#3B82F6';
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1E293B; }
              .header { border-bottom: 2px solid ${toolColor}; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 28px; font-weight: bold; color: ${toolColor}; }
              .meta { font-size: 12px; color: #64748B; margin-top: 5px; }
              .content { line-height: 1.6; font-size: 14px; }
              .section { margin-top: 25px; padding: 15px; background: #F8FAFC; border-radius: 8px; }
              .footer { margin-top: 50px; font-size: 10px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">EduAI: ${tool.title} Result</div>
              <div class="meta">Generated locally on ${new Date().toLocaleDateString()}</div>
            </div>
            <div class="content">
              ${aiResult.replace(/\n/g, '<br/>')}
            </div>
            <div class="footer">
              Produced by EduAI Premium Academic Suite. For personal study only.
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert("Export Error", "Could not generate PDF.");
    }
  };

  const handleAIGrading = async (qIndex: number, userAnswer: string, modelAnswer: string) => {
    if (!userAnswer.trim()) {
      Alert.alert("Empty Answer", "Please write something to be graded.");
      return;
    }
    setGradingLoading(true);
    try {
      const prompt = `Act as an academic examiner. 
      Question: ${manualText || "Assigned Task"}
      Correct Criteria/Model Answer: ${modelAnswer}
      Student Answer: ${userAnswer}
      
      Score the student on a scale of 0-10. Provide 2 sentences of constructive feedback. 
      Format: [SCORE] X/10 [FEEDBACK] Your feedback here.`;
      
      const response = await getAcademicStudioAI(prompt, "", "text/plain");
      setGradeFeedback(response);
      Alert.alert("AI Grading Result", response);
    } catch (e) {
      Alert.alert("Grading Error", "Could not reach the AI examiner.");
    } finally {
      setGradingLoading(false);
    }
  };

  // 🌀 PREMIUM GENESIS ANIMATION LOGIC
  const pulseValue = useSharedValue(1);
  const rotationValue = useSharedValue(0);
  const floatValue = useSharedValue(0);
  const shimmerValue = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
    opacity: 0.4 + (pulseValue.value - 1) * 2
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationValue.value}deg` }]
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerValue.value
  }));

  // 🌀 FIXED HOOKS: Define styles directly as hooks at the top level
  const floatStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatValue.value * 1.1 },
      { translateX: Math.sin(floatValue.value / 10 + 1) * 15 }
    ],
    opacity: 0.3 + Math.abs(Math.sin(floatValue.value / 20 + 1)) * 0.4
  }));

  const floatStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatValue.value * 1.2 },
      { translateX: Math.sin(floatValue.value / 10 + 2) * 15 }
    ],
    opacity: 0.3 + Math.abs(Math.sin(floatValue.value / 20 + 2)) * 0.4
  }));

  const floatStyle3 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatValue.value * 1.3 },
      { translateX: Math.sin(floatValue.value / 10 + 3) * 15 }
    ],
    opacity: 0.3 + Math.abs(Math.sin(floatValue.value / 20 + 3)) * 0.4
  }));

  const floatStyle4 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatValue.value * 1.4 },
      { translateX: Math.sin(floatValue.value / 10 + 4) * 15 }
    ],
    opacity: 0.3 + Math.abs(Math.sin(floatValue.value / 20 + 4)) * 0.4
  }));

  const brainStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatValue.value * 0.8 - 40 },
      { rotate: `${rotationValue.value * 0.2}deg` }
    ],
    opacity: withTiming(processing ? 0.8 : 0, { duration: 1000 })
  }));

  const moleculeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatValue.value * 0.8 + 20 },
      { rotate: `${rotationValue.value * 0.2}deg` }
    ],
    opacity: withTiming(processing ? 0.8 : 0, { duration: 1000 })
  }));

  useEffect(() => {
    if (processing) {
      pulseValue.value = withRepeat(withSequence(withTiming(1.3, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
      rotationValue.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false);
      floatValue.value = withRepeat(withSequence(withTiming(-15, { duration: 2000 }), withTiming(0, { duration: 2000 })), -1, true);
      shimmerValue.value = withRepeat(withSequence(withTiming(0.4, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
    } else {
      pulseValue.value = withTiming(1);
      rotationValue.value = withTiming(0);
      floatValue.value = withTiming(0);
      shimmerValue.value = withTiming(1);
    }
  }, [processing]);
  useEffect(() => {
    const loadToolState = async () => {
      setUploadedFile(null);
      setBase64Content(null);
      setMimeType(null);
      setAiResult(null);
      setSelectedAction(null);
      setManualText('');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const uid = user.id;

        const storedFile = await AsyncStorage.getItem(`eduai_file_${uid}_${id}`);
        const storedResult = await AsyncStorage.getItem(`eduai_result_${uid}_${id}`);
        const storedAction = await AsyncStorage.getItem(`eduai_action_${uid}_${id}`);
        const storedBase64 = await AsyncStorage.getItem(`eduai_base64_${uid}_${id}`);
        const storedMime = await AsyncStorage.getItem(`eduai_mime_${uid}_${id}`);

        if (storedFile) setUploadedFile(storedFile);
        if (storedResult) setAiResult(storedResult);
        if (storedAction) setSelectedAction(storedAction);
        if (storedBase64) setBase64Content(storedBase64);
        if (storedMime) setMimeType(storedMime);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    };
    loadToolState();
  }, [id]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('fileUploaded', async (data) => {
      if (data.toolId === id || !data.toolId || String(data.toolId) === String(id)) {
        setUploadedFile(data.fileName);
        setBase64Content(data.base64);
        setMimeType(data.mimeType);
        setAiResult(null);
        setSelectedAction(null);

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const uid = user.id;
            await AsyncStorage.setItem(`eduai_file_${uid}_${id}`, data.fileName);
            if (data.base64) {
              await AsyncStorage.setItem(`eduai_base64_${uid}_${id}`, data.base64);
              await AsyncStorage.setItem(`eduai_mime_${uid}_${id}`, data.mimeType);
            }
          }

          // 🚀 AUTO-SOLVE LOGIC
          if (id === 'solver') {
            handleAIProcess('solve');
          } else if (id === 'summarizer') {
            handleAIProcess('brief');
          } else if (id === 'grammar') {
            handleAIProcess('fix');
          }
        } catch (err) {
          console.error("Background save error:", err);
        }
      }
    });

    return () => subscription.remove();
  }, [id]);

  const handleAIProcess = async (action: string) => {
    // 🛡️ GATING LOGIC
    if (!canUseAI) {
      Alert.alert(
        "Daily Limit Reached",
        "You've used your 10 free AI tokens for today. Upgrade to EDU+ for unlimited academic power!",
        [
          { text: "Maybe Later", style: "cancel" },
          { text: "Upgrade Now", onPress: () => router.push('/subscription') }
        ]
      );
      return;
    }

    if (id === 'quiz' && (quizMode === 'case' || quizMode === 'qa' || quizMode === 'self' || numQuestions > 5) && !isPremium) {
      Alert.alert(
        "Premium Feature",
        "Advanced quiz modes and large question sets are available for EDU+ members only.",
        [
          { text: "Got it", style: "cancel" },
          { text: "Go Premium", onPress: () => router.push('/subscription') }
        ]
      );
      return;
    }

    setProcessing(true);
    setAiResult(null);
    setSelectedAction(action);
    try {
      const success = await consumeAIUse();
      if (!success && !isPremium) {
         setProcessing(false);
         return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || "anon";

      const prompts: any = {
        solver: {
          solve: "Solve the math problem. Use <section>SOLVED LOGIC</section>. Present steps in clear <p> paragraphs. IMPORTANT: Wrap ALL mathematical formulas, equations, and expressions in LaTeX using $$ for blocks and $ for inline. Do not use plain text for math.",
          explain: "Explain the conceptual theory. Use <section>ACADEMIC OVERVIEW</section>. Use <p> for logical sections. Highlight terms in <b>Bold</b>. Wrap math in LaTeX $...$.",
          similar: "Generate 3 similar practice tasks. Use <section>PRACTICE SESSION</section>. Wrap each task in <p> tags. Use LaTeX for math."
        },
        summarizer: {
          brief: "Provide a quick recap. Use <section>CORE HIGHLIGHTS</section>. Format result as a smooth <p> paragraph. Use <b>Bold</b> for the main entity.",
          detailed: "Provide comprehensive research points. Use <section>DETAILED ANALYSIS</section>. Each major point must be a separate <p>...</p> paragraph. Use <b>...</b> for crucial dates/events.",
          tasks: "Extract action items. Use <section>ACTION ITEMS</section>. For each item, use a <p> tag with <b>Bold</b> deadlines."
        },
        writer: {
          outline: "Draft a high-level structure. Use <section>STRUCTURAL FLOW</section>. Use <p> for each section's rationale.",
          expand: "Expand the text professionally. Use <section>DEEP ANALYSIS</section>. Each expanded thought must be a well-structured <p> paragraph.",
          improve: "Enhance the stylistic quality. Use <section>REFINED VERSION</section>. Wrap the improved text in <p> tags and use <b>...</b> for stylistic upgrades."
        },
        grammar: {
          fix: "Correct grammar and spelling. Use <section>CORRECTED VERSION</section>. Wrap the fixed text in <p> tags. Use <b>...</b> to highlight specific fixes.",
          tone: "Adjust the tone for academic settings. Use <section>TONE ADJUSTMENT</section>. Provide the revised version in <p> tags.",
          rephrase: "Rephrase clearly. Use <section>ALTERNATIVE PHRASING</section>. Present each choice as a separate <p> tag."
        },
        quiz: {
          generate: quizMode === 'mcq'
            ? `Elite Academic Quiz Creator. Use <section>SENSORY MCQ SET</section> header. 
            Format: Q[Number]: [Question Text]\nA) [Option 1]\nB) [Option 2]\nC) [Option 3]\nD) [Option 4]\nCorrect: [A/B/C/D]\nExplanation: <p>A deep conceptual explanation with <b>critical terms</b> highlighted.</p>`
            : quizMode === 'case'
              ? `Professional Case Analyst. Generate a Deep Case Study.
              - Use <section>SITUATION OVERVIEW</section>, <section>CORE CONFLICT</section>, <section>STAKEHOLDER ANALYSIS</section>, <section>CASE DATA</section>, <section>CRITICAL QUESTIONS</section>, <section>ANALYTICAL HINT</section> as headers.
              - Wrap each section's content in a single smooth <p>...</p> paragraph.
              - Use <b>bold</b> for key names/entities inside the paragraph.`
              : quizMode === 'self'
                ? `Interactive Exam. Use <section>PRACTICE EXAM</section>. Wrap questions and hints in <p> tags.`
                : `Socratic Dialogue. Use <section>SOCRATIC DIALOGUE</section>. Wrap answers in <p> tags with <b>bold</b> points.`
        }
      };

      const currentPromptPrefix = (prompts[id as string] || {})[action] || "Analyze the document.";
      const currentPrompt = `${currentPromptPrefix}\n\nTopic/Context: ${manualText?.trim() || 'Extracted from image'}`;

      const response = await getAcademicStudioAI(currentPrompt, (manualText?.trim() || base64Content || ""), manualText?.trim() ? "text/plain" : (mimeType || "image/jpeg"));
      setAiResult(response);

      // 💾 CLOUD SYNC FOR MULTI-DEVICE (Phase 2)
      if (user) {
        await supabase.from('documents').insert({
          user_id: user.id,
          title: `${tool.title} Discovery`,
          content: response,
          file_type: `AI ${(tool as any).title} Insight`,
          created_at: new Date().toISOString()
        });
      }

      await AsyncStorage.setItem(`eduai_result_${uid}_${id}`, response);
      await AsyncStorage.setItem(`eduai_action_${uid}_${id}`, action);

      // 💾 LOCAL HISTORY SYNC (Privacy First)
      await addToHistory({
        toolId: id as string,
        toolTitle: tool.title,
        action: action,
        content: response,
        input: manualText?.trim() || 'Scanned Input'
      });

      // 📈 LOG ACTIVITY
      logActivity(id as any, `Used ${tool.title}: ${action}`);
    } catch (error) {
      console.error("AI Error:", error);
      setAiResult("Error connecting to AI. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUp.trim() || !aiResult) return;

    // 🛡️ GATING LOGIC FOR FOLLOW-UP
    if (!canUseAI) {
      Alert.alert(
        "Daily Limit Reached",
        "You've used your 10 free AI tokens for today. Upgrade to EDU+ for unlimited follow-up queries!",
        [
          { text: "Maybe Later", style: "cancel" },
          { text: "Upgrade Now", onPress: () => router.push('/subscription') }
        ]
      );
      return;
    }

    setFollowUpLoading(true);
    try {
      const success = await consumeAIUse();
      if (!success && !isPremium) {
         setFollowUpLoading(false);
         return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || "anon";

      const prompt = `Based on this previous result:\n\n${aiResult}\n\nAnswer this follow-up question: ${followUp}. Keep the same formatting style ([HIGHLIGHT], [STEP], etc.)`;
      const response = await getAcademicStudioAI(prompt, "", "text/plain");

      const newResult = aiResult + "\n\n<section>FOLLOW-UP RESPONSE</section>\n**Question:** " + followUp + "\n\n" + response;
      setAiResult(newResult);
      setFollowUp('');
      await AsyncStorage.setItem(`eduai_result_${uid}_${id}`, newResult);
      
      // 📈 LOG ACTIVITY
      logActivity(id as any, `Follow-up query on ${tool.title}`);
    } catch (error) {
      console.error("Follow-up Error:", error);
      Alert.alert("Error", "Could not process follow-up.");
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!aiResult) return;
    await Clipboard.setStringAsync(aiResult);
    Alert.alert("Copied!", "Result copied to clipboard.");
  };

  const handleShare = async () => {
    if (!aiResult) return;
    try {
      await Share.share({
        message: aiResult,
        title: `EduAI ${tool.title} Result`,
      });
    } catch (error) {
      console.log('Share Error:', error);
    }
  };

  const getToolDetails = (toolId: string) => {
    switch (toolId) {
      case 'summarizer': return { title: 'AI Summarizer', icon: 'library-outline' as const, color: isDark ? '#F472B6' : '#BE185D', desc: 'Paste text or upload a document for instant key points.' };
      case 'solver': return { title: 'Math Solver', icon: 'calculator-outline' as const, color: isDark ? '#34D399' : '#047857', desc: 'Solve equations or algebra problems with step-by-step logic.' };
      case 'writer': return { title: 'Writer Studio', icon: 'create-outline' as const, color: isDark ? '#FBBF24' : '#B45309', desc: 'Generate essays, outlines, or academic paragraphs.' };
      case 'grammar': return { title: 'Grammar Pro', icon: 'language-outline' as const, color: isDark ? '#818CF8' : '#4338CA', desc: 'Professional proofreading, tone improvement, and rephrasing.' };
      case 'quiz': return { title: 'Quiz Genesis', icon: 'help-circle-outline' as const, color: isDark ? '#A78BFA' : '#7C3AED', desc: 'Generate high-level conceptual quizzes and case studies.' };
      default: return { title: 'AI Tool', icon: 'sparkles-outline' as const, color: '#3B82F6', desc: 'Advanced AI processing studio.' };
    }
  };

  const tool = getToolDetails(id as string);

  const actions = (() => {
    switch (id) {
      case 'solver': return [
        { id: 'solve', label: 'Solve Problem', icon: 'function-variant' },
        { id: 'explain', label: 'Explain Logic', icon: 'head-cog-outline' },
        { id: 'similar', label: 'Practice Tasks', icon: 'pencil-ruler' }
      ];
      case 'summarizer': return [
        { id: 'brief', label: 'Brief Summary', icon: 'format-list-bulleted' },
        { id: 'detailed', label: 'Key Arguments', icon: 'card-text-outline' },
        { id: 'tasks', label: 'Extract Action', icon: 'checkbox-marked-circle-outline' }
      ];
      case 'writer': return [{ id: 'outline', label: 'Create Content', icon: 'script-text-outline' }];
      case 'grammar': return [{ id: 'fix', label: 'Fix Text', icon: 'spellcheck' }];
      case 'quiz': return [{ id: 'generate', label: 'Generate Quiz', icon: 'auto-fix' }];
      default: return [];
    }
  })();

  const resetQuiz = () => {
    setAiResult(null);
    setSelectedAction(null);
    setUserAnswers({});
    setQuizScore(null);
    setShowExplanations(false);
  };

  const handleClearFile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id;
    setUploadedFile(null);
    setBase64Content(null);
    resetQuiz();
    if (uid) {
      await AsyncStorage.removeItem(`eduai_file_${uid}_${id}`);
      await AsyncStorage.removeItem(`eduai_base64_${uid}_${id}`);
      await AsyncStorage.removeItem(`eduai_result_${uid}_${id}`);
    }
  };

  const parseQuiz = (text: string) => {
    const questions: any[] = [];
    if (quizMode === 'case') return questions;

    // Support Q1:, Q 1:, Question 1:, Questions:, etc.
    const questionBlocks = text.split(/(?:\*\*Question|\*\*Q|Question|Q)\s*\d+[:\-\*]?/gi).filter(b => b.trim() !== "");

    const cleanText = (str: string) => {
      if (!str) return "";
      // Remove all double asterisks, single asterisks, and specific markers
      return str.replace(/\*/g, "").replace(/\[HIGHLIGHT\]|\[STEP\]|\[DIAGRAM\]/gi, "").trim();
    };

    questionBlocks.forEach((block, index) => {
      const parts = block.trim().split("\n").filter(p => p.trim() !== "");
      const qTextLine = parts[0] || "";
      let qText = cleanText(qTextLine);

      if (quizMode === 'mcq') {
        const extractOption = (key: string) => {
          const match = block.match(new RegExp(`${key}\\)?\\s*[:-]?\\s*(.*)`, "i"));
          return cleanText(match?.[1] || "");
        };

        const options = {
          A: extractOption("A"),
          B: extractOption("B"),
          C: extractOption("C"),
          D: extractOption("D"),
        };
        const correct = block.match(/(?:Correct|Answer):\s*([A-D])/i)?.[1]?.toUpperCase() || "";
        const explanation = cleanText(block.match(/Explanation:\s*(.*)/i)?.[1] || "");

        if (qText && (options.A || options.B)) {
          questions.push({ id: index, question: qText, options, correct, explanation });
        }
      } else if (quizMode === 'self' || quizMode === 'qa') {
        const hint = cleanText(block.match(/(?:\[THOUGHT PROMPT\]|Hint):\s*(.*)/i)?.[1] || "");
        const modelAnswer = cleanText(block.match(/(?:Model Answer|Answer):\s*([\s\S]*)/i)?.[1] || "");

        if (qText && qText.length > 5) {
          questions.push({ id: index, question: qText, hint, modelAnswer: modelAnswer.trim() });
        }
      }
    });
    return questions;
  };

  const calculateScore = (questions: any[]) => {
    // Check if everything is answered
    const answeredCount = Object.keys(userAnswers).filter(k => !isNaN(Number(k))).length;
    if (answeredCount < questions.length) {
      Alert.alert("Quiz Incomplete", `Please solve all questions before grading. You've answered ${answeredCount}/${questions.length} questions.`);
      return;
    }

    let score = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.correct) score++;
    });
    setQuizScore(score);
    setShowExplanations(true);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#020617' : '#F8FAFC' }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      {/* 🎭 Dynamic Tool Background Accent */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[tool.color + '10', 'transparent']}
          style={{ height: verticalScale(300), position: 'absolute', top: 0, left: 0, right: 0 }}
        />
        {id === 'solver' && (
          <View style={styles.mathDecoration}>
            <MaterialCommunityIcons name="format-overline" size={200} color={tool.color + '05'} style={{ position: 'absolute', top: 50, right: -50 }} />
          </View>
        )}
        {id === 'writer' && (
          <View style={styles.writerDecoration}>
            <Ionicons name="pencil" size={180} color={tool.color + '05'} style={{ position: 'absolute', bottom: 100, left: -40 }} />
          </View>
        )}
        {id === 'summarizer' && (
          <View style={styles.summarizerDecoration}>
            <Ionicons name="library" size={220} color={tool.color + '05'} style={{ position: 'absolute', top: 80, left: -60 }} />
            <MaterialCommunityIcons name="book-open-page-variant" size={150} color={tool.color + '03'} style={{ position: 'absolute', bottom: 50, right: -30 }} />
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.iconBox, {
              backgroundColor: tool.color + '12',
              borderColor: tool.color + '30',
              borderWidth: 1,
              shadowColor: tool.color,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 5
            }]}
          >
            <Ionicons name={tool.icon} size={moderateScale(38)} color={tool.color} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tool.color }]}>{tool.title}</ThemedText>
          <View style={[styles.premiumBadge, { backgroundColor: tool.color + '25', borderColor: tool.color + '30', borderWidth: 1 }]}>
            <MaterialCommunityIcons name="star-face" size={12} color={tool.color} />
            <ThemedText style={{ fontSize: 10, fontWeight: '900', color: tool.color, marginLeft: 6, letterSpacing: 1.5 }}>ACADEMIC ELITE</ThemedText>
          </View>
          <ThemedText style={[styles.desc, { color: theme.text, opacity: 0.85 }]}>{tool.desc}</ThemedText>
        </Animated.View>

        {(id === 'writer' || id === 'grammar') && (
          <View style={styles.inputContainer}>
            <View style={styles.badge}>
              <Ionicons name={id === 'writer' ? "create" : "text"} size={16} color={tool.color} />
              <ThemedText style={[styles.inputLabel, { color: tool.color, marginBottom: 0, marginLeft: 8 }]}>
                {id === 'writer' ? "Writing Space" : "Grammar Space"}
              </ThemedText>
            </View>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder={id === 'writer' ? "Type your ideas here..." : "Paste text here..."}
              placeholderTextColor={theme.gray}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={manualText}
              onChangeText={setManualText}
            />
            {manualText.trim().length > 5 && !aiResult && !processing && (
              <TouchableOpacity style={[styles.generateBtn, { backgroundColor: tool.color }]} onPress={() => handleAIProcess(actions[0]?.id || 'solve')}>
                <ThemedText style={styles.generateBtnText}>PROCESS NOW</ThemedText>
                <Ionicons name="sparkles" size={18} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {!(id === 'writer' || id === 'grammar') && (
          <View style={styles.uploadSection}>
            {/* 🎯 QUIZ SPECIALIZATION OPTIONS */}
            {id === 'quiz' && !aiResult && (
              <View style={{ marginBottom: 25 }}>
                <ThemedText style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, opacity: 0.6 }}>CHOOSE QUIZ STRATEGY</ThemedText>
                <Animated.View layout={Layout.springify()} style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { id: 'mcq', label: 'MCQs', icon: 'list' },
                    { id: 'case', label: 'Case Study', icon: 'bulb' },
                    { id: 'self', label: 'Self Test', icon: 'create' },
                    { id: 'qa', label: 'Deep Q&A', icon: 'help-buoy' }
                  ].map(mode => (
                    <TouchableOpacity
                      key={mode.id}
                      onPress={() => setQuizMode(mode.id as any)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 20,
                        backgroundColor: quizMode === mode.id ? tool.color : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: quizMode === mode.id ? tool.color : 'transparent',
                        shadowColor: quizMode === mode.id ? tool.color : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: quizMode === mode.id ? 0.3 : 0,
                        shadowRadius: 8,
                        elevation: quizMode === mode.id ? 4 : 0
                      }}
                    >
                      <Ionicons name={mode.icon as any} size={18} color={quizMode === mode.id ? '#FFF' : tool.color} />
                      <ThemedText style={{ fontSize: 9, fontWeight: '900', marginTop: 5, color: quizMode === mode.id ? '#FFF' : theme.text }}>{mode.label}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </Animated.View>

                {/* 🔢 NUMBER SELECTOR FOR MCQS (ENHANCED STEP) */}
                {quizMode === 'mcq' && (
                  <Animated.View entering={FadeInUp} style={{ marginTop: 25, padding: 20, borderRadius: 24, backgroundColor: tool.color + '08', borderWidth: 1, borderColor: tool.color + '20' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                      <ThemedText style={{ fontSize: 12, fontWeight: '900', letterSpacing: 1, color: tool.color }}>CHOOSE QUANTITY:</ThemedText>
                      <ThemedText style={{ fontSize: 10, fontWeight: '700', opacity: 0.5 }}>How many questions?</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {[5, 10, 15].map(n => (
                        <TouchableOpacity
                          key={n}
                          onPress={() => setNumQuestions(n)}
                          style={{
                            flex: 1,
                            height: 50,
                            borderRadius: 16,
                            backgroundColor: numQuestions === n ? tool.color : (isDark ? 'rgba(255,255,255,0.05)' : '#FFF'),
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: numQuestions === n ? tool.color : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
                            shadowColor: numQuestions === n ? tool.color : 'transparent',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: numQuestions === n ? 0.2 : 0,
                            shadowRadius: 10,
                            elevation: numQuestions === n ? 4 : 0
                          }}
                        >
                          <ThemedText style={{ fontSize: 16, fontWeight: '900', color: numQuestions === n ? '#FFF' : theme.text }}>{n}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Animated.View>
                )}
              </View>
            )}

            {!uploadedFile ? (
              <TouchableOpacity
                style={[styles.uploadCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: '/scanner', params: { toolId: id } })}
              >
                <View style={[styles.iconCircle, { backgroundColor: tool.color + '15' }]}>
                  <Ionicons name="camera" size={32} color={tool.color} />
                </View>
                <ThemedText style={styles.uploadTitle}>Scan Document</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={[styles.fileCard, { backgroundColor: theme.card, borderColor: tool.color + '30', borderWidth: 1.5 }]}>
                <View style={[styles.fileIconIndicator, { backgroundColor: tool.color + '15' }]}>
                  <Ionicons name="document-text" size={22} color={tool.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <ThemedText style={[styles.fileName, { color: tool.color }]} numberOfLines={1}>{uploadedFile}</ThemedText>
                  <ThemedText style={[styles.fileStatus, { color: tool.color, opacity: 0.8 }]}>Document attached • Ready to probe</ThemedText>
                </View>
                <TouchableOpacity onPress={handleClearFile} style={styles.clearFileBtn}>
                  <Ionicons name="close" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {uploadedFile && !aiResult && !processing && (
          <View style={styles.actionGrid}>
            {actions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                onPress={() => handleAIProcess(action.id)}
              >
                <MaterialCommunityIcons name={action.icon as any} size={20} color={tool.color} />
                <ThemedText style={[styles.actionLabel, { color: theme.text }]}>{action.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {processing && (
          <View style={styles.genesisContainer}>
             {/* 🌌 High-Fidelity 3D Assets */}
             <Animated.Image 
               source={require('@/assets/images/3d_brain.png')} 
               style={[styles.floating3D, brainStyle, { left: '5%', width: 70, height: 70 }]} 
               resizeMode="contain"
             />
             <Animated.Image 
               source={require('@/assets/images/3d_molecule.png')} 
               style={[styles.floating3D, moleculeStyle, { right: '5%', width: 60, height: 60 }]} 
               resizeMode="contain"
             />

             {/* 🌌 Technical Orbitals */}
             <Animated.View style={[styles.particle, floatStyle1, { top: '15%', left: '20%' }]}>
                <MaterialCommunityIcons name="atom" size={20} color={tool.color} />
             </Animated.View>
             <Animated.View style={[styles.particle, floatStyle2, { top: '25%', right: '15%' }]}>
                <MaterialCommunityIcons name="calculator" size={18} color={tool.color} />
             </Animated.View>
             <Animated.View style={[styles.particle, floatStyle3, { bottom: '30%', left: '10%' }]}>
                <MaterialCommunityIcons name="book-open-page-variant" size={16} color={tool.color} />
             </Animated.View>
             <Animated.View style={[styles.particle, floatStyle4, { bottom: '20%', right: '25%' }]}>
                <MaterialCommunityIcons name="function" size={22} color={tool.color} />
             </Animated.View>

             <Animated.View style={[styles.genesisPulse, pulseStyle, { backgroundColor: tool.color + '40' }]} />
             <Animated.View style={[styles.genesisPulseInner, { backgroundColor: tool.color + '20' }]} />
             
             <Animated.View style={[styles.auraRing, rotateStyle, { borderColor: tool.color + '60' }]} />

             <View style={[styles.genesisOrb, { backgroundColor: tool.color }]}>
                <Ionicons name={tool.icon} size={35} color="#FFF" />
             </View>
             
             <Animated.Text style={[styles.genesisText, shimmerStyle, { color: tool.color }]}>GENESIS IN PROGRESS</Animated.Text>
             <ThemedText style={[styles.genesisSubText, { color: theme.gray }]}>Architecting Academic Insights...</ThemedText>
          </View>
        )}

        {aiResult && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Ionicons name="sparkles" size={14} color={tool.color} />
              <ThemedText style={[styles.resultTitle, { color: theme.text, opacity: 0.5 }]}>ANALYSIS</ThemedText>
            </View>
            <View style={[
              styles.resultTextWrapper,
              {
                backgroundColor: theme.card,
                borderColor: tool.color + '40',
                borderWidth: isDark ? 0 : 1.5,
                shadowColor: tool.color,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: isDark ? 0.6 : 0.2,
                shadowRadius: 25,
                elevation: 12
              }
            ]}>
              {id === 'quiz' && aiResult && !aiResult.includes("Error") && (quizMode === 'mcq' || quizMode === 'self' || quizMode === 'qa') && parseQuiz(aiResult).length > 0 ? (
                <View>
                  {/* 📊 SCORE DASHBOARD (MCQ ONLY) */}
                  {quizScore !== null && quizMode === 'mcq' && (
                    <View style={[styles.scoreContainer, { borderColor: tool.color + '30', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <ThemedText style={styles.scoreLabel}>QUIZ PERFORMANCE</ThemedText>
                          <ThemedText style={[styles.scoreMessage, { color: theme.gray }]}>
                            {quizScore / parseQuiz(aiResult).length >= 0.8 ? 'Elite Mastery! 🏆' :
                              quizScore / parseQuiz(aiResult).length >= 0.5 ? 'Good Progress! 📈' : 'Keep Practicing! 🎯'}
                          </ThemedText>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <ThemedText style={[styles.scoreValue, { color: tool.color }]}>
                            {quizScore}/{parseQuiz(aiResult).length}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 13, fontWeight: '700', opacity: 0.6 }}>
                            {Math.round((quizScore / parseQuiz(aiResult).length) * 100)}%
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.scoreBarBackground}>
                        <View style={[
                          styles.scoreBarFill,
                          {
                            width: `${(quizScore / parseQuiz(aiResult).length) * 100}%`,
                            backgroundColor: quizScore / parseQuiz(aiResult).length >= 0.8 ? '#10B981' :
                              quizScore / parseQuiz(aiResult).length >= 0.5 ? '#F59E0B' : '#EF4444'
                          }
                        ]} />
                      </View>
                    </View>
                  )}

                  {/* 📝 QUESTIONS LIST */}
                  {parseQuiz(aiResult).map((q, idx) => (
                    <View key={q.id} style={styles.quizQuestionCard}>
                      <View style={styles.qHeaderRow}>
                        <View style={[styles.qNumberCircle, { backgroundColor: tool.color }]}>
                          <ThemedText style={styles.qNumberTextInner}>{idx + 1}</ThemedText>
                        </View>
                        <ThemedText style={[styles.qText, { color: theme.text }]}>{q.question}</ThemedText>
                      </View>

                      {quizMode === 'mcq' ? (
                        <View style={{ gap: 12, marginTop: 20 }}>
                          {Object.entries(q.options).map(([key, val]: any) => {
                            if (!val) return null;
                            const isSelected = userAnswers[idx] === key;
                            const isCorrect = q.correct === key;
                            const showResult = showExplanations;

                            let backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC';
                            let borderColor = 'transparent';

                            if (showResult) {
                              if (isCorrect) {
                                backgroundColor = '#10B98120';
                                borderColor = '#10B981';
                              } else if (isSelected) {
                                backgroundColor = '#EF444420';
                                borderColor = '#EF4444';
                              }
                            } else if (isSelected) {
                              backgroundColor = tool.color + '20';
                              borderColor = tool.color;
                            }

                            return (
                              <TouchableOpacity
                                key={key}
                                disabled={showExplanations}
                                onPress={() => setUserAnswers({ ...userAnswers, [idx]: key })}
                                activeOpacity={0.8}
                                style={[
                                  styles.quizOptionBtn,
                                  {
                                    backgroundColor,
                                    borderColor,
                                    borderWidth: isSelected || (showResult && isCorrect) ? 2.5 : 1,
                                  }
                                ]}
                              >
                                <View style={[styles.optionBadge, { backgroundColor: isSelected || (showResult && isCorrect) ? tool.color : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0') }]}>
                                  <ThemedText style={[styles.optionKeyText, { color: isSelected || (showResult && isCorrect) ? '#FFF' : theme.text }]}>{key}</ThemedText>
                                </View>
                                <ThemedText style={[styles.optionValue, { color: theme.text, opacity: showResult && !isCorrect && isSelected ? 0.6 : 1 }]}>{val}</ThemedText>

                                {!showResult && isSelected && (
                                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: tool.color, justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="checkmark" size={14} color="#FFF" />
                                  </View>
                                )}

                                {showResult && isCorrect && <Ionicons name="checkmark-done" size={20} color="#10B981" />}
                                {showResult && isSelected && !isCorrect && <Ionicons name="close-outline" size={20} color="#EF4444" />}
                              </TouchableOpacity>
                            );
                          })}
                          {showExplanations && (
                            <View style={styles.explanationBox}>
                              <ThemedText style={styles.explanationTitle}>LOGIC:</ThemedText>
                              <RichTextRenderer
                                content={q.explanation}
                                highlightColor={tool.color}
                                textColor={theme.gray}
                                fontSize={12}
                                isDark={isDark}
                              />
                            </View>
                          )}
                        </View>
                      ) : (
                        <View style={{ marginTop: 20 }}>
                          {q.hint && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, opacity: 0.6 }}>
                              <Ionicons name="bulb-outline" size={14} color={tool.color} />
                              <ThemedText style={{ fontSize: 11, fontWeight: '700', marginLeft: 6 }}>HINT: {q.hint}</ThemedText>
                            </View>
                          )}
                          <TextInput
                            style={[styles.subjectiveInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', color: theme.text, borderColor: theme.border }]}
                            placeholder="Type your answer here..."
                            placeholderTextColor={theme.gray}
                            multiline
                            value={userAnswers[idx] || ''}
                            onChangeText={(text) => setUserAnswers({ ...userAnswers, [idx]: text })}
                          />
                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                            {userAnswers[idx]?.length > 10 && (
                              <TouchableOpacity
                                style={[styles.gradeBtnMini, { backgroundColor: tool.color, flex: 1.5 }]}
                                onPress={async () => {
                                  setProcessing(true);
                                  try {
                                    const evalPrompt = `Question: ${q.question}\nUser's Answer: ${userAnswers[idx]}\n\nEvaluate this answer critically as an academic supervisor. Highlight strong points in [HIGHLIGHT] and suggest improvements. Provide a score out of 10.`;
                                    const result = await getAcademicStudioAI(evalPrompt, "", "text/plain");
                                    setUserAnswers({ ...userAnswers, [`eval_${idx}`]: result });
                                  } catch (e) {
                                    Alert.alert("Error", "Could not evaluate answer.");
                                  } finally {
                                    setProcessing(false);
                                  }
                                }}
                              >
                                <ThemedText style={styles.gradeBtnTextMini}>EVALUATE MY ANSWER</ThemedText>
                                <Ionicons name="analytics" size={14} color="#FFF" />
                              </TouchableOpacity>
                            )}

                            {q.modelAnswer && (
                              <TouchableOpacity
                                style={[styles.gradeBtnMini, { backgroundColor: 'rgba(0,0,0,0.05)', flex: 1, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }]}
                                onPress={() => setUserAnswers({ ...userAnswers, [`show_ans_${idx}`]: !userAnswers[`show_ans_${idx}`] })}
                              >
                                <ThemedText style={[styles.gradeBtnTextMini, { color: theme.text }]}>
                                  {userAnswers[`show_ans_${idx}`] ? 'HIDE ANSWER' : 'SHOW ANSWER'}
                                </ThemedText>
                                <Ionicons name="eye-outline" size={14} color={theme.text} />
                              </TouchableOpacity>
                            )}
                          </View>

                          {userAnswers[`show_ans_${idx}`] && q.modelAnswer && (
                            <Animated.View entering={FadeInUp.duration(400)} style={[styles.explanationBox, { marginTop: 15, borderLeftColor: '#10B981', backgroundColor: isDark ? 'rgba(16,185,129,0.05)' : '#10B98108' }]}>
                              <View style={styles.badgeRow}>
                                <View style={[styles.miniStatusBadge, { backgroundColor: '#10B981' }]}>
                                  <Ionicons name="school" size={10} color="#FFF" />
                                  <ThemedText style={styles.miniBadgeText}>MODEL ANSWER</ThemedText>
                                </View>
                              </View>
                              <RichTextRenderer
                                content={q.modelAnswer}
                                highlightColor="#10B981"
                                textColor={theme.text}
                                fontSize={13}
                                isDark={isDark}
                              />
                            </Animated.View>
                          )}

                          {userAnswers[`eval_${idx}`] && (
                            <Animated.View entering={FadeInUp.duration(400)} style={[styles.evaluationResult, { backgroundColor: tool.color + '05', borderColor: tool.color + '20' }]}>
                              <View style={styles.badgeRow}>
                                <View style={[styles.miniStatusBadge, { backgroundColor: tool.color }]}>
                                  <Ionicons name="analytics" size={10} color="#FFF" />
                                  <ThemedText style={styles.miniBadgeText}>AI EVALUATION</ThemedText>
                                </View>
                              </View>
                              <RichTextRenderer
                                content={userAnswers[`eval_${idx}`]}
                                highlightColor={tool.color}
                                textColor={theme.text}
                                fontSize={13}
                                isDark={isDark}
                              />
                            </Animated.View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}

                  {!showExplanations && quizMode === 'mcq' && (
                    <TouchableOpacity
                      style={[styles.gradeBtn, { backgroundColor: tool.color }]}
                      onPress={() => calculateScore(parseQuiz(aiResult))}
                    >
                      <ThemedText style={styles.gradeBtnText}>GRADE MY QUIZ</ThemedText>
                      <Ionicons name="analytics" size={20} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <RichTextRenderer
                  content={aiResult}
                  highlightColor={tool.color}
                  textColor={isDark ? '#FFFFFF' : '#0F172A'}
                  isDark={isDark}
                />
              )}

              {/* 🚀 Quick Actions Bar */}
              <View style={styles.resultActions}>
                <TouchableOpacity style={[styles.actionBadge, { backgroundColor: tool.color + '15' }]} onPress={handleCopy}>
                  <Ionicons name="copy-outline" size={16} color={tool.color} />
                  <ThemedText style={{ color: tool.color, fontWeight: '800', fontSize: 11, marginLeft: 8 }}>COPY</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBadge, { backgroundColor: tool.color + '15' }]} onPress={handleShare}>
                  <Ionicons name="share-outline" size={16} color={tool.color} />
                  <ThemedText style={{ color: tool.color, fontWeight: '800', fontSize: 11, marginLeft: 8 }}>SHARE</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBadge, { backgroundColor: '#FF444415' }]} onPress={resetQuiz}>
                  <Ionicons name="trash-outline" size={16} color="#FF4444" />
                  <ThemedText style={{ color: '#FF4444', fontWeight: '800', fontSize: 11, marginLeft: 8 }}>DISCARD</ThemedText>
                </TouchableOpacity>
              </View>

              {/* 💬 Follow-up Interaction */}
              <View style={[styles.followUpContainer, { borderColor: tool.color + '40' }]}>
                <TextInput
                  style={[styles.followUpInput, { color: theme.text }]}
                  placeholder="Ask a clarifying question..."
                  placeholderTextColor={theme.gray}
                  value={followUp}
                  onChangeText={setFollowUp}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: tool.color }]}
                  onPress={handleFollowUp}
                  disabled={followUpLoading}
                >
                  {followUpLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="send" size={18} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, { borderColor: theme.border }]}>
               <Ionicons name="share-social-outline" size={20} color={theme.text} />
               <ThemedText style={styles.actionBtnText}>Share</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={exportResultToPDF} style={[styles.actionBtn, { borderColor: theme.border }]}>
               <Ionicons name="download-outline" size={20} color={theme.text} />
               <ThemedText style={styles.actionBtnText}>PDF</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 45, marginTop: 50, gap: 15 },
  iconBox: { width: 90, height: 90, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 30 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -1.5, textAlign: 'center', marginBottom: 2 },
  desc: { fontSize: 12, textAlign: 'center', marginTop: 10, paddingHorizontal: 40, lineHeight: 18, fontWeight: '600' },
  inputContainer: { marginBottom: 25 },
  badge: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inputLabel: { fontSize: 13, fontWeight: '700' },
  textInput: { borderRadius: 15, padding: 15, fontSize: 15, borderWidth: 1, minHeight: 150 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, padding: 15, borderRadius: 15 },
  generateBtnText: { color: '#FFF', fontWeight: '800', marginRight: 8 },
  uploadSection: { marginBottom: 20 },
  uploadCard: { padding: 30, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadTitle: { fontWeight: '700' },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000000ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  fileIconIndicator: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  fileName: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  fileStatus: { fontSize: 11, fontWeight: '900', marginTop: 3, textTransform: 'uppercase', opacity: 0.9 },
  clearFileBtn: { padding: 10, borderRadius: 14, backgroundColor: '#FF444410' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  actionLabel: { marginLeft: 8, fontWeight: '700', fontSize: 12 },
  processingCard: { padding: 50, alignItems: 'center' },
  processingText: { marginTop: 10, fontWeight: '600' },
  resultContainer: { marginTop: 10 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  resultTitle: { marginLeft: 8, fontWeight: '800', fontSize: 11 },
  resultTextWrapper: { padding: 14, borderRadius: 24, elevation: 8 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 25, alignSelf: 'center', padding: 10 },
  retryText: { marginLeft: 6, fontSize: 13, fontWeight: '800' },
  mathDecoration: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  writerDecoration: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  summarizerDecoration: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  resultActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingHorizontal: 5 },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  followUpContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 20, borderTopWidth: 1, gap: 10 },
  followUpInput: { flex: 1, fontSize: 13, maxHeight: 80, paddingVertical: 5 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },

  quizQuestionCard: { marginBottom: 45, paddingBottom: 35, borderBottomWidth: 1.5, borderBottomColor: 'rgba(0,0,0,0.03)' },
  qHeaderRow: { flexDirection: 'row', gap: 15, alignItems: 'flex-start', marginBottom: 10 },
  qNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  qNumberTextInner: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  qText: { flex: 1, fontSize: 15, fontWeight: '800', lineHeight: 22, letterSpacing: -0.5 },
  quizOptionBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, gap: 14, marginBottom: 12, borderWidth: 2 },
  optionBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  optionKeyText: { fontWeight: '900', fontSize: 15 },
  optionValue: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  explanationBox: { marginTop: 15, padding: 16, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.02)', borderLeftWidth: 6, borderLeftColor: '#3B82F6', borderStyle: 'solid' },
  explanationTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 12, color: '#3B82F6', opacity: 0.8 },
  gradeBtn: {
    height: 68,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 35,
    elevation: 10
  },
  gradeBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 2, fontSize: 14, textTransform: 'uppercase' },
  scoreContainer: {
    padding: 24,
    borderRadius: 30,
    marginBottom: 40,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8
  },
  scoreLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 4, opacity: 0.7 },
  scoreMessage: { fontSize: 15, fontWeight: '800', marginBottom: 0 },
  scoreValue: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  scoreBarBackground: { height: 12, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 6, marginTop: 24, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 6 },
  subjectiveInput: { borderRadius: 24, padding: 20, fontSize: 16, borderWidth: 1.5, minHeight: 120, marginTop: 15, textAlignVertical: 'top', fontWeight: '600' },
  gradeBtnMini: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 22, borderRadius: 20, marginTop: 10, gap: 10, alignSelf: 'flex-start' },
  gradeBtnTextMini: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  evaluationResult: { marginTop: 20, padding: 22, borderRadius: 28, borderWidth: 1.5, borderLeftWidth: 6 },
  badgeRow: { flexDirection: 'row', marginBottom: 15 },
  miniStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6 },
  miniBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  // 🌀 GENESIS LOADER STYLES
  genesisContainer: { height: 300, justifyContent: 'center', alignItems: 'center', marginVertical: 40 },
  genesisOrb: {
    width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center',
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, zIndex: 10
  },
  genesisPulse: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  genesisPulseInner: { position: 'absolute', width: 110, height: 110, borderRadius: 55 },
  genesisText: { fontSize: 14, fontWeight: '900', letterSpacing: 3, marginTop: 40, textTransform: 'uppercase' },
  genesisSubText: { fontSize: 13, fontWeight: '700', marginTop: 10, opacity: 0.6, letterSpacing: 0.3 },
  auraRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.5
  },
  particle: {
    position: 'absolute',
    opacity: 0.5,
  },
  floating3D: {
    position: 'absolute',
    zIndex: 5,
  },
  evaluationCard: { marginTop: 20, padding: 22, borderRadius: 28, borderWidth: 1.5, borderLeftWidth: 8, overflow: 'hidden' },
  evaluationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  evaluationTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  modelAnswerText: { fontSize: 13, lineHeight: 22, fontWeight: '700', paddingLeft: 5 },
});
