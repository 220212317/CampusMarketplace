import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export default function CategoryChip({ label, selected = false, onPress }: CategoryChipProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]} onPress={onPress}>
      <Text style={[styles.chipText, { color: selected ? '#ffffff' : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 25, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 14, fontWeight: '500' },
});
