import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1000 });

    const initApp = async () => {
      // Wait for animation + checks
      const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
      
      // 1. Check Onboarding Status
      const onboardingCheck = AsyncStorage.getItem('hasOnboarded');

      // 2. Check SMS Permission Status (Android Only)
      let permissionCheck = Promise.resolve(false);
      if (Platform.OS === 'android') {
        permissionCheck = PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      } else {
        permissionCheck = Promise.resolve(true); // iOS skips this
      }

      // Execute logic
      const [_, hasOnboarded, hasPermission] = await Promise.all([
        minDelay, 
        onboardingCheck, 
        permissionCheck
      ]);

      // 3. Routing Logic
      if (hasOnboarded !== 'true') {
        // New User -> Onboarding
        navigation.replace('Onboarding');
      } else if (!hasPermission) {
        // User onboarded, but no permission -> Ask Permission
        navigation.replace('SmsPermission');
      } else {
        // User onboarded AND permission granted -> Dashboard
        navigation.replace('Dashboard');
      }
    };

    initApp();
  }, [navigation, opacity]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.logoContainer}>
            <Text variant="displayLarge" style={{ color: theme.colors.onPrimary }}>₹</Text>
        </View>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onPrimary }]}>
          Smart Expense Tracker
        </Text>
        <ActivityIndicator animating={true} color={theme.colors.secondary} size="large" style={styles.loader} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  logoContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: { fontWeight: 'bold', marginBottom: 30 },
  loader: { marginTop: 20 },
});

export default SplashScreen;