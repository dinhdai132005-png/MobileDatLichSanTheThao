// ============================================================
// APP ĐIỀU HƯỚNG - RECT NAVIGATION BOTTOM TABS & STACK (TypeScript)
// ============================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

import TrangChuScreen from '../screens/TrangChuScreen';
import DanhSachSanScreen from '../screens/DanhSachSanScreen';
import ChiTietSanScreen from '../screens/ChiTietSanScreen';
import DatLichScreen from '../screens/DatLichScreen';
import LichDatScreen from '../screens/LichDatScreen';
import ChiTietDonDatScreen from '../screens/ChiTietDonDatScreen';
import HoSoScreen from '../screens/HoSoScreen';
import { RootStackParamList } from '../types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const MAU_SAC = {
  chinh: '#00B884',
  nen: '#FFFFFF',
  chuMo: '#9CA3AF',
};

function LuongTrangChu() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrangChuMain" component={TrangChuScreen} />
      <Stack.Screen name="ChiTietSan" component={ChiTietSanScreen as any} />
      <Stack.Screen name="DatLich" component={DatLichScreen as any} />
      <Stack.Screen name="ChiTietDonDat" component={ChiTietDonDatScreen as any} />
    </Stack.Navigator>
  );
}

function LuongDanhSachSan() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DanhSachSanMain" component={DanhSachSanScreen} />
      <Stack.Screen name="ChiTietSan" component={ChiTietSanScreen as any} />
      <Stack.Screen name="DatLich" component={DatLichScreen as any} />
      <Stack.Screen name="ChiTietDonDat" component={ChiTietDonDatScreen as any} />
    </Stack.Navigator>
  );
}

function LuongLichDat() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LichDatMain" component={LichDatScreen as any} />
      <Stack.Screen name="ChiTietDonDat" component={ChiTietDonDatScreen as any} />
    </Stack.Navigator>
  );
}

function LuongHoSo() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HoSoMain" component={HoSoScreen as any} />
      <Stack.Screen name="ChiTietDonDat" component={ChiTietDonDatScreen as any} />
    </Stack.Navigator>
  );
}

import { AuthProvider, useAuth } from '../context/AuthContext';
import DangNhapScreen from '../screens/DangNhapScreen';

function DieuHuongGoc() {
  const { isAuthenticated, isLoadingSession } = useAuth();

  if (isLoadingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#00B884" />
      </View>
    );
  }

  // Khi chưa đăng nhập (hoặc sau khi đăng xuất) -> hiển thị màn hình Đăng Nhập
  if (!isAuthenticated) {
    return <DangNhapScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.thanhTab,
        tabBarActiveTintColor: MAU_SAC.chinh,
        tabBarInactiveTintColor: MAU_SAC.chuMo,
        tabBarLabelStyle: styles.nhanTab,
        tabBarIcon: ({ focused, color, size }) => {
          let bieuTuong: any;
          if (route.name === 'TrangChuTab') {
            bieuTuong = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DanhSachSanTab') {
            bieuTuong = focused ? 'location' : 'location-outline';
          } else if (route.name === 'LichDatTab') {
            bieuTuong = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'HoSoTab') {
            bieuTuong = focused ? 'person' : 'person-outline';
          }
          return (
            <View style={focused ? styles.tabKichHoat : null}>
              <Ionicons name={bieuTuong} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="TrangChuTab" component={LuongTrangChu} options={{ title: 'Trang Chủ' }} />
      <Tab.Screen name="DanhSachSanTab" component={LuongDanhSachSan} options={{ title: 'Sân Thể Thao' }} />
      <Tab.Screen name="LichDatTab" component={LuongLichDat} options={{ title: 'Lịch Đặt' }} />
      <Tab.Screen name="HoSoTab" component={LuongHoSo} options={{ title: 'Hồ Sơ' }} />
    </Tab.Navigator>
  );
}

export default function AppDieuHuong() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <DieuHuongGoc />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  thanhTab: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  nhanTab: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabKichHoat: {
    backgroundColor: 'rgba(0, 184, 132, 0.10)',
    borderRadius: 10,
    padding: 4,
  },
});
