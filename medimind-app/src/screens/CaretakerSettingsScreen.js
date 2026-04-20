import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import SettingRow from '../components/SettingRow';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';

export default function CaretakerSettingsScreen() {
    const { user, settings, updateSetting, logout, deleteAccount, resetSchedule, showToast, updateUser } = useApp();

    const [phoneText, setPhoneText] = useState(user?.phone_number || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure?', [
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
        Alert.alert('Delete Account', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: deleteAccount },
        ]);
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
                            <Text style={styles.profileRole}>Caretaker {user?.caringFor ? `· Caring for ${user.caringFor}` : ''}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.inputLabel}>Phone Number</Text>
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

                {/* Notifications */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Notifications</Text>
                    <SettingRow icon="notifications" label="Notifications" value={settings.notifications} onValueChange={v => updateSetting('notifications', v)} />
                    <SettingRow icon="volume-high" label="Reminder sounds" value={settings.remindersSound} onValueChange={v => updateSetting('remindersSound', v)} />
                    <SettingRow icon="alert-circle" iconColor={colors.orangePrimary} label="Missed dose alerts" value={settings.missedDoseAlerts} onValueChange={v => updateSetting('missedDoseAlerts', v)} />
                    <SettingRow icon="document-text" label="Daily summary" value={settings.dailySummary} onValueChange={v => updateSetting('dailySummary', v)} />
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
    profileRole: { fontSize: fs.xs, color: colors.bluePrimary, fontWeight: '600', marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.lg },
    inputLabel: { fontSize: fs.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
    codeInput: { backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fs.md, fontWeight: '700', color: colors.textPrimary },
    linkBtn: { backgroundColor: colors.bluePrimary, borderRadius: borderRadius.md, paddingHorizontal: spacing.xl, justifyContent: 'center' },
    linkBtnText: { color: colors.white, fontWeight: '700' },
});
