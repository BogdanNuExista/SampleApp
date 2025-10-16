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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937aa',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#38bdf833',
    flexShrink: 1,
    minWidth: 0,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: palette.silver,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    color: palette.softWhite,
    fontSize: 20,
    fontWeight: '700',
  },
});
