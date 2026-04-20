import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';

export default function PatientScheduleScreen() {
    const { medications, schedule, weeklyAdherence } = useApp();

    const medColors = {
        blue: colors.bluePrimary,
        green: colors.greenPrimary,
        purple: colors.purplePrimary,
        orange: colors.orangePrimary,
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Schedule</Text>

                {/* Weekly Adherence */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>This Week</Text>
                    <View style={styles.weekRow}>
                        {weeklyAdherence.map((day, i) => (
                            <View key={i} style={styles.dayCol}>
                                <View style={[
                                    styles.dayDot,
                                    day.status === 'done' && styles.dayDone,
                                    day.status === 'partial' && styles.dayPartial,
                                ]}>
                                    {day.status === 'done' && <Ionicons name="checkmark" size={14} color={colors.white} />}
                                    {day.status === 'partial' && <Ionicons name="remove" size={14} color={colors.white} />}
                                </View>
                                <Text style={styles.dayLabel}>{day.day}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Schedule by time */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Today's Times</Text>
                    {Object.keys(schedule).length > 0 ? (
                        Object.entries(schedule).map(([timeKey, data]) => (
                            <View key={timeKey} style={styles.timeSlot}>
                                <View style={styles.timeHeader}>
                                    <View style={styles.timeBubble}>
                                        <Ionicons name="time-outline" size={16} color={colors.bluePrimary} />
                                        <Text style={styles.timeText}>{data.time}</Text>
                                    </View>
                                    <Text style={styles.periodLabel}>{data.label || timeKey}</Text>
                                    {data.taken ? (
                                        <View style={styles.takenBadge}>
                                            <Ionicons name="checkmark-circle" size={16} color={colors.greenPrimary} />
                                            <Text style={styles.takenText}>Taken{data.takenAt ? ` at ${data.takenAt}` : ''}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.pendingBadge}>
                                            <Text style={styles.pendingText}>Pending</Text>
                                        </View>
                                    )}
                                </View>
                                {data.medications && data.medications.length > 0 && (
                                    <View style={styles.medsList}>
                                        {data.medications.map(medId => {
                                            const med = medications.find(m => m.id === medId);
                                            if (!med) return null;
                                            return (
                                                <View key={medId} style={styles.medPill}>
                                                    <View style={[styles.medDot, { backgroundColor: medColors[med.color] || colors.bluePrimary }]} />
                                                    <Text style={styles.medPillText}>{med.name} {med.dosage}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        ))
                    ) : (
                        <View style={styles.empty}>
                            <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No scheduled medications</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    title: { fontSize: fs.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xl },
    card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.sm },
    cardTitle: { fontSize: fs.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCol: { alignItems: 'center', gap: spacing.xs },
    dayDot: { width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: colors.bgSecondary, justifyContent: 'center', alignItems: 'center' },
    dayDone: { backgroundColor: colors.greenPrimary },
    dayPartial: { backgroundColor: colors.orangePrimary },
    dayLabel: { fontSize: fs.xs, color: colors.textMuted, fontWeight: '600' },
    timeSlot: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    timeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    timeBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blueLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, gap: 4 },
    timeText: { fontSize: fs.sm, fontWeight: '600', color: colors.bluePrimary },
    periodLabel: { flex: 1, fontSize: fs.md, fontWeight: '600', color: colors.textPrimary },
    takenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    takenText: { fontSize: fs.xs, color: colors.greenPrimary, fontWeight: '600' },
    pendingBadge: { backgroundColor: colors.orangeLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
    pendingText: { fontSize: fs.xs, color: colors.orangePrimary, fontWeight: '600' },
    medsList: { marginTop: spacing.sm, gap: spacing.xs, paddingLeft: spacing.xxl },
    medPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    medDot: { width: 8, height: 8, borderRadius: 4 },
    medPillText: { fontSize: fs.sm, color: colors.textSecondary },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
    emptyText: { fontSize: fs.md, color: colors.textMuted },
});
