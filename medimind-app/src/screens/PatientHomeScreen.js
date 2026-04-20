import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import NotificationPanel from '../components/NotificationPanel';
import Modal from '../components/Modal';
import ToastContainer from '../components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';

export default function PatientHomeScreen({ navigation }) {
    const { user, medications, schedule, submitMeds, postponeMedications, showToast, unreadCount, toasts } = useApp();
    const [showHelp, setShowHelp] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [checkedMeds, setCheckedMeds] = useState(new Set());
    const [showInviteCard, setShowInviteCard] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    // Check if already linked
    React.useEffect(() => {
        AsyncStorage.getItem(`medimind_linked_${user?.id}`).then(val => {
            if (val === 'true') setShowInviteCard(false);
        });
    }, [user?.id]);

    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    // Helper: parse a time string like "7:00 AM" into total minutes since midnight
    const parseTimeToMinutes = (tStr) => {
        if (!tStr || typeof tStr !== 'string') return 0;
        const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return 0;
        let [_, h, m, ampm] = match;
        h = parseInt(h);
        m = parseInt(m);
        if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    };

    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Build a set of medication IDs that are currently available (scheduled time has arrived)
    const availableMedIds = new Set();
    const medNextTime = {}; // medId -> earliest future time string
    Object.entries(schedule).forEach(([timeKey, data]) => {
        if (!data.medications) return;
        const schedMinutes = parseTimeToMinutes(data.time || timeKey);
        data.medications.forEach(medId => {
            if (schedMinutes <= nowMinutes) {
                availableMedIds.add(medId);
            } else if (!medNextTime[medId]) {
                medNextTime[medId] = data.time || timeKey;
            }
        });
    });

    const isMedAvailable = (medId) => availableMedIds.has(medId);

    const allTaken = Object.values(schedule).every((s) => s.taken);
    const availableMeds = medications.filter(m => isMedAvailable(m.id));
    const allMedsChecked = availableMeds.length > 0 && checkedMeds.size === availableMeds.length;

    const toggleMedCheck = (id) => {
        if (!isMedAvailable(id)) {
            showToast('This medication isn\'t available until its scheduled time', 'alert');
            return;
        }
        setCheckedMeds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleTookMeds = () => {
        if (checkedMeds.size === 0 && !allTaken) {
            showToast('Please check off at least one medication', 'alert');
            return;
        }
        submitMeds(checkedMeds);
        showToast(allMedsChecked || allTaken ? 'All meds marked as taken!' : 'Selected meds marked as taken!', 'success');
        navigation.navigate('Success');
    };

    const handleLater = () => {
        postponeMedications();
    };

    const handleJoinCaregiver = async () => {
        if (!joinCode || joinCode.length !== 6) {
            showToast('Please enter a valid 6-digit code', 'error');
            return;
        }
        setIsJoining(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/invites/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: joinCode,
                    patient_id: user.id,
                    patient_name: user.fullName || user.name
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Successfully linked to Caretaker!', 'success');
                await AsyncStorage.setItem(`medimind_linked_${user?.id}`, 'true');
                setShowInviteCard(false);
                setJoinCode('');
            } else {
                showToast(data.error || 'Failed to join', 'error');
            }
        } catch (err) {
            showToast('Server error while linking', 'error');
        } finally {
            setIsJoining(false);
        }
    };

    const handleDismissInvite = async () => {
        await AsyncStorage.setItem(`medimind_linked_${user?.id}`, 'true');
        setShowInviteCard(false);
    };

    const medColors = {
        blue: colors.bluePrimary,
        green: colors.greenPrimary,
        purple: colors.purplePrimary,
        orange: colors.orangePrimary,
    };

    return (
        <SafeAreaView style={styles.container}>
            <ToastContainer toasts={toasts} />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.date} adjustsFontSizeToFit numberOfLines={1}>{dayName}, {monthDay}</Text>
                        <Text style={styles.greeting} adjustsFontSizeToFit numberOfLines={2}>{greeting},{'\n'}{user?.name || 'Margaret'}!</Text>
                    </View>
                    <TouchableOpacity style={styles.bell} onPress={() => setShowNotifications(true)}>
                        <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Pill Icons */}
                <View style={styles.pills}>
                    {medications.map((med) => (
                        <View key={med.id} style={[styles.pillIcon, { backgroundColor: (medColors[med.color] || colors.bluePrimary) + '20' }]}>
                            <Ionicons name="medical" size={20} color={medColors[med.color] || colors.bluePrimary} />
                        </View>
                    ))}
                </View>

                {/* Invite Card */}
                {showInviteCard && user?.role !== 'independent' && (
                    <View style={styles.card}>
                        <View style={styles.inviteHeader}>
                            <Text style={[styles.cardTitle, { color: colors.bluePrimary }]}>Link Your Caretaker</Text>
                            <TouchableOpacity onPress={handleDismissInvite}>
                                <Ionicons name="close" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.inviteDesc}>Enter the 6-digit code provided by your caretaker to share your medication schedule with them.</Text>
                        <View style={styles.inviteRow}>
                            <TextInput
                                style={styles.inviteInput}
                                placeholder="e.g. XY92A8"
                                placeholderTextColor={colors.textMuted}
                                value={joinCode}
                                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                                maxLength={6}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.linkBtn, (isJoining || joinCode.length !== 6) && { opacity: 0.5 }]}
                                onPress={handleJoinCaregiver}
                                disabled={isJoining || joinCode.length !== 6}
                            >
                                <Text style={styles.linkBtnText} adjustsFontSizeToFit numberOfLines={1}>{isJoining ? 'Linking...' : 'Link'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Medication Cards */}
                <View style={styles.card}>
                    <Text style={styles.instructions}>Tap each medication as you take it:</Text>
                    {medications.map((med) => {
                        const isChecked = checkedMeds.has(med.id);
                        const available = isMedAvailable(med.id);
                        const nextTime = medNextTime[med.id];
                        return (
                            <TouchableOpacity
                                key={med.id}
                                style={[styles.medRow, isChecked && styles.medRowChecked, !available && styles.medRowLocked]}
                                onPress={() => toggleMedCheck(med.id)}
                                activeOpacity={available ? 0.7 : 1}
                            >
                                <View style={[styles.medIcon, isChecked ? styles.medIconChecked : !available ? styles.medIconLocked : { backgroundColor: (medColors[med.color] || colors.bluePrimary) + '20' }]}>
                                    <Ionicons
                                        name={isChecked ? 'checkmark' : !available ? 'lock-closed' : 'medical'}
                                        size={!available ? 16 : 20}
                                        color={isChecked ? colors.white : !available ? colors.textMuted : medColors[med.color] || colors.bluePrimary}
                                    />
                                </View>
                                <View style={styles.medInfo}>
                                    <Text style={[styles.medName, isChecked && styles.medNameChecked, !available && styles.medNameLocked]} adjustsFontSizeToFit numberOfLines={1}>{med.name}</Text>
                                    {available ? (
                                        <Text style={styles.medDosage}>{med.dosage}</Text>
                                    ) : (
                                        <Text style={styles.medLockedLabel}>
                                            <Ionicons name="time-outline" size={11} color={colors.textMuted} />{' '}
                                            Available at {nextTime || 'later'}
                                        </Text>
                                    )}
                                </View>
                                <View style={[styles.checkCircle, isChecked && styles.checkCircleActive, !available && styles.checkCircleLocked]}>
                                    {isChecked && <Ionicons name="checkmark" size={16} color={colors.white} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {!allTaken ? (
                        <TouchableOpacity
                            style={[styles.cta, checkedMeds.size === 0 && styles.ctaDisabled]}
                            onPress={handleTookMeds}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="checkmark-done-circle" size={22} color={colors.white} />
                            <Text style={styles.ctaText} adjustsFontSizeToFit numberOfLines={1}>I Took My Meds</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.doneBadge}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.greenPrimary} />
                            <Text style={styles.doneText}>All done for now!</Text>
                        </View>
                    )}

                    <View style={styles.secondaryBtns}>
                        <TouchableOpacity style={styles.secBtn} onPress={handleLater}>
                            <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                            <Text style={styles.secBtnText}>Later</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secBtn} onPress={() => setShowHelp(true)}>
                            <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
                            <Text style={styles.secBtnText}>Help</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Today's Schedule */}
                {Object.keys(schedule).length > 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Today's Schedule</Text>
                        {Object.entries(schedule).map(([timeKey, data]) => (
                            <View key={timeKey} style={styles.scheduleRow}>
                                <Text style={styles.schedLabel}>{data.label || timeKey}</Text>
                                <Text style={styles.schedTime}>{data.time}</Text>
                                {data.taken ? (
                                    <Ionicons name="checkmark-circle" size={22} color={colors.greenPrimary} />
                                ) : (
                                    <View style={styles.pendingDot} />
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={[styles.card, { alignItems: 'center', paddingVertical: spacing.xxxl }]}>
                        <Ionicons name="calendar-outline" size={48} color={colors.textMuted} style={{ opacity: 0.5, marginBottom: spacing.md }} />
                        <Text style={{ fontSize: fs.lg, fontWeight: '600', color: colors.textPrimary }}>No Medications Today</Text>
                        <Text style={{ color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }}>Your schedule is clear. Any medications added will appear here.</Text>
                    </View>
                )}
            </ScrollView>

            <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

            <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Help & Support">
                <View style={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
                    <View>
                        <Text style={{ fontSize: fs.lg, fontWeight: '600', marginBottom: 4 }}>📱 How to use MediMind</Text>
                        <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>When it's time to take your medications, tap "I Took My Meds" to mark them as taken. Your caretaker will be notified automatically.</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: fs.lg, fontWeight: '600', marginBottom: 4 }}>⏰ Remind me later</Text>
                        <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>Tap "Later" to snooze the reminder for 30 minutes.</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: fs.lg, fontWeight: '600', marginBottom: 4 }}>📋 Your Schedule</Text>
                        <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>View your complete medication schedule in the Schedule tab.</Text>
                    </View>
                    <TouchableOpacity style={styles.cta} onPress={() => setShowHelp(false)}>
                        <Text style={styles.ctaText}>Got it!</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
    date: { fontSize: fs.sm, color: colors.textMuted, marginBottom: 4 },
    greeting: { fontSize: fs.xxl, fontWeight: '800', color: colors.textPrimary, lineHeight: 32 },
    bell: { position: 'relative', padding: spacing.sm },
    badge: { position: 'absolute', top: 2, right: 2, backgroundColor: colors.redPrimary, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
    pillIcon: { width: normalize(40), height: normalize(40), borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.sm },
    cardTitle: { fontSize: fs.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
    inviteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    inviteDesc: { color: colors.textSecondary, fontSize: fs.sm, lineHeight: 20, marginBottom: spacing.md },
    inviteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    inviteInput: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fs.md, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: colors.textPrimary },
    linkBtn: { backgroundColor: colors.bluePrimary, borderRadius: borderRadius.md, paddingHorizontal: spacing.xl, justifyContent: 'center' },
    linkBtnText: { color: colors.white, fontWeight: '700', fontSize: fs.md },
    instructions: { fontSize: fs.sm, color: colors.textSecondary, marginBottom: spacing.md },
    medRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm, backgroundColor: colors.bgPrimary, gap: spacing.md },
    medRowChecked: { backgroundColor: colors.greenLight },
    medRowLocked: { backgroundColor: colors.bgSecondary || '#F0F0F0', opacity: 0.6 },
    medIcon: { width: normalize(40), height: normalize(40), borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
    medIconChecked: { backgroundColor: colors.greenPrimary },
    medIconLocked: { backgroundColor: (colors.textMuted || '#999') + '15' },
    medInfo: { flex: 1 },
    medName: { fontSize: fs.md, fontWeight: '600', color: colors.textPrimary },
    medNameChecked: { textDecorationLine: 'line-through', color: colors.textMuted },
    medNameLocked: { color: colors.textMuted },
    medDosage: { fontSize: fs.sm, color: colors.textSecondary },
    medLockedLabel: { fontSize: fs.xs, color: colors.textMuted, marginTop: 2 },
    checkCircle: { width: normalize(28), height: normalize(28), borderRadius: normalize(14), borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    checkCircleActive: { backgroundColor: colors.greenPrimary, borderColor: colors.greenPrimary },
    checkCircleLocked: { borderColor: colors.textMuted + '40', borderStyle: 'dashed' },
    cta: { backgroundColor: colors.bluePrimary, borderRadius: borderRadius.md, paddingVertical: spacing.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, ...shadows.md },
    ctaDisabled: { opacity: 0.5 },
    ctaText: { color: colors.white, fontSize: fs.lg, fontWeight: '700' },
    doneBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, backgroundColor: colors.greenLight, borderRadius: borderRadius.md, marginTop: spacing.md },
    doneText: { color: colors.greenPrimary, fontWeight: '700', fontSize: fs.md },
    secondaryBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    secBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.bgPrimary },
    secBtnText: { fontSize: fs.md, fontWeight: '600', color: colors.textSecondary },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    schedLabel: { flex: 1, fontSize: fs.md, fontWeight: '600', color: colors.textPrimary },
    schedTime: { fontSize: fs.sm, color: colors.textSecondary, marginRight: spacing.md },
    pendingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.orangeLight, borderWidth: 2, borderColor: colors.orangePrimary },
});
