import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';

export default function SuccessScreen({ navigation }) {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
                    <Ionicons name="checkmark" size={60} color={colors.white} />
                </Animated.View>

                <Animated.View style={{ opacity, alignItems: 'center' }}>
                    <Text style={styles.title}>Great Job! 🎉</Text>
                    <Text style={styles.subtitle}>Your medications have been marked as taken. Your caretaker has been notified.</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>✓</Text>
                            <Text style={styles.statLabel}>On Time</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="heart" size={20} color={colors.redPrimary} />
                            <Text style={styles.statLabel}>Healthy</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="home" size={20} color={colors.white} />
                        <Text style={styles.btnText}>Back to Home</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    circle: {
        width: normalize(120),
        height: normalize(120),
        borderRadius: normalize(60),
        backgroundColor: colors.greenPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xxxl,
        ...shadows.lg,
    },
    title: {
        fontSize: normalize(28),
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    subtitle: {
        fontSize: fs.md,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xxxl,
        paddingHorizontal: spacing.xl,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginBottom: spacing.xxxl,
    },
    statCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.sm,
        minWidth: 100,
        ...shadows.sm,
    },
    statValue: {
        fontSize: fs.xl,
        fontWeight: '700',
        color: colors.greenPrimary,
    },
    statLabel: {
        fontSize: fs.sm,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    btn: {
        backgroundColor: colors.bluePrimary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxxl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        ...shadows.md,
    },
    btnText: {
        color: colors.white,
        fontSize: fs.lg,
        fontWeight: '700',
    },
});
