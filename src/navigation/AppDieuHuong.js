import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import TrangChuScreen from '../screens/TrangChuScreen';
import DanhSachSanScreen from '../screens/DanhSachSanScreen';
import ChiTietSanScreen from '../screens/ChiTietSanScreen';
import DatLichScreen from '../screens/DatLichScreen';
import HoSoScreen from '../screens/HoSoScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MAU_SAC = {
  chinh: '#00B884',
  nen: '#FFFFFF',
  chuMo: '#9CA3AF',
};

// Stack điều hướng từ Trang chủ tới Chi tiết sân và Đặt sân
function LuongTrangChu() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrangChuMain" component={TrangChuScreen} />
      <Stack.Screen name="ChiTietSan" component={ChiTietSanScreen} />
      <Stack.Screen name="DatLich" component={DatLichScreen} />
    </Stack.Navigator>
  );
}

// Stack điều hướng từ Danh sách sân tới Chi tiết sân và Đặt sân
function LuongDanhSachSan() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DanhSachSanMain" component={DanhSachSanScreen} />
      <Stack.Screen name="ChiTietSan" component={ChiTietSanScreen} />
      <Stack.Screen name="DatLich" component={DatLichScreen} />
    </Stack.Navigator>
  );
}

export default function AppDieuHuong() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.thanhTab,
          tabBarActiveTintColor: MAU_SAC.chinh,
          tabBarInactiveTintColor: MAU_SAC.chuMo,
          tabBarLabelStyle: styles.nhanTab,
          tabBarIcon: ({ focused, color, size }) => {
            let bieuTuong;
            if (route.name === 'TrangChuTab') {
              bieuTuong = focused ? 'home' : 'home-outline';
            } else if (route.name === 'DanhSachSanTab') {
              bieuTuong = focused ? 'location' : 'location-outline';
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
        <Tab.Screen name="HoSoTab" component={HoSoScreen} options={{ title: 'Hồ Sơ' }} />
      </Tab.Navigator>
    </NavigationContainer>
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
