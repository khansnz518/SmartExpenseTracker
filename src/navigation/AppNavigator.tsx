import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { theme } from '../theme/theme';

// Screens
import SplashScreen from '../screens/Splash/SplashScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import SmsPermissionScreen from '../screens/Permissions/SmsPermissionScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import AddExpenseScreen from '../screens/AddExpense/AddExpenseScreen';
import TransactionHistoryScreen from '../screens/Transactions/TransactionHistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="SmsPermission" component={SmsPermissionScreen} />
        
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        
        <Stack.Screen 
            name="AddExpense" 
            component={AddExpenseScreen} 
            options={{ 
                headerShown: true, 
                title: '',
                headerTransparent: true 
            }}
        />
        
        <Stack.Screen 
            name="TransactionHistory" 
            component={TransactionHistoryScreen} 
            options={{ 
                headerShown: true, 
                title: 'History',
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: '#fff'
            }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;