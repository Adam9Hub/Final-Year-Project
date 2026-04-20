import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import PatientSwitcher from '../components/PatientSwitcher';
import NotificationPanel from '../components/NotificationPanel';
import ToastContainer from '../components/Toast';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';

export default function CaretakerDashboardScreen({ navigation }) {
    const { user, medications, schedule, weeklyAdherence, monthlyAdherence, streak, unreadCount, toasts, selectedPatientName } = useApp();
    const [showNotifications, setShowNotifications] = useState(false);

    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    const totalSlots = Object.keys(schedule).length;
    const takenSlots = Object.values(schedule).filter(s => s.taken).length;
    const adherencePercent = totalSlots > 0 ? Math.round((takenSlots / totalSlots) * 100) : 0;

    return (
        <SafeAreaView style={styles.container}>
            <ToastContainer toasts={toasts} />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.date} adjustsFontSizeToFit numberOfLines={1}>{dayName}, {monthDay}</Text>
                        <Text style={styles.title} adjustsFontSizeToFit numberOfLines={1}>Dashboard</Text>
                    </View>
                    <TouchableOpacity style={styles.bell} onPress={() => setShowNotifications(true)}>
                        <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
                        {unreadCount > 0 && (
                            <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
                        )}
                    </TouchableOpacity>
                </View>

                <PatientSwitcher />

                {/* Patient Info */}
                <View style={[styles.card, { backgroundColor: colors.bluePrimary }]}>
                    <View style={styles.patientRow}>
                        <View style={styles.patientAvatar}>
                            <Ionicons name="person" size={24} color={colors.bluePrimary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.white, fontSize: fs.lg, fontWeight: '700' }} adjustsFontSizeToFit numberOfLines={1}>
                                {selectedPatientName || 'No patient linked'}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: fs.sm }} adjustsFontSizeToFit numberOfLines={2}>
                                {selectedPatientName ? 'Your patient' : 'Generate an invite code in Family tab'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.bluePrimary }]} adjustsFontSizeToFit numberOfLines={1}>{adherencePercent}%</Text>
                        <Text style={styles.statLabel} adjustsFontSizeToFit numberOfLines={1}>Today</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.greenPrimary }]} adjustsFontSizeToFit numberOfLines={1}>{streak}</Text>
                        <Text style={styles.statLabel} adjustsFontSizeToFit numberOfLines={1}>Day Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.purplePrimary }]} adjustsFontSizeToFit numberOfLines={1}>{medications.length}</Text>
                        <Text style={styles.statLabel} adjustsFontSizeToFit numberOfLines={1}>Active Meds</Text>
                    </View>
                </View>

                {/* Weekly */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Weekly Adherence</Text>
                    <View style={styles.weekRow}>
                        {weeklyAdherence.map((day, i) => (
                            <View key={i} style={styles.dayCol}>
                                <View style={[styles.dayDot, day.status === 'done' && styles.dayDone, day.status === 'partial' && styles.dayPartial]}>
                                    {day.status === 'done' && <Ionicons name="checkmark" size={14} color={colors.white} />}
                                    {day.status === 'partial' && <Ionicons name="remove" size={14} color={colors.white} />}
                                </View>
                                <Text style={styles.dayLabel}>{day.day}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Today's Schedule */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Today's Schedule</Text>
                    {Object.entries(schedule).map(([timeKey, data]) => (
                        <View key={timeKey} style={styles.schedRow}>
                            <Text style={styles.schedLabel}>{data.label || timeKey}</Text>
                            <Text style={styles.schedTime}>{data.time}</Text>
                            {data.taken ? (
                                <Ionicons name="checkmark-circle" size={20} color={colors.greenPrimary} />
                            ) : (
                                <View style={styles.pendingDot} />
                            )}
                        </View>
                    ))}
                </View>

                {/* Quick Actions */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Quick Actions</Text>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddMedication')} activeOpacity={0.7}>
                        <Ionicons name="add-circle" size={22} color={colors.bluePrimary} />
                        <Text style={styles.actionText}>Add Medication</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Reports')} activeOpacity={0.7}>
                        <Ionicons name="bar-chart" size={22} color={colors.purplePrimary} />
                        <Text style={styles.actionText}>View Reports</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
    date: { fontSize: fs.sm, color: colors.textMuted, marginBottom: 4 },
    title: { fontSize: fs.xxl, fontWeight: '800', color: colors.textPrimary },
    bell: { position: 'relative', padding: spacing.sm },
    badge: { position: 'absolute', top: 2, right: 2, backgroundColor: colors.redPrimary, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
    card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.sm },
    cardTitle: { fontSize: fs.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
    patientRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.lg },
    patientAvatar: { width: normalize(48), height: normalize(48), borderRadius: normalize(24), backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
    statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', minWidth: 80, ...shadows.sm },
    statValue: { fontSize: fs.xxl, fontWeight: '800' },
    statLabel: { fontSize: fs.xs, color: colors.textMuted, fontWeight: '600', marginTop: 4 },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
    dayCol: { alignItems: 'center', gap: spacing.xs },
    dayDot: { width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: colors.bgSecondary, justifyContent: 'center', alignItems: 'center' },
    dayDone: { backgroundColor: colors.greenPrimary },
    dayPartial: { backgroundColor: colors.orangePrimary },
    dayLabel: { fontSize: fs.xs, color: colors.textMuted, fontWeight: '600' },
    schedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    schedLabel: { flex: 1, fontSize: fs.md, fontWeight: '600', color: colors.textPrimary },
    schedTime: { fontSize: fs.sm, color: colors.textSecondary, marginRight: spacing.md },
    pendingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.orangeLight, borderWidth: 2, borderColor: colors.orangePrimary },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    actionText: { flex: 1, fontSize: fs.md, fontWeight: '600', color: colors.textPrimary },
});
