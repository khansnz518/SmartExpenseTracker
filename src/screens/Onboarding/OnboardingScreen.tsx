import React, { useState, useRef } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { Text, Button, useTheme, IconButton, TextInput } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate, 
  withSpring 
} from 'react-native-reanimated';
import { RootStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setUserName } from '../../store/expenseSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Create Animated FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const slides = [
  {
    id: '1',
    title: 'Automatic Tracking',
    description: 'We read your bank SMS to automatically track your daily expenses without manual entry.',
    icon: 'message-processing-outline',
    isInput: false
  },
  {
    id: '2',
    title: 'Smart Insights',
    description: 'Get detailed reports and category-wise breakdown of where your money is going.',
    icon: 'chart-pie',
    isInput: false
  },
  {
    id: '3',
    title: 'Secure & Private',
    description: 'Your data stays on your device. We prioritize your privacy and security.',
    icon: 'shield-check-outline',
    isInput: false
  },
  {
    id: '4',
    title: "Let's Get Started",
    description: "What should we call you?",
    icon: 'account-edit',
    isInput: true 
  }
];

// --- Sub-Component: Paginator Dot ---
const PaginatorDot = ({ index, scrollX, theme }: { index: number, scrollX: Animated.SharedValue<number>, theme: any }) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    // Input Range: Previous Slide, Current Slide, Next Slide
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [10, 30, 10], // Grow to 30px when active
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3], // Fade out inactive dots
      Extrapolate.CLAMP
    );

    return {
      width: dotWidth,
      opacity: opacity,
    };
  });

  return (
    <Animated.View 
      style={[
        styles.dot, 
        { backgroundColor: theme.colors.primary }, 
        animatedDotStyle
      ]} 
    />
  );
};

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [name, setName] = useState('');
  
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  // Reanimated Scroll Handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Native Scroll Listener to update React State (for Next button logic)
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Final Step
      if (name.trim().length === 0) {
        Alert.alert("Required", "Please enter your name to continue.");
        return;
      }

      // Save Data
      await AsyncStorage.setItem('userName', name);
      dispatch(setUserName(name));
      
      try {
        await AsyncStorage.setItem('hasOnboarded', 'true');
        navigation.replace('SmsPermission');
      } catch (e) {
        console.error('Failed to save status', e);
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.slide, { width }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardContainer}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <IconButton icon={item.icon} iconColor={theme.colors.primary} size={60} />
        </View>
        
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
          {item.title}
        </Text>
        
        {item.isInput ? (
            <View style={{ width: '80%' }}>
                <TextInput
                    mode="outlined"
                    label="Your Name"
                    value={name}
                    onChangeText={setName}
                    style={{ backgroundColor: '#fff', marginBottom: 10 }}
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                />
                <Text style={{ textAlign: 'center', color: '#666', fontSize: 12 }}>
                    We use this to personalize your experience.
                </Text>
            </View>
        ) : (
            <Text variant="bodyLarge" style={styles.description}>
              {item.description}
            </Text>
        )}
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedFlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item: any) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // KEY: Ensures layout calculation is perfect
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={styles.footer}>
        {/* Reanimated Paginator */}
        <View style={styles.paginatorContainer}>
          {slides.map((_, index) => (
            <PaginatorDot key={index.toString()} index={index} scrollX={scrollX} theme={theme} />
          ))}
        </View>

        <Button 
          mode="contained" 
          onPress={handleNext} 
          style={[styles.button,{bottom: insets.bottom }]}
          contentStyle={{ height: 50 }}
        >
          {currentIndex === slides.length - 1 ? "Start Tracking" : "Next"}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  keyboardContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center', marginBottom: 32,
  },
  title: { fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  description: { textAlign: 'center', color: '#666', paddingHorizontal: 16 },
  
  footer: { 
    height: 150, 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    paddingBottom: 40 
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: { borderRadius: 25 },
});

export default OnboardingScreen;