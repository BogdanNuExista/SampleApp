import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/colors';

export type StatBadgeProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  numberOfLines?: number;
};

export function StatBadge({ label, value, icon, numberOfLines = 1 }: StatBadgeProps) {
  return (
    <View style={styles.container}>
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={numberOfLines} ellipsizeMode="tail">
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#1f2937aa',
    padding: 16,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#38bdf833',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    width: '100%',
    gap: 4,
  },
  label: {
    color: palette.silver,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    color: palette.softWhite,
    fontSize: 22,
    fontWeight: '700',
  },
});
