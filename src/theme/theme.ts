import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32', // Green
    onPrimary: '#FFFFFF',
    secondary: '#FFC107', // Amber/Yellow
    onSecondary: '#000000',
    background: '#F5F5F5', // Light Gray
    surface: '#FFFFFF',
    error: '#B00020',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F7F9F7',
      level3: '#F0F4F0',
      level4: '#EBEFEB',
      level5: '#E6EBE6',
    },
  },
  roundness: 12,
};

export type AppTheme = typeof theme;