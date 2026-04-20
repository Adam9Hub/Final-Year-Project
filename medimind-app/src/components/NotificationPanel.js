import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing, fontSize as fs } from '../theme';

export default function NotificationPanel({ isOpen, onClose }) {
    const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useApp();

    if (!isOpen) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'alert': return { name: 'warning', color: colors.orangePrimary };
            case 'success': return { name: 'checkmark-circle', color: colors.greenPrimary };
            case 'info': return { name: 'information-circle', color: colors.bluePrimary };
            default: return { name: 'notifications', color: colors.textSecondary };
        }
    };

    const renderItem = ({ item }) => {
        const icon = getIcon(item.type);
        return (
            <TouchableOpacity
                style={[styles.notifItem, !item.read && styles.notifUnread]}
                onPress={() => markNotificationRead(item.id)}
                activeOpacity={0.7}
            >
                <Ionicons name={icon.name} size={24} color={icon.color} />
                <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                </View>
                {!item.read && <View style={styles.dot} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.overlay}>
            <View style={styles.panel}>
                <View style={styles.header}>
                    <Text style={styles.title}>Notifications</Text>
                    <TouchableOpacity onPress={onClose} hitSlop={8}>
                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={markAllNotificationsRead}>
                        <Text style={styles.actionText}>Mark all read</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={clearNotifications}>
                        <Text style={[styles.actionText, { color: colors.redPrimary }]}>Clear all</Text>
                    </TouchableOpacity>
                </View>

                {notifications.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderItem}
                        keyExtractor={item => String(item.id)}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 100,
    },
    panel: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '85%',
        backgroundColor: colors.white,
        paddingTop: 60,
        paddingHorizontal: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: fs.xl,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    actionText: {
        fontSize: fs.sm,
        fontWeight: '600',
        color: colors.bluePrimary,
    },
    notifItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        gap: spacing.md,
        backgroundColor: colors.bgPrimary,
    },
    notifUnread: {
        backgroundColor: colors.blueLight,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: fs.md,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    notifBody: {
        fontSize: fs.sm,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    notifTime: {
        fontSize: fs.xs,
        color: colors.textMuted,
        marginTop: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.bluePrimary,
        marginTop: 6,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        fontSize: fs.md,
        color: colors.textMuted,
        marginTop: spacing.md,
    },
});
