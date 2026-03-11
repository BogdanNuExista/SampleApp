import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { ArcadeScreen } from '../screens/ArcadeScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { LearningHubScreen } from '../screens/LearningHubScreen';
import { ExerciseListScreen } from '../screens/ExerciseListScreen';
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen';
import { LearningSubject } from '../context/GameContext';
import { palette } from '../theme/colors';

export type RootTabParamList = {
  Home: undefined;
  Arcade: undefined;
  Learning: undefined;
  Flashcards: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Achievements: undefined;
  Statistics: undefined;
  Inventory: undefined;
  ExerciseList: { subject: LearningSubject };
  ExerciseDetail: { subject: LearningSubject; exerciseId: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type TabIconConfig = {
  icon: string | ImageSourcePropType;
};

const tabIcons: Record<keyof RootTabParamList, TabIconConfig> = {
  Home: { icon: '🎯' },
  Arcade: { icon: '🕹️' },
  Learning: { icon: '📚' },
  Flashcards: { icon: '📓' },
  Profile: { icon: '👤' },
};

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.midnight,
    card: '#101631',
    text: palette.softWhite,
    primary: palette.neonPink,
    border: '#1f2937',
    notification: palette.neonYellow,
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: '#0f142b',
            borderTopColor: '#1f2937',
          },
          tabBarActiveTintColor: palette.neonPink,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarIcon: ({ color }) => {
            const config = tabIcons[route.name as keyof RootTabParamList];
            const icon = config.icon;
            return (
              <View style={styles.iconWrapper}>
                {typeof icon === 'string' ? (
                  <Text style={[styles.iconText, { color }]}>{icon}</Text>
                ) : (
                  <Image source={icon} style={[styles.iconImage, { tintColor: color }]} />
                )}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Focus' }} />
        <Tab.Screen name="Arcade" component={ArcadeScreen} options={{ title: 'Arcade' }} />
        <Tab.Screen
          name="Learning"
          component={LearningHubScreen}
          options={{ title: 'Learn', headerShown: true, headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: palette.neonYellow }}
        />
        <Tab.Screen
          name="Flashcards"
          component={FlashcardsScreen}
          options={{ title: 'Journal' }}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen 
          name="Achievements" 
          component={AchievementsScreen} 
          options={{ 
            headerShown: true,
            title: 'Achievements',
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: palette.neonYellow,
          }} 
        />
        <Stack.Screen 
          name="Statistics" 
          component={StatisticsScreen} 
          options={{ 
            headerShown: true,
            title: 'Statistics',
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: palette.neonYellow,
          }} 
        />
        <Stack.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{
            headerShown: true,
            title: 'Inventory',
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: palette.neonYellow,
          }}
        />
        <Stack.Screen
          name="ExerciseList"
          component={ExerciseListScreen}
          options={({ route }) => ({
            headerShown: true,
            title: route.params.subject.charAt(0).toUpperCase() + route.params.subject.slice(1),
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: palette.neonYellow,
          })}
        />
        <Stack.Screen
          name="ExerciseDetail"
          component={ExerciseDetailScreen}
          options={({ route }) => ({
            headerShown: true,
            title: `Exercise ${route.params.exerciseId}`,
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: palette.neonYellow,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121831',
  },
  iconText: {
    fontSize: 18,
  },
  iconImage: {
    width: 22,
    height: 22,
  },
});
