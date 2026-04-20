import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import PatientSwitcher from '../components/PatientSwitcher';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';
import { Calendar } from 'react-native-calendars';

export default function CaretakerMedsScreen({ navigation }) {
    const { medications, deleteMedication } = useApp();

    const todayDate = new Date();
    const yyyy = todayDate.getFullYear();
    const mm = String(todayDate.getMonth() + 1).padStart(2, '0');
    const dd = String(todayDate.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    const [selectedDate, setSelectedDate] = React.useState(todayStr);

    const medColors = {
        blue: colors.bluePrimary,
        green: colors.greenPrimary,
        purple: colors.purplePrimary,
        orange: colors.orangePrimary,
    };

    const filteredMedications = medications.filter(med => {
        if (med.frequency === 'Specific dates' && Array.isArray(med.specific_dates)) {
            return med.specific_dates.includes(selectedDate);
        }
        return true;
    });

    const handleDelete = (med) => {
        Alert.alert('Delete Medication', `Remove ${med.name} ${med.dosage}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMedication(med.id) },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Medications</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMedication', { selectedDate })} activeOpacity={0.7}>
                        <Ionicons name="add" size={22} color={colors.white} />
                    </TouchableOpacity>
                </View>

                <PatientSwitcher />

                {/* Calendar View */}
                <View style={styles.calendarContainer}>
                    <Calendar
                        current={selectedDate}
                        onDayPress={day => setSelectedDate(day.dateString)}
                        markedDates={{
                            [selectedDate]: { selected: true, selectedColor: colors.bluePrimary }
                        }}
                        theme={{
                            selectedDayBackgroundColor: colors.bluePrimary,
                            todayTextColor: colors.bluePrimary,
                            arrowColor: colors.bluePrimary,
                        }}
                        style={styles.calendar}
                    />
                </View>

                <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>Medications for {selectedDate}</Text>
                </View>

                {filteredMedications.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="medical-outline" size={48} color={colors.textMuted} style={{ opacity: 0.5 }} />
                        <Text style={styles.emptyTitle}>No medications</Text>
                        <Text style={styles.emptyDesc}>Add medications for your patient using the + button.</Text>
                    </View>
                ) : (
                    filteredMedications.map(med => (
                        <View key={med.id} style={styles.medCard}>
                            <View style={[styles.medIcon, { backgroundColor: (medColors[med.color] || colors.bluePrimary) + '20' }]}>
                                <Ionicons name="medical" size={22} color={medColors[med.color] || colors.bluePrimary} />
                            </View>
                            <View style={styles.medInfo}>
                                <Text style={styles.medName}>{med.name}</Text>
                                <Text style={styles.medDetails}>{med.dosage} • {med.frequency === 'Specific dates' ? `Specific dates (${med.specific_dates?.length || 0})` : med.frequency}</Text>
                                {med.times && med.times.length > 0 && (
                                    <Text style={styles.medTimes}>{med.times.join(', ')}</Text>
                                )}
                                {med.instructions ? <Text style={styles.medInstr}>{med.instructions}</Text> : null}
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(med)} hitSlop={8}>
                                <Ionicons name="trash-outline" size={20} color={colors.redPrimary} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    title: { fontSize: fs.xxl, fontWeight: '800', color: colors.textPrimary },
    addBtn: { width: normalize(40), height: normalize(40), borderRadius: normalize(20), backgroundColor: colors.bluePrimary, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
    calendarContainer: { marginBottom: spacing.xl },
    calendar: { borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
    dayHeader: { marginBottom: spacing.md },
    dayTitle: { fontSize: fs.lg, fontWeight: '700', color: colors.textSecondary },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl * 2, gap: spacing.sm },
    emptyTitle: { fontSize: fs.lg, fontWeight: '600', color: colors.textPrimary },
    emptyDesc: { fontSize: fs.md, color: colors.textMuted, textAlign: 'center' },
    medCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md, ...shadows.sm },
    medIcon: { width: normalize(44), height: normalize(44), borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
    medInfo: { flex: 1 },
    medName: { fontSize: fs.lg, fontWeight: '700', color: colors.textPrimary },
    medDetails: { fontSize: fs.sm, color: colors.textSecondary, marginTop: 2 },
    medTimes: { fontSize: fs.sm, color: colors.bluePrimary, fontWeight: '600', marginTop: 4 },
    medInstr: { fontSize: fs.xs, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
});
