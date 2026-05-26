import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../styles/theme';
import HomeScreen from '../pages/dashboard/home';
import PendingScreen from '../pages/tabs/pending-screen';

type MainTabParamList = {
  HomeTab: undefined;
  Community: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabMeta = {
  HomeTab: { label: 'Home', icon: 'home' },
  Community: { label: 'Community', icon: 'people' },
  Chat: { label: 'Chat', icon: 'chatbox' },
  Profile: { label: 'Profile', icon: 'person' },
} satisfies Record<keyof MainTabParamList, { label: string; icon: keyof typeof Ionicons.glyphMap }>;

function TabIcon({
  focused,
  routeName,
}: {
  focused: boolean;
  routeName: keyof MainTabParamList;
}) {
  const meta = tabMeta[routeName];

  if (focused) {
    return (
      <View style={styles.activeIconWrap}>
        <Ionicons name={meta.icon} size={24} color={colors.lime} />
      </View>
    );
  }

  return <Ionicons name={meta.icon} size={25} color="#4a9768" />;
}

function PendingCommunity() {
  return <PendingScreen title="Community" />;
}

function PendingChat() {
  return <PendingScreen title="Chat" />;
}

function PendingProfile() {
  return <PendingScreen title="Profile" />;
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: '#4a9768',
        tabBarLabel: ({ focused, color }) => (
          <Text style={[styles.tabLabel, focused && styles.tabLabelActive, { color }]}>
            {tabMeta[route.name].label}
          </Text>
        ),
        tabBarIcon: ({ focused }) => <TabIcon focused={focused} routeName={route.name} />,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="Community" component={PendingCommunity} />
      <Tab.Screen name="Chat" component={PendingChat} />
      <Tab.Screen name="Profile" component={PendingProfile} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: '#edf3f4',
    borderTopWidth: 1,
    elevation: 0,
    height: 91,
    paddingBottom: 14,
    paddingTop: 10,
    shadowColor: '#dce8e1',
    shadowOffset: { width: 0, height: -7 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
  },
  tabItem: {
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '800',
  },
  activeIconWrap: {
    alignItems: 'center',
    backgroundColor: '#dcffe8',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 57,
  },
});
