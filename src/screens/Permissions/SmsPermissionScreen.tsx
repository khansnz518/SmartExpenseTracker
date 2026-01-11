import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform, PermissionsAndroid, Linking, AppState, AppStateStatus } from 'react-native';
import { Text, Button, useTheme, Card, Avatar } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SmsPermission'>;
};

const SmsPermissionScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const appState = useRef(AppState.currentState);
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied' | 'blocked'>('idle');

  useEffect(() => {
    // 1. Check immediately on load
    checkStatus();

    // 2. Add Listener for when user comes back from Settings
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // User just came back to the app (possibly from Settings)
      console.log('App has come to the foreground - checking permissions again');
      checkStatus();
    }
    appState.current = nextAppState;
  };

  const checkStatus = async () => {
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
        if (hasPermission) {
          setStatus('granted');
          // Smooth navigation delay
          setTimeout(() => {
             navigation.replace('Dashboard');
          }, 500);
        } else {
            // Only set to denied if we are currently 'granted' or 'idle'
            // We don't want to override 'blocked' unless permission is actually granted
            if (status !== 'blocked') {
                setStatus('denied');
            }
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      // Non-Android logic
      navigation.replace('Dashboard');
    }
  };

  const requestPermission = async () => {
    if (Platform.OS !== 'android') return;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Access Required",
          message: "This app needs access to your SMS to parse bank transactions automatically.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setStatus('granted');
        setTimeout(() => navigation.replace('Dashboard'), 500);
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        setStatus('blocked');
      } else {
        setStatus('denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Avatar.Icon 
            size={80} 
            icon={status === 'granted' ? "check" : "message-alert"} 
            style={{ 
                backgroundColor: status === 'granted' ? theme.colors.primary : 
                                 status === 'blocked' ? theme.colors.errorContainer :
                                 theme.colors.secondaryContainer 
            }}
            color={status === 'granted' ? 'white' : 
                   status === 'blocked' ? theme.colors.error : 
                   theme.colors.onSecondaryContainer}
          />
          
          <Text variant="headlineSmall" style={styles.title}>
            Permission Required
          </Text>
          
          <Text variant="bodyMedium" style={styles.description}>
            To track expenses automatically, we need to read your bank SMS messages.
          </Text>

          <View style={styles.statusContainer}>
             <Text variant="labelLarge" style={{ color: theme.colors.outline }}>
                 Status: {status === 'blocked' ? 'ACTION REQUIRED' : status.toUpperCase()}
             </Text>
          </View>

          {status === 'blocked' ? (
            <View style={{ width: '100%' }}>
                <Text style={{ textAlign: 'center', marginBottom: 10, color: theme.colors.error }}>
                    Permission is permanently blocked. Please enable it manually in settings.
                </Text>
                <Button mode="contained" onPress={openSettings} style={styles.button}>
                  Open Settings
                </Button>
                {/* Add a manual re-check button just in case AppState fails */}
                <Button mode="outlined" onPress={checkStatus} style={[styles.button, { marginTop: 10 }]}>
                  I have enabled it
                </Button>
            </View>
          ) : (
            <Button 
              mode="contained" 
              onPress={requestPermission}
              style={styles.button}
              disabled={status === 'granted'}
            >
              {status === 'granted' ? 'Access Granted' : 'Allow SMS Access'}
            </Button>
          )}

          <Button 
            mode="text" 
            onPress={() => navigation.replace('Dashboard')}
            style={{ marginTop: 10 }}
          >
            Skip for now
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  card: { paddingVertical: 20, borderRadius: 16 },
  content: { alignItems: 'center' },
  title: { marginTop: 24, fontWeight: 'bold', textAlign: 'center' },
  description: { marginTop: 16, textAlign: 'center', color: '#555', lineHeight: 22 },
  statusContainer: { marginVertical: 20, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  button: { width: '100%', borderRadius: 8 },
});

export default SmsPermissionScreen;