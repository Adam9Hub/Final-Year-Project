import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize as fs } from '../theme';

export default function RoleToggle({ value, onChange }) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.option, value === 'patient' && styles.optionActive]}
                onPress={() => onChange('patient')}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="person"
                    size={16}
                    color={value === 'patient' ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.label, value === 'patient' && styles.labelActive]}>Patient</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[styles.option, value === 'independent' && styles.optionActive]}
                onPress={() => onChange('independent')}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="shield-checkmark"
                    size={16}
                    color={value === 'independent' ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.label, value === 'independent' && styles.labelActive]}>Self</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.option, value === 'caretaker' && styles.optionActive]}
                onPress={() => onChange('caretaker')}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="heart"
                    size={16}
                    color={value === 'caretaker' ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.label, value === 'caretaker' && styles.labelActive]}>Caretaker</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.bgSecondary,
        borderRadius: borderRadius.md,
        padding: 3,
    },
    option: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.sm,
        gap: spacing.xs + 2,
    },
    optionActive: {
        backgroundColor: colors.bluePrimary,
        shadowColor: colors.bluePrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    label: {
        fontSize: fs.md,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    labelActive: {
        color: colors.white,
    },
});
