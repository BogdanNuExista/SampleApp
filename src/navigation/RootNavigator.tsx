import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { ArcadeScreen } from '../screens/ArcadeScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { palette } from '../theme/colors';

export type RootTabParamList = {
  Home: undefined;
  Arcade: undefined;
  Inventory: undefined;
  Flashcards: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

type TabIconConfig = {
  icon: string | ImageSourcePropType;
};

const tabIcons: Record<keyof RootTabParamList, TabIconConfig> = {
  Home: { icon: '🎯' },
  Arcade: { icon: '🕹️' },
  Inventory: { icon: require('../../assets/icon_pack/128/backpack.png') },
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

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
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
          name="Inventory"
          component={InventoryScreen}
          options={{ title: 'Inventory' }}
        />
        <Tab.Screen
          name="Flashcards"
          component={FlashcardsScreen}
          options={{ title: 'Journal' }}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      </Tab.Navigator>
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
