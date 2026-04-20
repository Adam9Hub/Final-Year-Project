import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import * as Clipboard from 'expo-clipboard';
import { API_BASE_URL } from '../config';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';

export default function CaretakerFamilyScreen() {
    const { user, showToast, patientsList } = useApp();
    const [inviteCode, setInviteCode] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateCode = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caregiver_id: user.id })
            });
            const data = await res.json();
            if (res.ok) {
                setInviteCode(data.code);
                showToast('Invite code generated!', 'success');
            } else {
                showToast(data.error || 'Failed to generate code', 'error');
            }
        } catch {
            showToast('Server error', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyCode = async () => {
        if (inviteCode) {
            try {
                await Clipboard.setStringAsync(inviteCode);
                showToast('Code copied to clipboard!', 'success');
            } catch {
                showToast('Could not copy', 'error');
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Family</Text>

                {/* Patient Status */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your Patients</Text>
                    {patientsList.length > 0 ? (
                        patientsList.map((patientName, index) => (
                            <View key={index} style={[styles.patientRow, index !== patientsList.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: spacing.md, marginBottom: spacing.md }]}>
                                <View style={styles.patientAvatar}>
                                    <Ionicons name="person" size={24} color={colors.bluePrimary} />
                                </View>
                                <View>
                                    <Text style={styles.patientName}>{patientName}</Text>
                                    <View style={styles.statusBadge}>
                                        <View style={styles.statusDot} />
                                        <Text style={styles.statusText}>Connected</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.noPatient}>
                            <Ionicons name="person-add-outline" size={40} color={colors.textMuted} style={{ opacity: 0.5 }} />
                            <Text style={styles.noPatientText}>No patients linked yet</Text>
                            <Text style={styles.noPatientDesc}>Generate an invite code below and share it with your patients.</Text>
                        </View>
                    )}
                </View>

                {/* Invite Code */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Invite Code</Text>
                    <Text style={styles.inviteDesc}>
                        Generate a 6-digit code for your patient to enter in their app. This will link their medication schedule to your dashboard.
                    </Text>

                    {inviteCode ? (
                        <View style={styles.codeDisplay}>
                            <Text style={styles.codeText}>{inviteCode}</Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
                                <Ionicons name="copy-outline" size={20} color={colors.bluePrimary} />
                                <Text style={styles.copyText}>Copy</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.genBtn, isGenerating && { opacity: 0.7 }]}
                        onPress={generateCode}
                        disabled={isGenerating}
                        activeOpacity={0.8}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <>
                                <Ionicons name="key" size={20} color={colors.white} />
                                <Text style={styles.genBtnText}>{inviteCode ? 'Generate New Code' : 'Generate Invite Code'}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* How it works */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>How It Works</Text>
                    <View style={styles.step}>
                        <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                        <Text style={styles.stepText}>Tap "Generate Invite Code" above</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                        <Text style={styles.stepText}>Share the 6-digit code with your patient</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                        <Text style={styles.stepText}>Your patient enters it in their Settings or Home screen</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
                        <Text style={styles.stepText}>You'll see their medications and schedule on your dashboard!</Text>
                    </View>
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
    cardTitle: { fontSize: fs.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
    patientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    patientAvatar: { width: normalize(52), height: normalize(52), borderRadius: normalize(26), backgroundColor: colors.blueLight, justifyContent: 'center', alignItems: 'center' },
    patientName: { fontSize: fs.lg, fontWeight: '700', color: colors.textPrimary },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.greenPrimary },
    statusText: { fontSize: fs.sm, color: colors.greenPrimary, fontWeight: '600' },
    noPatient: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
    noPatientText: { fontSize: fs.lg, fontWeight: '600', color: colors.textPrimary },
    noPatientDesc: { fontSize: fs.sm, color: colors.textMuted, textAlign: 'center' },
    inviteDesc: { fontSize: fs.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },
    codeDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bgPrimary, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg },
    codeText: { fontSize: normalize(28), fontWeight: '800', color: colors.bluePrimary, letterSpacing: 4 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    copyText: { color: colors.bluePrimary, fontWeight: '600', fontSize: fs.sm },
    genBtn: { backgroundColor: colors.bluePrimary, borderRadius: borderRadius.md, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, ...shadows.md },
    genBtnText: { color: colors.white, fontSize: fs.lg, fontWeight: '700' },
    step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    stepNum: { width: normalize(28), height: normalize(28), borderRadius: normalize(14), backgroundColor: colors.blueLight, justifyContent: 'center', alignItems: 'center' },
    stepNumText: { color: colors.bluePrimary, fontWeight: '700', fontSize: fs.sm },
    stepText: { flex: 1, fontSize: fs.md, color: colors.textSecondary, lineHeight: 20 },
});
