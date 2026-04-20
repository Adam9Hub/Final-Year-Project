// ── Demo Data ──────────────────────────────────────────────────
export const DEMO_MEDICATIONS = [
    { id: 1, name: 'Metformin', dosage: '500mg', color: 'blue', frequency: 'Twice daily', times: ['7:00 AM', '7:00 PM'], instructions: 'Take with food' },
    { id: 2, name: 'Lisinopril', dosage: '10mg', color: 'green', frequency: 'Once daily', times: ['7:00 AM'], instructions: '' },
];

export const DEMO_SCHEDULE = {
    Morning: { time: '7:00 AM', medications: [1, 2], taken: false, takenAt: null },
    Afternoon: { time: '1:00 PM', medications: [1], taken: false, takenAt: null },
    Evening: { time: '9:00 PM', medications: [], taken: false, takenAt: null },
};

export const DEMO_WEEKLY = [
    { day: 'M', status: 'done' },
    { day: 'T', status: 'done' },
    { day: 'W', status: 'partial' },
    { day: 'T', status: 'done' },
    { day: 'F', status: 'none' },
    { day: 'S', status: 'done' },
    { day: 'S', status: 'done' },
];

export const DEMO_MONTHLY = [
    95, 100, 80, 100, 100, 60, 100, 90, 100, 100,
    100, 75, 100, 100, 50, 100, 100, 100, 85, 100,
    0, 100, 100, 100, 70, 100, 100, 100, 100, 85,
];

export const DEMO_USER_IDS = [1, 2];

export function isDemoUser(u) {
    return u && DEMO_USER_IDS.includes(u.id);
}
