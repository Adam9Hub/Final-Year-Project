import React from 'react';
import { View, Text, Modal as RNModal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize as fs } from '../theme';

export default function Modal({ isOpen, onClose, title, children }) {
    return (
        <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={8}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {children}
                    </ScrollView>
                </View>
            </View>
        </RNModal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        width: '100%',
        maxHeight: '80%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: fs.xl,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    body: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
});
