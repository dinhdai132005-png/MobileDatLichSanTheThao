// ============================================================
// APP ENTRY POINT (TypeScript)
// Polyfills: DOMRect, setImmediate (Hermes compatible)
// Error Boundary: Bắt lỗi Runtime hiển thị chi tiết UI
// ============================================================

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppDieuHuong from './src/navigation/AppDieuHuong';

// Polyfill cho setImmediate (cho Socket.io / Async operations trên Hermes)
if (typeof (globalThis as any).setImmediate === 'undefined') {
  (globalThis as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => setTimeout(fn, 0, ...args);
}

// Polyfill cho DOMRect (cho react-native-screens v4+ trên Hermes)
if (typeof (globalThis as any).DOMRect === 'undefined') {
  const DOMRectPolyfill = class DOMRect {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    bottom: number;
    right: number;

    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.top = y;
      this.left = x;
      this.bottom = y + height;
      this.right = x + width;
    }

    static fromRect(rect?: { x?: number; y?: number; width?: number; height?: number }) {
      return new DOMRect(rect?.x, rect?.y, rect?.width, rect?.height);
    }

    toJSON() {
      return {
        x: this.x, y: this.y,
        width: this.width, height: this.height,
        top: this.top, left: this.left,
        bottom: this.bottom, right: this.right,
      };
    }
  };
  (globalThis as any).DOMRect = DOMRectPolyfill;
}

// --- ERROR BOUNDARY COMPONENT ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('💥 [App ErrorBoundary Caught Error]:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.errorTitle}>Đã phát hiện sự cố Runtime</Text>
          <Text style={styles.errorSub}>Chi tiết thông tin lỗi giúp bạn khắc phục:</Text>
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>
              {this.state.error?.toString() || 'Lỗi không xác định'}
            </Text>
            {this.state.error?.stack && (
              <Text style={styles.stackText}>
                {this.state.error.stack.slice(0, 500)}
              </Text>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.btnRetry} onPress={this.handleReload}>
            <Text style={styles.btnRetryText}>Thử lại (Reload App)</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppErrorBoundary>
        <AppDieuHuong />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  errorBox: {
    width: '100%',
    maxHeight: 220,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 8,
  },
  stackText: {
    fontSize: 11,
    color: '#7F1D1D',
    fontFamily: 'monospace',
  },
  btnRetry: {
    backgroundColor: '#00B884',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnRetryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
