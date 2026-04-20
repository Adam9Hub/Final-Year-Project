import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import PatientSwitcher from '../components/PatientSwitcher';
import { API_BASE_URL } from '../config';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';

export default function CaretakerReportsScreen({ navigation }) {
    const { monthlyAdherence, weeklyAdherence, medications, streak, user, selectedPatientName } = useApp();

    const pendingMeds = medications.length;

    const avg = monthlyAdherence.length > 0
        ? Math.round(monthlyAdherence.reduce((a, b) => a + b, 0) / monthlyAdherence.length)
        : 0;

    const maxVal = Math.max(...monthlyAdherence, 100);

    // Determine Health Status
    let statusText = "Excellent Adherence";
    let statusColor = colors.greenPrimary;
    let statusBg = colors.greenLight;
    let statusIcon = "star";
    
    if (avg < 70) {
        statusText = "Needs Attention";
        statusColor = colors.redPrimary;
        statusBg = colors.bgPrimary; // light red background isn't strictly defined, use primary bg or manual
        statusIcon = "warning";
    } else if (avg < 85) {
        statusText = "Good Standing";
        statusColor = colors.orangePrimary;
        statusBg = colors.orangeLight;
        statusIcon = "thumbs-up";
    }

    // Determine week stats
    const perfectDays = weeklyAdherence.filter(d => d.status === 'done').length;
    const missedDays = weeklyAdherence.filter(d => d.status === 'none').length;

    const handleContactPatient = async () => {
        const title = user?.role === 'independent' ? "Contact Doctor" : "Contact Patient";
        const msg = user?.role === 'independent' ? "Would you like to call or message your doctor?" : "Would you like to call or message your patient?";
        
        try {
            let url = `${API_BASE_URL}/api/users/${user?.id}/partner-phone`;
            if (user?.role === 'caretaker' && selectedPatientName) {
                url += `?target_patient=${encodeURIComponent(selectedPatientName)}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch phone number');
            const data = await res.json();
            
            if (!data.phone_number) {
                Alert.alert(
                    "No Phone Number",
                    `${user?.role === 'independent' ? 'Your doctor' : 'Your patient'} has not registered a phone number yet.`,
                    [{ text: "OK" }]
                );
                return;
            }

            Alert.alert(
                title,
                msg,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Message", onPress: () => Linking.openURL(`sms:${data.phone_number}`) },
                    { text: "Call", onPress: () => Linking.openURL(`tel:${data.phone_number}`) }
                ]
            );
        } catch (err) {
            console.error('Error fetching partner phone:', err);
            Alert.alert("Error", "Could not retrieve contact information.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
                    <Text style={styles.title}>Health Report</Text>
                    <View style={{ width: 24 }} />
                </View>

                <PatientSwitcher />

                {/* Health Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: statusBg || '#FCE8E8' }]}>
                    <View style={[styles.statusIconWrap, { backgroundColor: statusColor }]}>
                        <Ionicons name={statusIcon} size={24} color={colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.statusTitle, { color: statusColor }]} adjustsFontSizeToFit numberOfLines={1}>{statusText}</Text>
                        <Text style={styles.statusSub} adjustsFontSizeToFit numberOfLines={1}>Based on {avg}% monthly average</Text>
                    </View>
                </View>

                {/* Quick Insights */}
                <View style={styles.insightCard}>
                    <Text style={styles.cardTitle}>Quick Insights</Text>
                    <View style={styles.insightRow}>
                        <Ionicons name="flame" size={20} color={colors.orangePrimary} />
                        <Text style={styles.insightText}>
                            Currently on a <Text style={styles.boldText}>{streak}-day</Text> perfect streak.
                        </Text>
                    </View>
                    <View style={styles.insightRow}>
                        <Ionicons name="calendar-sharp" size={20} color={colors.bluePrimary} />
                        <Text style={styles.insightText}>
                            <Text style={styles.boldText}>{perfectDays} perfect days</Text> this week.
                        </Text>
                    </View>
                    {avg < 80 && (
                        <View style={styles.insightRow}>
                            <Ionicons name="alert-circle" size={20} color={colors.redPrimary} />
                            <Text style={[styles.insightText, { color: colors.redPrimary }]}>
                                Adherence has slipped below the 80% target goal.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Summary Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.bluePrimary }]} adjustsFontSizeToFit numberOfLines={1}>{avg}%</Text>
                        <Text style={styles.statLabel} adjustsFontSizeToFit numberOfLines={1}>Avg</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.greenPrimary }]} adjustsFontSizeToFit numberOfLines={1}>{streak}</Text>
                        <Text style={styles.statLabel} adjustsFontSizeToFit numberOfLines={1}>Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.purplePrimary }]} adjustsFontSizeToFit numberOfLines={1}>{pendingMeds}</Text>
                        <Text style={styles.statLabel} adjustsFontSizeToFit numberOfLines={1}>Meds</Text>
                    </View>
                </View>

                {/* Monthly Chart */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>30-Day Activity</Text>
                    
                    {/* Goal Line Indicator */}
                    <View style={styles.goalLineWrap}>
                        <Text style={styles.goalText}>80% Goal</Text>
                        <View style={styles.goalLine} />
                    </View>

                    <View style={styles.chartContainer}>
                        {monthlyAdherence.map((val, i) => (
                            <View key={i} style={styles.barCol}>
                                <View style={[
                                    styles.bar,
                                    {
                                        height: Math.max((val / 100) * 100, 4), // 100 max height
                                        backgroundColor: val >= 80 ? colors.greenPrimary : val >= 50 ? colors.orangePrimary : colors.redPrimary,
                                    }
                                ]} />
                            </View>
                        ))}
                    </View>
                    <View style={styles.chartLegend}>
                        <Text style={styles.legendText}>30 Days Ago</Text>
                        <Text style={styles.legendText}>Today</Text>
                    </View>
                </View>

                {/* Weekly Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>This Week's Timeline</Text>
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

                {/* Actionable Button if adherence is low */}
                {avg < 80 && (
                    <TouchableOpacity style={styles.contactBtn} onPress={handleContactPatient}>
                        <Ionicons name="chatbubbles" size={20} color={colors.white} />
                        <Text style={styles.contactBtnText}>
                            {user?.role === 'independent' ? 'Contact Doctor' : 'Check In With Patient'}
                        </Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    title: { fontSize: fs.xl, fontWeight: '700', color: colors.textPrimary },
    
    statusBanner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.lg, gap: spacing.md },
    statusIconWrap: { width: normalize(48), height: normalize(48), borderRadius: normalize(24), justifyContent: 'center', alignItems: 'center', ...shadows.sm },
    statusTitle: { fontSize: fs.lg, fontWeight: '800', marginBottom: 2 },
    statusSub: { fontSize: fs.sm, color: colors.textSecondary, fontWeight: '500' },

    insightCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.sm },
    insightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    insightText: { flex: 1, fontSize: fs.md, color: colors.textSecondary, lineHeight: 22 },
    boldText: { fontWeight: '700', color: colors.textPrimary },

    card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.sm },
    cardTitle: { fontSize: fs.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },

    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
    statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', minWidth: 80, ...shadows.sm },
    statValue: { fontSize: fs.xxl, fontWeight: '800' },
    statLabel: { fontSize: fs.xs, color: colors.textMuted, fontWeight: '600', marginTop: 4 },

    goalLineWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: -10, zIndex: 1 },
    goalText: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
    goalLine: { flex: 1, height: 1, backgroundColor: colors.border, borderStyle: 'dashed' },

    chartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: normalize(110), gap: 2, marginTop: spacing.md },
    barCol: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.bgPrimary, borderRadius: 2 },
    bar: { borderRadius: 2, minHeight: 4, width: '100%' },
    chartLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    legendText: { fontSize: fs.xs, color: colors.textMuted, fontWeight: '600' },

    weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCol: { alignItems: 'center', gap: spacing.sm },
    dayDot: { width: normalize(36), height: normalize(36), borderRadius: normalize(18), backgroundColor: colors.bgSecondary, justifyContent: 'center', alignItems: 'center' },
    dayDone: { backgroundColor: colors.greenPrimary },
    dayPartial: { backgroundColor: colors.orangePrimary },
    dayLabel: { fontSize: fs.sm, color: colors.textMuted, fontWeight: '700' },

    contactBtn: { backgroundColor: colors.bluePrimary, borderRadius: borderRadius.md, paddingVertical: spacing.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, ...shadows.md },
    contactBtnText: { color: colors.white, fontSize: fs.lg, fontWeight: '700' },
});
