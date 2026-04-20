import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import SettingRow from '../components/SettingRow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';

export default function PatientSettingsScreen() {
    const { user, settings, updateSetting, logout, deleteAccount, resetSchedule, showToast, updateUser } = useApp();
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    
    // Profile Editing State
    const [phoneText, setPhoneText] = useState(user?.phone_number || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const success = await updateUser({ phone_number: phoneText });
        if (success) showToast('Profile updated!', 'success');
        setIsSaving(false);
    };

    const handleDelete = () => {
        Alert.alert('Delete Account', 'This action cannot be undone. All your data will be permanently deleted.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: deleteAccount },
        ]);
    };

    const handleContactCaretaker = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${user?.id}/partner-phone`);
            if (!res.ok) throw new Error('Failed to fetch phone number');
            const data = await res.json();
            
            if (!data.phone_number) {
                Alert.alert(
                    "No Phone Number",
                    "Your caretaker has not registered a phone number on their profile yet.",
                    [{ text: "OK" }]
                );
                return;
            }

            Alert.alert(
                "Contact Caretaker",
                "Would you like to call or message your caretaker?",
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

    const handleDropCaretaker = async () => {
        Alert.alert('Remove Caretaker', 'This will disconnect you from your caretaker.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        const res = await fetch(`${API_BASE_URL}/api/patients/drop-caretaker`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ patient_name: user.fullName || user.name })
                        });
                        if (res.ok) {
                            showToast('Caretaker removed', 'info');
                            await AsyncStorage.removeItem(`medimind_linked_${user?.id}`);
                        }
                    } catch (err) {
                        showToast('Failed to disconnect', 'error');
                    }
                }
            },
        ]);
    };

    const handleJoin = async () => {
        if (!joinCode || joinCode.length !== 6) {
            showToast('Enter a valid 6-digit code', 'error');
            return;
        }
        setIsJoining(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/invites/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: joinCode, patient_id: user.id, patient_name: user.fullName || user.name })
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Linked to caretaker!', 'success');
                await AsyncStorage.setItem(`medimind_linked_${user?.id}`, 'true');
                setJoinCode('');
            } else {
                showToast(data.error || 'Failed to join', 'error');
            }
        } catch {
            showToast('Server error', 'error');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Settings</Text>

                {/* Profile */}
                <View style={styles.card}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.avatar || user?.name?.charAt(0) || '?'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.profileName}>{user?.fullName || user?.name}</Text>
                            <Text style={styles.profileEmail}>{user?.email}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.inputLabel}>Phone Number (For Emergency/Doctor Contact)</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <TextInput
                            style={[styles.codeInput, { flex: 1, letterSpacing: 1, textTransform: 'none' }]}
                            placeholder="e.g. +1 555-1234"
                            placeholderTextColor={colors.textMuted}
                            value={phoneText}
                            onChangeText={setPhoneText}
                            keyboardType="phone-pad"
                        />
                        <TouchableOpacity 
                            style={[styles.linkBtn, (isSaving || phoneText === (user?.phone_number || '')) && { opacity: 0.5 }]} 
                            onPress={handleSaveProfile} 
                            disabled={isSaving || phoneText === (user?.phone_number || '')}
                        >
                            <Text style={styles.linkBtnText}>{isSaving ? '...' : 'Save'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Caretaker Link */}
                {user?.role !== 'independent' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Caretaker</Text>
                        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                            <TextInput
                                style={styles.codeInput}
                                placeholder="Enter code"
                                placeholderTextColor={colors.textMuted}
                                value={joinCode}
                                onChangeText={t => setJoinCode(t.toUpperCase())}
                                maxLength={6}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity style={[styles.linkBtn, (isJoining || joinCode.length !== 6) && { opacity: 0.5 }]} onPress={handleJoin} disabled={isJoining || joinCode.length !== 6}>
                                <Text style={styles.linkBtnText}>{isJoining ? '...' : 'Link'}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.contactBtn} onPress={handleContactCaretaker}>
                            <Ionicons name="chatbubbles" size={20} color={colors.white} />
                            <Text style={styles.contactBtnText}>Contact Caretaker</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleDropCaretaker} style={{ marginTop: spacing.lg }}>
                            <Text style={{ color: colors.redPrimary, fontWeight: '600', fontSize: fs.sm, textAlign: 'center' }}>Remove current caretaker</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Notifications */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Notifications</Text>
                    <SettingRow icon="notifications" label="Notifications" value={settings.notifications} onValueChange={v => updateSetting('notifications', v)} />
                    <SettingRow icon="volume-high" label="Reminder sounds" value={settings.remindersSound} onValueChange={v => updateSetting('remindersSound', v)} />
                    <SettingRow icon="alert-circle" iconColor={colors.orangePrimary} label="Missed dose alerts" value={settings.missedDoseAlerts} onValueChange={v => updateSetting('missedDoseAlerts', v)} />
                </View>

                {/* Actions */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Actions</Text>
                    <SettingRow icon="log-out" iconColor={colors.textSecondary} label="Sign Out" type="arrow" onPress={handleLogout} />
                    <SettingRow icon="trash" iconColor={colors.redPrimary} label="Delete Account" danger type="arrow" onPress={handleDelete} />
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
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    avatar: { width: normalize(52), height: normalize(52), borderRadius: normalize(26), backgroundColor: colors.bluePrimary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: colors.white, fontSize: fs.xl, fontWeight: '700' },
    profileName: { fontSize: fs.lg, fontWeight: '700', color: colors.textPrimary },
    profileEmail: { fontSize: fs.sm, color: colors.textSecondary },
    codeInput: { flex: 1, backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fs.md, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: colors.textPrimary },
    linkBtn: { backgroundColor: colors.bluePrimary, borderRadius: borderRadius.md, paddingHorizontal: spacing.xl, justifyContent: 'center' },
    linkBtnText: { color: colors.white, fontWeight: '700' },
    divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.lg },
    inputLabel: { fontSize: fs.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
    contactBtn: { backgroundColor: colors.greenPrimary, borderRadius: borderRadius.md, paddingVertical: spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, ...shadows.sm },
    contactBtnText: { color: colors.white, fontSize: fs.md, fontWeight: '700' },
});
