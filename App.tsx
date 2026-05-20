import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import OnboardingScreen from './Screens/OnboardingScreen';

export type RootStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingDiscover: undefined;
  OnboardingRefresh: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

enableScreens();

function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#071f17',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text
        selectable
        style={{
          color: '#eafff1',
          fontSize: 28,
          fontWeight: '800',
          textAlign: 'center',
        }}
      >
        Community Connect
      </Text>
      <Text
        selectable
        style={{
          color: '#a7f7c6',
          fontSize: 16,
          lineHeight: 24,
          marginTop: 10,
          textAlign: 'center',
        }}
      >
        Your event experience starts here.
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="OnboardingWelcome"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: '#071f17' },
            }}
          >
            <Stack.Screen name="OnboardingWelcome">
              {(props) => (
                <OnboardingScreen
                  {...props}
                  activeIndex={0}
                  backgroundImage={require('./stitch_exports/create-event-step-1/onboarding-welcome-screen.png')}
                  eyebrow="Community starts here"
                  title="Find your people, join the moment"
                  body="Explore local experiences, meet active communities, and keep every event plan in one clear flow."
                  ctaLabel="Start exploring"
                  nextRoute="OnboardingDiscover"
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="OnboardingDiscover">
              {(props) => (
                <OnboardingScreen
                  {...props}
                  activeIndex={1}
                  backgroundImage={require('./stitch_exports/create-event-step-1/onboarding-slide-2-discover-events.png')}
                  eyebrow="Discover what is near"
                  title="Events that match your energy"
                  body="Browse workshops, hangouts, campus moments, and city gatherings with a visual-first experience."
                  ctaLabel="See how it works"
                  nextRoute="OnboardingRefresh"
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="OnboardingRefresh">
              {(props) => (
                <OnboardingScreen
                  {...props}
                  activeIndex={2}
                  backgroundImage={require('./stitch_exports/create-event-step-1/onboarding-slide-3-full-bleed-refresh.png')}
                  eyebrow="Refresh your calendar"
                  title="Plan better, move faster"
                  body="Save events, follow updates, and jump from discovery to attendance without losing the vibe."
                  ctaLabel="Get started"
                  nextRoute="Home"
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
