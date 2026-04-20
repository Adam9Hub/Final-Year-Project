import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize as fs } from '../theme';

function ToastItem({ toast }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
            ]).start();
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const bgColor = toast.type === 'error' ? colors.redLight
        : toast.type === 'info' ? colors.blueLight
        : toast.type === 'alert' ? colors.orangeLight
        : colors.greenLight;

    const iconColor = toast.type === 'error' ? colors.redPrimary
        : toast.type === 'info' ? colors.bluePrimary
        : toast.type === 'alert' ? colors.orangePrimary
        : colors.greenPrimary;

    const iconName = toast.type === 'error' ? 'close-circle'
        : toast.type === 'info' ? 'information-circle'
        : toast.type === 'alert' ? 'warning'
        : 'checkmark-circle';

    return (
        <Animated.View style={[styles.toast, { backgroundColor: bgColor, opacity, transform: [{ translateY }] }]}>
            <Ionicons name={iconName} size={20} color={iconColor} />
            <Text style={[styles.toastText, { color: iconColor }]}>{toast.message}</Text>
        </Animated.View>
    );
}

export default function ToastContainer({ toasts }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: spacing.lg,
        right: spacing.lg,
        zIndex: 9999,
        alignItems: 'center',
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        gap: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    toastText: {
        fontSize: fs.md,
        fontWeight: '600',
        flex: 1,
    },
});
