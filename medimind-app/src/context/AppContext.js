import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import {
    registerForPushNotifications,
    scheduleMedicationReminders,
    cancelAllReminders,
    sendInstantNotification,
    getExpoPushToken
} from '../services/notificationService';

const AppContext = createContext(null);

import {
    DEMO_SCHEDULE,
    DEMO_WEEKLY,
    DEMO_MONTHLY,
    isDemoUser
} from '../constants/mockData';

// ── Helpers ─────────────────────────────────────────────────────
async function loadFromStorage(key, fallback) {
    try {
        const stored = await AsyncStorage.getItem(`medimind_${key}`);
        return stored ? JSON.parse(stored) : fallback;
    } catch { return fallback; }
}

async function saveToStorage(key, value) {
    try { await AsyncStorage.setItem(`medimind_${key}`, JSON.stringify(value)); } catch { /* ignore */ }
}

const EMPTY_SCHEDULE = {};

const EMPTY_WEEKLY = [
    { day: 'M', status: 'none' },
    { day: 'T', status: 'none' },
    { day: 'W', status: 'none' },
    { day: 'T', status: 'none' },
    { day: 'F', status: 'none' },
    { day: 'S', status: 'none' },
    { day: 'S', status: 'none' },
];

const EMPTY_MONTHLY = Array(30).fill(0);

// ── Schedule Generator ─────────────────────────────────────────
function generateScheduleFromMeds(meds, prevSchedule = {}) {
    const newSchedule = {};
    if (!meds || !Array.isArray(meds)) return newSchedule;

    const parseTime = (tStr) => {
        const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return 0;
        let [_, h, m, ampm] = match;
        h = parseInt(h);
        m = parseInt(m);
        if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    };

    const getLabel = (tStr) => {
        const h = Math.floor(parseTime(tStr) / 60);
        if (h >= 5 && h < 12) return 'Morning';
        if (h >= 12 && h < 17) return 'Afternoon';
        if (h >= 17 && h < 22) return 'Evening';
        return 'Night';
    };

    const todayDate = new Date();
    const yyyy = todayDate.getFullYear();
    const mm = String(todayDate.getMonth() + 1).padStart(2, '0');
    const dd = String(todayDate.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    meds.forEach(med => {
        if (med.frequency === 'Specific dates' && Array.isArray(med.specific_dates)) {
            if (!med.specific_dates.includes(todayStr)) return;
        }

        if (!med.times || !Array.isArray(med.times)) return;
        med.times.forEach(timeStr => {
            if (!timeStr || typeof timeStr !== 'string' || !timeStr.trim()) return;
            const t = timeStr.trim();
            if (!newSchedule[t]) {
                const isTaken = prevSchedule[t]?.taken || false;
                const takenAt = prevSchedule[t]?.takenAt || null;
                newSchedule[t] = {
                    label: getLabel(t),
                    time: t,
                    medications: [],
                    taken: isTaken,
                    takenAt: takenAt
                };
            }
            if (!newSchedule[t].medications.includes(med.id)) {
                newSchedule[t].medications.push(med.id);
            }
        });
    });

    const sortedKeys = Object.keys(newSchedule).sort((a, b) => parseTime(a) - parseTime(b));
    const sortedSchedule = {};
    for (const key of sortedKeys) {
        sortedSchedule[key] = newSchedule[key];
    }
    return sortedSchedule;
}

// ── Provider ────────────────────────────────────────────────────
export function AppProvider({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // default true to avoid flash
    const [medications, setMedications] = useState([]);
    const [schedule, setSchedule] = useState(EMPTY_SCHEDULE);
    const [weeklyAdherence, setWeeklyAdherence] = useState(EMPTY_WEEKLY);
    const [monthlyAdherence, setMonthlyAdherence] = useState(EMPTY_MONTHLY);
    const [streak, setStreak] = useState(0);
    const [reminderTime, setReminderTime] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [settings, setSettings] = useState({
        notifications: true,
        remindersSound: true,
        missedDoseAlerts: true,
        dailySummary: true,
        pushNotifications: true,
        fontSize: 'medium',
    });

    const [selectedPatientName, setSelectedPatientName] = useState(null);

    const patientsList = useMemo(() => {
        if (!user?.caringFor) return [];
        try {
            const parsed = JSON.parse(user.caringFor);
            return Array.isArray(parsed) ? parsed : [user.caringFor];
        } catch {
            return [user.caringFor].filter(Boolean);
        }
    }, [user?.caringFor]);

    useEffect(() => {
        if (patientsList.length > 0 && (!selectedPatientName || !patientsList.includes(selectedPatientName))) {
            setSelectedPatientName(patientsList[0]);
        } else if (patientsList.length === 0 && selectedPatientName) {
            setSelectedPatientName(null);
        }
    }, [patientsList, selectedPatientName]);

    // Load initial state from AsyncStorage
    useEffect(() => {
        (async () => {
            const savedUser = await loadFromStorage('user', null);
            let savedSchedule = await loadFromStorage('schedule', savedUser && isDemoUser(savedUser) ? DEMO_SCHEDULE : EMPTY_SCHEDULE);
            const savedWeekly = await loadFromStorage('weekly', savedUser && isDemoUser(savedUser) ? DEMO_WEEKLY : EMPTY_WEEKLY);
            const savedStreak = await loadFromStorage('streak', savedUser && isDemoUser(savedUser) ? 3 : 0);
            const savedNotifs = await loadFromStorage('notifications', []);
            const savedSettings = await loadFromStorage('settings', settings);
            const seenWelcome = await loadFromStorage('hasSeenWelcome', false);

            const lastDate = await loadFromStorage('lastDate', null);
            const todayStr = new Date().toDateString();

            if (lastDate && lastDate !== todayStr && savedUser?.id) {
                // A new day has started, check if there are completely missed meds
                const missedMedIds = new Set();
                Object.values(savedSchedule).forEach(slot => {
                    if (slot && !slot.taken && Array.isArray(slot.medications)) {
                        slot.medications.forEach(m => missedMedIds.add(m));
                    }
                });

                if (missedMedIds.size > 0 && (savedUser.role === 'patient' || savedUser.role === 'independent')) {
                    for (let mId of missedMedIds) {
                        try {
                            await fetch(`${API_BASE_URL}/api/medications/${mId}?user_id=${savedUser.id}`, { method: 'DELETE' });
                            console.log(`[Auto-Remove] Deleted completely missed medication: ${mId}`);
                        } catch (e) {
                            console.warn('[Auto-Remove] Failed to auto-remove', e);
                        }
                    }
                }

                // Reset the daily schedule
                savedSchedule = EMPTY_SCHEDULE;
                await saveToStorage('schedule', savedSchedule);
            }
            await saveToStorage('lastDate', todayStr);

            if (savedUser) setUser(savedUser);
            setHasSeenWelcome(seenWelcome);
            setSchedule(savedSchedule);
            setWeeklyAdherence(savedWeekly);
            setMonthlyAdherence(savedUser && isDemoUser(savedUser) ? DEMO_MONTHLY : EMPTY_MONTHLY);
            setStreak(savedStreak);
            setNotifications(savedNotifs);
            setSettings(prev => ({ ...prev, ...savedSettings }));
            setIsLoading(false);
        })();
    }, []);

    // ── Toast & Notification Functions ──
    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const addNotification = useCallback((type, title, body) => {
        const id = Date.now() + Math.random();
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        setNotifications((prev) => [{ id, type, title, body, time: timeStr, read: false }, ...prev].slice(0, 20));
    }, []);

    const markNotificationRead = useCallback((id) => {
        setNotifications((prev) =>
            prev.map((n) => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllNotificationsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        showToast('Notifications cleared', 'info');
    }, [showToast]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const addNotificationRef = useRef(addNotification);
    const showToastRef = useRef(showToast);

    useEffect(() => {
        addNotificationRef.current = addNotification;
        showToastRef.current = showToast;
    }, [addNotification, showToast]);

    // ── SSE CONNECTION EFFECT ──
    useEffect(() => {
        if (!user?.id) return;
        saveToStorage('user', user);

        let isSubscribed = true;
        let eventSource = null;
        let reconnectTimer = null;

        const connectSSE = () => {
            if (!isSubscribed) return;
            try {
                const EventSource = require('react-native-sse').default;
                eventSource = new EventSource(`${API_BASE_URL}/api/events?user_id=${user.id}`);

                eventSource.addEventListener('open', () => {
                    console.log(`[SSE] Connected for user ${user.id}`);
                });

                eventSource.addEventListener('med_added', (event) => {
                    if (!isSubscribed) return;
                    try {
                        const data = JSON.parse(event.data);
                        addNotificationRef.current('success', data.title, data.body);
                        showToastRef.current(data.title, 'success');
                        sendInstantNotification(data.title, data.body);
                        if (data.medication) {
                            setMedications((prev) => {
                                const exists = prev.some(m => m.id === data.medication.id);
                                if (exists) return prev;
                                return [...prev, data.medication];
                            });
                        }
                    } catch (e) { console.error('[SSE] Failed to parse med_added', e); }
                });

                eventSource.addEventListener('med_updated', (event) => {
                    if (!isSubscribed) return;
                    try {
                        const data = JSON.parse(event.data);
                        addNotificationRef.current('info', data.title, data.body);
                        showToastRef.current(data.title, 'info');
                        sendInstantNotification(data.title, data.body);
                        if (data.medication) {
                            setMedications((prev) => prev.map((m) => m.id === data.medication.id ? data.medication : m));
                        }
                    } catch (e) { console.error('[SSE] Failed to parse med_updated', e); }
                });

                eventSource.addEventListener('med_deleted', (event) => {
                    if (!isSubscribed) return;
                    try {
                        const data = JSON.parse(event.data);
                        addNotificationRef.current('info', data.title, data.body);
                        showToastRef.current(data.title, 'info');
                        sendInstantNotification(data.title, data.body);
                        if (data.medicationId) {
                            setMedications((prev) => prev.filter((m) => m.id !== data.medicationId));
                        }
                    } catch (e) { console.error('[SSE] Failed to parse med_deleted', e); }
                });

                eventSource.addEventListener('med_taken', (event) => {
                    if (!isSubscribed) return;
                    try {
                        const data = JSON.parse(event.data);
                        addNotificationRef.current('success', data.title, data.body);
                        showToastRef.current(data.title, 'success');
                        sendInstantNotification('✅ ' + data.title, data.body);
                        if (data.payload) {
                            if (data.payload.schedule) setSchedule(data.payload.schedule);
                            if (data.payload.adherence) setWeeklyAdherence(data.payload.adherence);
                            if (data.payload.monthly) setMonthlyAdherence(data.payload.monthly);
                        }
                    } catch (e) { console.error('[SSE] Failed to parse med_taken', e); }
                });

                eventSource.addEventListener('patient_linked', (event) => {
                    if (!isSubscribed) return;
                    try {
                        const data = JSON.parse(event.data);
                        addNotificationRef.current('success', data.title, data.body);
                        showToastRef.current(data.title, 'success');
                        sendInstantNotification(data.title, data.body);
                        // Refresh the full user from the server to get the complete caringFor list
                        fetch(`${API_BASE_URL}/api/users`)
                            .then(r => r.json())
                            .then(users => {
                                const me = users.find(u => u.id === user.id);
                                if (me) setUser(prev => prev ? { ...prev, caringFor: me.caringFor } : prev);
                            })
                            .catch(() => {});
                    } catch (e) { console.error('[SSE] Failed to parse patient_linked', e); }
                });

                eventSource.addEventListener('patient_dropped', (event) => {
                    if (!isSubscribed) return;
                    try {
                        const data = JSON.parse(event.data);
                        addNotificationRef.current('info', data.title, data.body);
                        showToastRef.current(data.title, 'info');
                        sendInstantNotification(data.title, data.body);
                        // Refresh the full user from the server to get the updated caringFor list
                        fetch(`${API_BASE_URL}/api/users`)
                            .then(r => r.json())
                            .then(users => {
                                const me = users.find(u => u.id === user.id);
                                if (me) setUser(prev => prev ? { ...prev, caringFor: me.caringFor } : prev);
                            })
                            .catch(() => {});
                    } catch (e) { console.error('[SSE] Failed to parse patient_dropped', e); }
                });

                eventSource.addEventListener('error', (event) => {
                    if (!isSubscribed) return;
                    console.warn('[SSE] Connection lost, reconnecting in 3s...');
                    if (eventSource) { eventSource.close(); eventSource = null; }
                    reconnectTimer = setTimeout(connectSSE, 3000);
                });
            } catch (e) {
                console.warn('[SSE] react-native-sse not available, SSE disabled:', e.message);
            }
        };

        connectSSE();

        return () => {
            isSubscribed = false;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (eventSource) eventSource.close();
        };
    }, [user?.id]);

    // Generate dynamic schedule whenever medications change
    useEffect(() => {
        setSchedule(prev => {
            const newSched = generateScheduleFromMeds(medications, prev);
            saveToStorage('schedule', newSched);
            return newSched;
        });
    }, [medications]);

    // Fetch medications from backend
    useEffect(() => {
        if (!user?.id) {
            setMedications([]);
            return;
        }
        let url = `${API_BASE_URL}/api/medications?user_id=${user.id}`;
        if (user.role === 'caretaker') {
            if (!selectedPatientName && patientsList.length > 0) return; // Wait until patient is strictly selected
            if (selectedPatientName) {
                url += `&target_patient=${encodeURIComponent(selectedPatientName)}`;
            }
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMedications(data);
            })
            .catch(err => console.error('Failed to load medications from API:', err));
    }, [user, selectedPatientName, patientsList]);

    // ── Push Notification Scheduling ──
    // Request permission on login, schedule reminders when meds or settings change
    useEffect(() => {
        if (!user?.id) return;

        // Request notification permissions and register push token
        (async () => {
            const granted = await registerForPushNotifications();
            if (granted) {
                const pushToken = await getExpoPushToken();
                if (pushToken) {
                    try {
                        await fetch(`${API_BASE_URL}/api/users/${user.id}/push-token`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ push_token: pushToken }),
                        });
                        console.log('[Push] Token registered with server');
                    } catch (err) {
                        console.warn('[Push] Failed to register token with server:', err.message);
                    }
                }
            }
        })();
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;

        // Only schedule local device alerts for the patient taking the medications
        if ((user.role === 'patient' || user.role === 'independent') && settings.notifications && medications.length > 0) {
            scheduleMedicationReminders(medications, settings.remindersSound);
        } else {
            cancelAllReminders();
        }
    }, [user?.id, user?.role, medications, settings.notifications, settings.remindersSound]);

    // ── Storage Effects ──
    useEffect(() => { saveToStorage('user', user); }, [user]);
    useEffect(() => { saveToStorage('schedule', schedule); }, [schedule]);
    useEffect(() => { saveToStorage('weekly', weeklyAdherence); }, [weeklyAdherence]);
    useEffect(() => { saveToStorage('streak', streak); }, [streak]);
    useEffect(() => { saveToStorage('notifications', notifications.slice(0, 50)); }, [notifications]);
    useEffect(() => { saveToStorage('settings', settings); }, [settings]);

    // ── Auth ──
    const login = useCallback((userData) => {
        setUser(userData);
        if (isDemoUser(userData)) {
            setWeeklyAdherence(DEMO_WEEKLY);
            setMonthlyAdherence(DEMO_MONTHLY);
            setStreak(3);
            setNotifications([
                { id: 1, type: 'alert', title: 'Morning medications due', body: `${userData.name} has medications to take`, read: false },
                { id: 2, type: 'success', title: 'Afternoon dose taken', body: 'Metformin 500mg was taken on time', read: true },
            ]);
        } else {
            setWeeklyAdherence(EMPTY_WEEKLY);
            setMonthlyAdherence(EMPTY_MONTHLY);
            setStreak(0);
            setNotifications([]);
        }
        // Schedule will be built automatically from medications via the useEffect
    }, []);

    const logout = useCallback(async () => {
        await cancelAllReminders();
        setUser(null);
        setMedications([]);
        setSchedule(EMPTY_SCHEDULE);
        setNotifications([]);
        setStreak(0);
        setWeeklyAdherence(EMPTY_WEEKLY);
        setMonthlyAdherence(EMPTY_MONTHLY);
        await AsyncStorage.clear();
    }, []);

    const updateUser = useCallback(async (updates) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error('Failed to update user');
            
            const updatedUser = await res.json();
            setUser(updatedUser);
            await saveToStorage('user', updatedUser);
            return true;
        } catch (error) {
            console.error('Update user error:', error);
            showToast('Failed to update profile', 'error');
            return false;
        }
    }, [user?.id, showToast]);

    const completeWelcome = useCallback(async () => {
        setHasSeenWelcome(true);
        await saveToStorage('hasSeenWelcome', true);
    }, []);

    const deleteAccount = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/delete/${user.id}`, { method: 'DELETE' });
            if (res.ok) {
                setUser(null);
                setMedications([]);
                setSchedule(EMPTY_SCHEDULE);
                setNotifications([]);
                setStreak(0);
                setWeeklyAdherence(EMPTY_WEEKLY);
                setMonthlyAdherence(EMPTY_MONTHLY);
                await AsyncStorage.clear();
            }
        } catch (err) {
            console.error('Failed to delete account:', err);
        }
    }, [user]);

    // ── Medications ──
    const addMedication = useCallback(async (med) => {
        try {
            const payload = { ...med, user_id: user?.id };
            // If the user is a caretaker, include the selected patient so the server saves to the correct patient
            if (user?.role === 'caretaker' && selectedPatientName) {
                payload.target_patient = selectedPatientName;
            }
            const res = await fetch(`${API_BASE_URL}/api/medications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const newMed = await res.json();
            setMedications((prev) => [...prev, newMed]);
            addNotification('success', 'New medication added', `${newMed.name} ${newMed.dosage} has been added to the schedule`);
            showToast('Medication added', 'success');
        } catch (error) {
            console.error('Failed to add medication:', error);
            showToast('Failed to save medication', 'error');
        }
    }, [showToast, addNotification, user?.id, user?.role, selectedPatientName]);

    const deleteMedication = useCallback(async (medId) => {
        try {
            await fetch(`${API_BASE_URL}/api/medications/${medId}?user_id=${user?.id}`, { method: 'DELETE' });
            setMedications((prev) => prev.filter((m) => m.id !== medId));
            showToast('Medication removed', 'info');
        } catch (error) {
            console.error('Failed to delete medication:', error);
            showToast('Failed to delete medication', 'error');
        }
    }, [showToast, user?.id]);

    const updateMedication = useCallback(async (medId, updates) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/medications/${medId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updates, user_id: user?.id })
            });
            const updatedMed = await res.json();
            setMedications((prev) => prev.map((m) => m.id === medId ? updatedMed : m));
            showToast('Medication updated', 'success');
        } catch (error) {
            console.error('Failed to update medication:', error);
            showToast('Failed to update medication', 'error');
        }
    }, [showToast, user?.id]);

    // ── Schedule ──
    const markTaken = useCallback(async (period) => {
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const newSchedule = { ...schedule };
        if (newSchedule[period]) {
            newSchedule[period] = { ...newSchedule[period], taken: true, takenAt: timeStr };
        }
        const allNowTaken = Object.values(newSchedule).every(s => s.taken);
        setSchedule(newSchedule);
        saveToStorage('schedule', newSchedule);

        const now = new Date();
        const dayIndex = now.getDay();
        const arrayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        const newAdherence = [...weeklyAdherence];
        if (newAdherence[arrayIndex]) {
            if (allNowTaken) {
                newAdherence[arrayIndex] = { ...newAdherence[arrayIndex], status: 'done' };
            }
        }
        setWeeklyAdherence(newAdherence);
        saveToStorage('adherence', newAdherence);

        let newMonthly = [...monthlyAdherence];
        if (allNowTaken) {
            newMonthly[newMonthly.length - 1] = 100;
        } else {
            newMonthly[newMonthly.length - 1] = 50;
        }
        setMonthlyAdherence(newMonthly);
        saveToStorage('monthly', newMonthly);

        addNotification('success', `${period} dose taken`, `Medications marked as taken at ${timeStr}`);
        showToast(`${period} meds marked as taken!`, 'success');

        if (user?.role === 'patient') {
            try {
                await fetch(`${API_BASE_URL}/api/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targetRole: 'caretaker',
                        patientName: user.name,
                        type: 'med_taken',
                        title: 'Medication Taken',
                        body: `${user.name} took their ${period} dose at ${timeStr}`,
                        payload: { schedule: newSchedule, adherence: newAdherence, monthly: newMonthly }
                    })
                });
            } catch (err) {
                console.error('Failed to notify caretaker:', err);
            }
        }
    }, [schedule, weeklyAdherence, showToast, addNotification, user?.role, user?.name]);

    const submitMeds = useCallback(async (checkedMedsSet) => {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const allChecked = medications.length > 0 && checkedMedsSet.size === medications.length;

        let takenMedNames = [];
        medications.forEach(m => {
            if (checkedMedsSet.has(m.id)) takenMedNames.push(m.name);
        });

        const newSchedule = { ...schedule };
        for (const period of Object.keys(newSchedule)) {
            const periodMeds = newSchedule[period].medications || [];
            const matches = periodMeds.some(mId => checkedMedsSet.has(mId));
            if (matches) {
                newSchedule[period] = { ...newSchedule[period], taken: true, takenAt: timestamp };
            }
        }
        const allNowTaken = Object.values(newSchedule).every(s => s.taken);
        setSchedule(newSchedule);
        saveToStorage('schedule', newSchedule);

        const now = new Date();
        const dayIndex = now.getDay();
        const arrayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        const newAdherence = [...weeklyAdherence];
        if (newAdherence[arrayIndex]) {
            if (allChecked || allNowTaken) {
                newAdherence[arrayIndex] = { ...newAdherence[arrayIndex], status: 'done' };
            }
        }
        setWeeklyAdherence(newAdherence);
        saveToStorage('adherence', newAdherence);

        let newMonthly = [...monthlyAdherence];
        if (allChecked || allNowTaken) {
            newMonthly[newMonthly.length - 1] = 100;
        } else {
            newMonthly[newMonthly.length - 1] = 50;
        }
        setMonthlyAdherence(newMonthly);
        saveToStorage('monthly', newMonthly);

        const notifyMsg = takenMedNames.length > 0
            ? `${user?.fullName || user?.name || 'Your patient'} just took: ${takenMedNames.join(', ')}.`
            : `${user?.fullName || user?.name || 'Your patient'} completely finished their daily routine!`;

        addNotification('success', 'Medications logged', notifyMsg);

        if (user?.role === 'patient') {
            try {
                await fetch(`${API_BASE_URL}/api/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targetRole: 'caretaker',
                        patientName: user.name,
                        type: 'med_taken',
                        title: 'Medications Taken',
                        body: notifyMsg,
                        payload: { schedule: newSchedule, adherence: newAdherence, monthly: newMonthly }
                    }),
                });
            } catch (err) {
                console.error('Failed to notify caretaker:', err);
            }
        }
    }, [user, medications, schedule, weeklyAdherence, addNotification]);

    const resetSchedule = useCallback(() => {
        const base = isDemoUser(user) ? DEMO_SCHEDULE : EMPTY_SCHEDULE;
        setSchedule(base);
        showToast('Schedule reset for testing', 'info');
    }, [showToast, user]);

    // ── Postpone / Later ──
    const postponeMedications = useCallback(async () => {
        const parseTime = (tStr) => {
            if (!tStr || typeof tStr !== 'string') return 0;
            const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return 0;
            let [_, h, m, ampm] = match;
            h = parseInt(h); m = parseInt(m);
            if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
            if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
            return h * 60 + m;
        };

        const addMinutes = (tStr, mins) => {
            const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return tStr;
            let [_, h, m, ampm] = match;
            h = parseInt(h); m = parseInt(m);
            let h24 = h;
            if (ampm.toUpperCase() === 'PM' && h < 12) h24 += 12;
            if (ampm.toUpperCase() === 'AM' && h === 12) h24 = 0;
            let total = h24 * 60 + m + mins;
            if (total >= 24 * 60) total = 23 * 60 + 59;
            let newH = Math.floor(total / 60);
            let newM = total % 60;
            let newAmpm = newH >= 12 ? 'PM' : 'AM';
            if (newH > 12) newH -= 12;
            if (newH === 0) newH = 12;
            return `${newH}:${String(newM).padStart(2, '0')} ${newAmpm}`;
        };

        // Find all untaken time slots
        const untakenSlots = Object.entries(schedule)
            .filter(([_, data]) => !data.taken)
            .sort((a, b) => parseTime(a[1].time || a[0]) - parseTime(b[1].time || b[0]));

        if (untakenSlots.length === 0) {
            showToast('No medications to postpone', 'info');
            return;
        }

        // Build a map of old time → new time for the untaken slots
        const timeShifts = {};
        untakenSlots.forEach(([timeKey, data]) => {
            const oldTime = data.time || timeKey;
            timeShifts[oldTime] = addMinutes(oldTime, 10);
        });

        // Collect IDs of medications that belong to untaken slots
        const affectedMedIds = new Set();
        untakenSlots.forEach(([_, data]) => {
            (data.medications || []).forEach(id => affectedMedIds.add(id));
        });

        // Update each affected medication's times (only shift the specific times that are in untaken slots)
        const updatedMeds = medications.map(med => {
            if (!affectedMedIds.has(med.id)) return med;
            const newTimes = (med.times || []).map(t => timeShifts[t] || t);
            return { ...med, times: newTimes };
        });

        // Persist to backend
        for (const med of updatedMeds) {
            if (!affectedMedIds.has(med.id)) continue;
            try {
                await fetch(`${API_BASE_URL}/api/medications/${med.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ times: med.times, user_id: user?.id })
                });
            } catch (err) {
                console.error('[Postpone] Failed to update medication:', err);
            }
        }

        setMedications(updatedMeds);

        const firstNewTime = Object.values(timeShifts)[0];
        addNotification('info', 'Medications postponed', `Pushed forward 10 minutes — next up at ${firstNewTime}`);
        showToast(`Medications moved to ${firstNewTime}`, 'info');

        // Notify caretaker that medications were postponed
        if (user?.name) {
            try {
                // Build the updated schedule from the shifted meds so caretaker sees new times
                const newSchedule = generateScheduleFromMeds(updatedMeds, schedule);
                await fetch(`${API_BASE_URL}/api/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targetRole: 'caretaker',
                        patientName: user.name,
                        type: 'med_updated',
                        title: '⏰ Medications Postponed',
                        body: `${user.name} pushed their medications back 10 minutes — next at ${firstNewTime}`,
                        medication: updatedMeds.find(m => affectedMedIds.has(m.id)),
                        payload: { schedule: newSchedule }
                    }),
                });
            } catch (err) {
                console.error('[Postpone] Failed to notify caretaker:', err);
            }
        }
    }, [schedule, medications, showToast, addNotification, user?.id, user?.name]);

    // ── Settings ──
    const updateSetting = useCallback((key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        showToast(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} ${value ? 'enabled' : 'disabled'}`, 'success');
    }, [showToast]);

    const value = {
        isLoading,
        user,
        hasSeenWelcome,
        completeWelcome,
        medications,
        schedule,
        weeklyAdherence,
        monthlyAdherence,
        streak,
        toasts,
        notifications,
        unreadCount,
        settings,
        reminderTime,
        patientsList,
        selectedPatientName,
        setSelectedPatientName,
        login,
        logout,
        updateUser,
        deleteAccount,
        addMedication,
        deleteMedication,
        updateMedication,
        markTaken,
        submitMeds,
        resetSchedule,
        postponeMedications,
        showToast,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        updateSetting,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
