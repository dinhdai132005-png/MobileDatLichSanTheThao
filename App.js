// URL polyfill - fix lỗi "Cannot assign to property 'protocol' which has only a getter"
// Nguyên nhân: Hermes trong RN 0.86 thiếu URL setter, cần polyfill đầy đủ từ WHATWG
import 'react-native-url-polyfill/auto';

// Polyfill cho DOMRect - fix lỗi "Property 'DOMRect' doesn't exist" trên Hermes/Expo Go
// Nguyên nhân: react-native-screens v4+ dùng DOMRect (Web API) không có trong React Native
if (typeof global.DOMRect === 'undefined') {
  global.DOMRect = class DOMRect {
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
    static fromRect(rect) {
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
}

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppDieuHuong from './src/navigation/AppDieuHuong';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppDieuHuong />
    </SafeAreaProvider>
  );
}
