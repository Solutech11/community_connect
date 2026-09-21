import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect, useRef } from "react";
import {
  Animated as RNAnimated,
  Platform,
  StyleSheet,
  Text,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import HomeScreen from "../pages/dashboard/home-connected";
import CommunityScreen from "../pages/tabs/community-connected";
import ChatScreen from "../pages/tabs/chat-connected";
import ProfileScreen from "../pages/tabs/profile";
import DashboardLayout from "../Layouts/dashboard-layout";
import { colors, fonts } from "../styles/theme";

type MainTabParamList = {
  HomeTab: undefined;
  Community: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabMeta = {
  HomeTab: { label: "Home", icon: "home" },
  Community: { label: "Community", icon: "people" },
  Chat: { label: "Chat", icon: "chatbox" },
  Profile: { label: "Profile", icon: "person" },
} satisfies Record<
  keyof MainTabParamList,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
>;

function TabIcon({
  focused,
  routeName,
}: {
  focused: boolean;
  routeName: keyof MainTabParamList;
}) {
  const meta = tabMeta[routeName];
  const progress = useSharedValue(focused ? 1 : 0);

  progress.value = withSpring(focused ? 1 : 0, {
    damping: 16,
    stiffness: 180,
    mass: 0.8,
  });

  const activeWrapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -4]) },
      { scale: interpolate(progress.value, [0, 1], [0.94, 1]) },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.1]) }],
  }));

  if (focused) {
    return (
      <Animated.View style={[styles.activeIconWrap, activeWrapStyle]}>
        <Animated.View style={iconStyle}>
          <Ionicons name={meta.icon} size={24} color={colors.lime} />
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={iconStyle}>
      <Ionicons name={meta.icon} size={24} color="#4a9768" />
    </Animated.View>
  );
}

function DashboardHome() {
  return (
    <DashboardLayout>
      <HomeScreen />
    </DashboardLayout>
  );
}

function DashboardCommunity() {
  return (
    <DashboardLayout>
      <CommunityScreen />
    </DashboardLayout>
  );
}

function DashboardChat() {
  return (
    <DashboardLayout>
      <ChatScreen />
    </DashboardLayout>
  );
}

function AnimatedTabBarBackground() {
  const translateY = useRef(new RNAnimated.Value(24)).current;
  const opacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(translateY, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <RNAnimated.View
      pointerEvents="none"
      style={[
        styles.tabBarBackground,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: "#4a9768",
        tabBarLabel: ({ focused, color }) => (
          <Text
            style={[
              styles.tabLabel,
              focused && styles.tabLabelActive,
              { color },
            ]}
          >
            {tabMeta[route.name].label}
          </Text>
        ),
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} routeName={route.name} />
        ),
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <AnimatedTabBarBackground />,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="HomeTab" component={DashboardHome} />
      <Tab.Screen name="Community" component={DashboardCommunity} />
      <Tab.Screen name="Chat" component={DashboardChat} />
      <Tab.Screen
        name="Profile"
        component={() => (
          <DashboardLayout>
            <ProfileScreen />
          </DashboardLayout>
        )}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "transparent",
    borderTopColor: "transparent",
    borderTopWidth: 0,
    elevation: Platform.OS === "android" ? 12 : 0,
    height: Platform.OS === "android" ? 76 : 92,
    left: 0,
    paddingBottom: Platform.OS === "android" ? 6 : 12,
    paddingTop: 8,
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#86b998",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: Platform.OS === "android" ? 12 : 0,
  },
  tabItem: {
    gap: 4,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  tabLabelActive: {
    fontFamily: fonts.extraBold,
  },
  activeIconWrap: {
    alignItems: "center",
    backgroundColor: "#e8fff0",
    borderRadius: 22,
    height: 46,
    justifyContent: "center",
    shadowColor: "#6bdd92",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    width: 58,
  },
});
