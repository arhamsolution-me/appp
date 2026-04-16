import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

/**
 * Global Error Boundary to gracefully catch React render crashes.
 * Prevents the entire application from whitescreening by rendering a fallback UI.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorStr: error.toString() };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a production app, ship these logs to Sentry, Crashlytics, etc.
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorStr: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="warning-outline" size={64} color="#EF4444" />
            <Text style={styles.title}>Oops! Something went wrong.</Text>
            <Text style={styles.subtitle}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>
            
            {/* Show the actual error message in dev/light debug mode */}
            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={3}>
                {this.state.errorStr}
              </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 24,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
