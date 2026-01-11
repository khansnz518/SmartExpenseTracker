import React from 'react';
import { StatusBar, View, Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store/store'; // Ensure this path is correct
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';

const App = () => {
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PaperProvider theme={theme}>
          <StatusBar 
            barStyle="light-content" 
            backgroundColor={theme.colors.primary} 
          />
          <AppNavigator />
        </PaperProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
};

export default App;