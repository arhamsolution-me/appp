import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import Katex from 'react-native-katex';
import { ThemedText } from './themed-text';

import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

/**
 * 🎨 DESIGN TOKENS (Expert Rule: 8px Spacing System)
 * XS: 8, SM: 16, MD: 24, LG: 32, XL: 48, XXL: 64
 */
const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

interface RichTextRendererProps {
  content: string;
  highlightColor?: string;
  textColor?: string;
  isDark?: boolean;
  fontSize?: number;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  highlightColor = '#6C63FF', // Primary Branding Variable
  textColor = '#333333',
  isDark = false,
  fontSize = 12,
}) => {
  if (!content) return null;

  // 🧼 Pre-render Clean: Strip AI-generated markdown "junk" dividers (###, ===, ---)
  const cleanContent = content
    .replace(/^[=\-#\*]{3,}\s*$/gm, "") // Strip divider lines
    .trim();

  // 🧩 Advanced Parsing: Group all markers + detect double newlines + support HTML-like tags
  const parts = cleanContent.split(/(\n\n|\*\*.*?\*\*|<b>.*?<\/b>|<p>.*?<\/p>|<section>.*?<\/section>|\[HIGHLIGHT\].*?\[\/HIGHLIGHT\]|\[TASK\].*?|\[STEP\].*?|\[DIAGRAM\].*?\[\/DIAGRAM\]|\[[A-Z\s]{3,}\]|```[\s\S]*?```|\|.*?\|(?:\r?\n\|.*?\|)*|\$\$[\s\S]*?\$$|\$.*?\$|\n)/g);

  return (
    <View style={[styles.mainWrapper, { shadowColor: highlightColor, backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#FFFFFF' }]}>
      {/* 🌌 Premium Glassmorphism (Cloudy Layer) */}
      <LinearGradient
        colors={isDark ? ['rgba(255,255,255,0.04)', highlightColor + '05', 'transparent'] : [highlightColor + '08', 'rgba(255,255,255,0.8)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.container}>
        {(() => {
          const rendered: any[] = [];
          let currentInlineGroup: any[] = [];

          const pushInlineGroup = (keyPrefix: string) => {
            if (currentInlineGroup.length === 0) return;
            rendered.push(
              <Animated.View key={`inline-${keyPrefix}`} entering={FadeInUp.duration(400)} style={styles.textFlowWrapper}>
                <ThemedText style={{ flex: 1 }}>
                  {currentInlineGroup}
                </ThemedText>
              </Animated.View>
            );
            currentInlineGroup = [];
          };

          parts.forEach((part, index) => {
            if (!part) return;

            // 📐 Check if part is a block element or inline
            const isBlock = part === '\n\n' ||
              (part.startsWith('```') && part.endsWith('```')) ||
              (part.startsWith('|') && part.includes('|')) ||
              (part.startsWith('$$') && part.endsWith('$$')) ||
              (part.startsWith('[DIAGRAM]') && part.endsWith('[/DIAGRAM]')) ||
              (part.startsWith('[') && part.endsWith(']') && part === part.toUpperCase());

            if (isBlock) {
              pushInlineGroup(index.toString());
              if (part === '\n\n') {
                rendered.push(<View key={`spacer-${index}`} style={{ height: 6 }} />);
                return;
              }

              let blockComponent: any = null;
              // Block elements logic
              if (part.startsWith('```')) {
                const rawCode = part.replace(/```/g, '').trim();
                blockComponent = (
                  <View style={[styles.codeBlock, { backgroundColor: isDark ? '#1E1E1E' : '#F8FAFC', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
                    <View style={styles.codeHeader}>
                      <View style={styles.codeIndicatorRow}><View style={[styles.codeDot, { backgroundColor: '#FF5F56' }]} /><View style={[styles.codeDot, { backgroundColor: '#FFBD2E' }]} /><View style={[styles.codeDot, { backgroundColor: '#27C93F' }]} /></View>
                      <ThemedText style={styles.codeLabel}>ACADEMIC SNIPPET</ThemedText>
                    </View>
                    <ThemedText style={styles.codeText}>{rawCode}</ThemedText>
                  </View>
                );
              } else if (part.startsWith('|')) {
                const rows = part.trim().split('\n');
                blockComponent = (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
                    <View style={styles.tableContainer}>
                      {rows.map((row, rIdx) => (
                        <View key={rIdx} style={[styles.tableRow, rIdx === 0 && { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                          {row.split('|').filter(c => c.trim() !== '').map((cell, cIdx) => (
                            <View key={cIdx} style={styles.tableCell}><ThemedText style={styles.cellText}>{cell.trim()}</ThemedText></View>
                          ))}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                );
              } else if (part.startsWith('$$')) {
                const equation = part.replace(/\$\$/g, '').trim();
                blockComponent = (
                  <View style={styles.mathDisplay}>
                    <Katex expression={equation} style={{ height: 80, width: width - 80 }} />
                  </View>
                );
              } else if (part.startsWith('[')) {
                const token = part.slice(1, -1);
                blockComponent = (
                  <View style={styles.sectionWrapper}>
                    <LinearGradient colors={[highlightColor, highlightColor + 'CC']} style={styles.sectionHeaderPremium}>
                      <ThemedText style={styles.sectionTabTextPremium}>{token}</ThemedText>
                    </LinearGradient>
                  </View>
                );
              }

              if (blockComponent) {
                rendered.push(
                  <Animated.View key={`block-${index}`} entering={FadeInUp.duration(400)}>
                    {blockComponent}
                  </Animated.View>
                );
              }
            } else {
              // 🖋️ Inline Elements
              let content: any = null;
              if (part === '\n') {
                content = <ThemedText key={index}>{"\n"}</ThemedText>;
              } else if (part.startsWith('**') || (part.startsWith('<b>') && part.endsWith('</b>'))) {
                const inner = part.startsWith('**') ? part.replace(/\*\*/g, '') : part.replace(/<\/?b>/g, '');
                content = <ThemedText key={index} style={[styles.boldText, { fontSize, color: highlightColor }]}>{inner}</ThemedText>;
              } else if (part.startsWith('<section>') && part.endsWith('</section>')) {
                const inner = part.replace(/<\/?section>/g, '');
                pushInlineGroup(`section-${index}`);
                rendered.push(
                  <View key={index} style={styles.sectionWrapper}>
                    <View style={[styles.sectionHeaderPremium, { borderLeftColor: highlightColor }]}>
                      <ThemedText style={[styles.sectionTabTextPremium, { color: highlightColor }]}>{inner}</ThemedText>
                    </View>
                  </View>
                );
                return;
              } else if (part.startsWith('<p>') && part.endsWith('</p>')) {
                const inner = part.replace(/<\/?p>/g, '');
                content = <ThemedText key={index} style={[styles.textContent, { fontSize, color: textColor }]}>{inner}</ThemedText>;
              } else if (part.startsWith('[HIGHLIGHT]')) {
                content = <ThemedText key={index} style={[styles.highlightText, { fontSize, backgroundColor: highlightColor + '20', color: textColor, borderRadius: 4 }]}>{part.replace(/\[\/?HIGHLIGHT\]/g, '')}</ThemedText>;
              } else if (part.startsWith('$')) {
                content = <View key={index} style={styles.inlineMathWrapper}><Katex expression={part.replace(/\$/g, '')} style={{ height: fontSize * 1.8, width: 80 }} /></View>;
              } else {
                content = <ThemedText key={index} style={[styles.textContent, { fontSize, color: textColor }]}>{part}</ThemedText>;
              }
              currentInlineGroup.push(content);
            }
          });
          pushInlineGroup('final');
          return rendered;
        })()}
      </View>
    </View>
  );
};

// 🏛️ STYLE DEFINITIONS (Rule: Organized & Clean CSS-in-JS)
const styles = StyleSheet.create({
  mainWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.1)', // ✅ Fixed Shadow
    elevation: 6
  },
  container: { padding: SPACING.sm, gap: 10 },

  // Typography & Bullets
  textFlowWrapper: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 6, marginVertical: 5 },
  textContent: { lineHeight: 17, opacity: 1, fontWeight: '500' },
  boldText: { fontWeight: '900', letterSpacing: -0.2 },

  // Code Block
  codeBlock: { padding: SPACING.sm, borderRadius: 24, marginVertical: SPACING.sm, borderWidth: 1.5 },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  codeIndicatorRow: { flexDirection: 'row', gap: 6 },
  codeDot: { width: 8, height: 8, borderRadius: 4 },
  codeLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, opacity: 0.5 },
  codeText: { fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },

  // Table
  tableScroll: { marginVertical: SPACING.sm },
  tableContainer: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  tableCell: { padding: 14, minWidth: 110, justifyContent: 'center' },
  cellText: { fontSize: 13, fontWeight: '600' },
  headerCellText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

  // Math
  mathDisplay: { width: '100%', padding: 20, marginVertical: 15, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  inlineMathWrapper: { height: 26, justifyContent: 'center', marginHorizontal: 2 },

  // Highlight
  highlightBox: { padding: 22, borderRadius: 24, borderLeftWidth: 6, marginVertical: 15, elevation: 2 },
  fluidHighlight: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, borderLeftWidth: 3, marginVertical: 4 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  insightLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  highlightText: { fontWeight: '800', lineHeight: 24 },

  // Task
  taskBox: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, gap: 12, marginVertical: 8 },
  taskIconBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(59,130,246,0.15)', justifyContent: 'center', alignItems: 'center' },
  taskText: { fontWeight: '700', flex: 1 },

  // Step
  stepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 15, paddingLeft: 16, position: 'relative' },
  stepIndicator: { width: 10, height: 10, borderRadius: 5, boxShadow: '0px 0px 10px #10B981' },
  stepLine: { width: 4, height: 24, borderRadius: 2, position: 'absolute', left: 0, top: 4 },
  diagramContainer: { padding: 22, borderRadius: 28, borderWidth: 2, borderStyle: 'dashed', marginVertical: 20, backgroundColor: 'rgba(108,99,255,0.02)' },
  diagramHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 15 },
  diagramLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 2.5 },
  diagramContent: { minHeight: 120, justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  diagramDataText: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', opacity: 0.7 },

  // 🏛️ PREMIUM SECTION HEADER SYSTEM
  sectionWrapper: { marginTop: 22, marginBottom: 4, width: '100%' },
  sectionHeaderPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent'
  },
  sectionTabTextPremium: { fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  sectionDivider: { height: 1, width: '100%', opacity: 0.1, marginTop: 4 }
});
