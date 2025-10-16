import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/colors';

export type EmptyStateProps = {
  title: string;
  subtitle: string;
  icon: ImageSourcePropType;
};

export function EmptyState({ title, subtitle, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Image source={icon} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  icon: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    opacity: 0.75,
  },
  title: {
    color: palette.softWhite,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: palette.silver,
    textAlign: 'center',
  },
});
