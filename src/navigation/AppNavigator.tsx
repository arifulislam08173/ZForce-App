import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthContext } from '../auth/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/tabs/HomeScreen';
import OrdersTabScreen from '../screens/tabs/OrdersTabScreen';
import AttendanceScreen from '../screens/tabs/AttendanceScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';
import MoreScreen from '../screens/tabs/MoreScreen';
import VisitsScreen from '../screens/more/VisitsScreen';
import RoutePlanScreen from '../screens/more/RoutePlanScreen';
import ExpenseScreen from '../screens/more/ExpenseScreen';
import CollectionScreen from '../screens/more/CollectionScreen';

import OrderNewScreen from '../screens/orders/OrderNewScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import FaceEnrollScreen from '../screens/FaceEnrollScreen';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  FaceEnroll: undefined;
  RoutePlan: undefined;
  Visits: { customerId?: string } | undefined;
  Expense: undefined;
  Collection: undefined;
  OrderNew: undefined;
  OrderDetails: { id: string };
};

export type TabParamList = {
  Home: undefined;
  Orders: { refresh?: string } | undefined;
  Attendance: undefined;
  Profile: undefined;
  More: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const baseHeight = Platform.OS === 'ios' ? 62 : 58;
  const extraBottom = 6;
  const barHeight = baseHeight + insets.bottom + extraBottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleStyle: { fontWeight: '900' },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: barHeight,
          paddingTop: 8,
          paddingBottom: insets.bottom + extraBottom,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.08)',
        },
        tabBarLabelStyle: { fontSize: 12, marginTop: 2, marginBottom: 2, lineHeight: 14 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: 'home-outline',
            Orders: 'cart-outline',
            Attendance: 'time-outline',
            Profile: 'person-outline',
            More: 'menu-outline',
          };
          return <Ionicons name={icons[route.name]} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Orders" component={OrdersTabScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Attendance' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token } = useContext(AuthContext);

  if (!token) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '900' } }}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="FaceEnroll" component={FaceEnrollScreen} options={{ title: 'Face Enroll' }} />
      <Stack.Screen name="RoutePlan" component={RoutePlanScreen} options={{ title: 'Route Plan' }} />
      <Stack.Screen name="Visits" component={VisitsScreen} options={{ title: 'Visits' }} />
      <Stack.Screen name="Expense" component={ExpenseScreen} options={{ title: 'Expense' }} />
      <Stack.Screen name="Collection" component={CollectionScreen} options={{ title: 'Collection' }} />
      <Stack.Screen name="OrderNew" component={OrderNewScreen} options={{ title: 'Create Order' }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order Details' }} />
    </Stack.Navigator>
  );
}