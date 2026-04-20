import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing, fontSize as fs } from '../theme';

export default function PatientSwitcher() {
    const { user, patientsList, selectedPatientName, setSelectedPatientName } = useApp();

    if (user?.role !== 'caretaker' || patientsList.length <= 1) return null;

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {patientsList.map((patientName, index) => {
                    const isSelected = selectedPatientName === patientName;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.pill, isSelected && styles.pillActive]}
                            onPress={() => setSelectedPatientName(patientName)}
                        >
                            <Text style={[styles.text, isSelected && styles.textActive]}>
                                {patientName}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    scroll: {
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
    },
    pill: {
        backgroundColor: colors.borderLight,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 20,
    },
    pillActive: {
        backgroundColor: colors.bluePrimary,
    },
    text: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: fs.sm,
    },
    textActive: {
        color: colors.white,
    }
});
