import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize as fs } from '../theme';

export default function SettingRow({ icon, iconColor, label, subtitle, value, onValueChange, onPress, type = 'toggle', danger = false }) {
    const content = (
        <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: (iconColor || colors.bluePrimary) + '15' }]}>
                <Ionicons name={icon} size={20} color={iconColor || colors.bluePrimary} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.label, danger && { color: colors.redPrimary }]}>{label}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {type === 'toggle' && (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: colors.border, true: colors.bluePrimary + '60' }}
                    thumbColor={value ? colors.bluePrimary : colors.textMuted}
                />
            )}
            {type === 'arrow' && (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    label: {
        fontSize: fs.md,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: fs.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
});
