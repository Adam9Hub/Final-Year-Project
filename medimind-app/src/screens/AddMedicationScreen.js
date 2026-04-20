import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing, fontSize as fs, shadows } from '../theme';
import { Calendar } from 'react-native-calendars';

const COLORS = [
    { key: 'blue', color: colors.bluePrimary },
    { key: 'green', color: colors.greenPrimary },
    { key: 'purple', color: colors.purplePrimary },
    { key: 'orange', color: colors.orangePrimary },
];

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Specific dates', 'As needed'];

// ── Medication Database ─────────────────────────────────────────
// Each medication has a name, common dosages, max daily limit, and default instructions
const CATEGORIES = ['All', 'Pain', 'Cardiovascular', 'Cholesterol', 'Diabetes', 'Gastrointestinal', 'Antibiotics', 'Mental Health', 'Respiratory', 'Neurological', 'Thyroid', 'Vitamins', 'Dementia', 'Other'];

const MEDICATION_DB = [
    // ── Pain & Anti-Inflammatory ──
    { name: 'Paracetamol', category: 'Pain', dosages: ['250mg', '500mg', '1000mg'], maxDaily: 4000, instructions: '' },
    { name: 'Acetaminophen', category: 'Pain', dosages: ['325mg', '500mg', '650mg', '1000mg'], maxDaily: 4000, instructions: '' },
    { name: 'Ibuprofen', category: 'Pain', dosages: ['200mg', '400mg', '600mg', '800mg'], maxDaily: 3200, instructions: 'Take with food' },
    { name: 'Aspirin', category: 'Pain', dosages: ['75mg', '100mg', '300mg', '500mg'], maxDaily: 4000, instructions: '' },
    { name: 'Naproxen', category: 'Pain', dosages: ['220mg', '250mg', '375mg', '500mg'], maxDaily: 1250, instructions: 'Take with food' },
    { name: 'Diclofenac', category: 'Pain', dosages: ['25mg', '50mg', '75mg', '100mg'], maxDaily: 150, instructions: 'Take with food' },
    { name: 'Celecoxib', category: 'Pain', dosages: ['100mg', '200mg'], maxDaily: 400, instructions: '' },
    { name: 'Meloxicam', category: 'Pain', dosages: ['7.5mg', '15mg'], maxDaily: 15, instructions: '' },
    { name: 'Tramadol', category: 'Pain', dosages: ['50mg', '100mg'], maxDaily: 400, instructions: '' },
    { name: 'Codeine', category: 'Pain', dosages: ['15mg', '30mg', '60mg'], maxDaily: 240, instructions: '' },

    // ── Cardiovascular ──
    { name: 'Lisinopril', category: 'Cardiovascular', dosages: ['2.5mg', '5mg', '10mg', '20mg', '40mg'], maxDaily: 80, instructions: 'Take at the same time daily' },
    { name: 'Amlodipine', category: 'Cardiovascular', dosages: ['2.5mg', '5mg', '10mg'], maxDaily: 10, instructions: '' },
    { name: 'Losartan', category: 'Cardiovascular', dosages: ['25mg', '50mg', '100mg'], maxDaily: 100, instructions: '' },
    { name: 'Valsartan', category: 'Cardiovascular', dosages: ['40mg', '80mg', '160mg', '320mg'], maxDaily: 320, instructions: '' },
    { name: 'Ramipril', category: 'Cardiovascular', dosages: ['1.25mg', '2.5mg', '5mg', '10mg'], maxDaily: 10, instructions: '' },
    { name: 'Enalapril', category: 'Cardiovascular', dosages: ['2.5mg', '5mg', '10mg', '20mg'], maxDaily: 40, instructions: '' },
    { name: 'Candesartan', category: 'Cardiovascular', dosages: ['4mg', '8mg', '16mg', '32mg'], maxDaily: 32, instructions: '' },
    { name: 'Irbesartan', category: 'Cardiovascular', dosages: ['75mg', '150mg', '300mg'], maxDaily: 300, instructions: '' },
    { name: 'Bisoprolol', category: 'Cardiovascular', dosages: ['1.25mg', '2.5mg', '5mg', '10mg'], maxDaily: 20, instructions: '' },
    { name: 'Atenolol', category: 'Cardiovascular', dosages: ['25mg', '50mg', '100mg'], maxDaily: 100, instructions: '' },
    { name: 'Metoprolol', category: 'Cardiovascular', dosages: ['25mg', '50mg', '100mg', '200mg'], maxDaily: 400, instructions: 'Take with food' },
    { name: 'Propranolol', category: 'Cardiovascular', dosages: ['10mg', '20mg', '40mg', '80mg', '160mg'], maxDaily: 320, instructions: '' },
    { name: 'Carvedilol', category: 'Cardiovascular', dosages: ['3.125mg', '6.25mg', '12.5mg', '25mg'], maxDaily: 50, instructions: 'Take with food' },
    { name: 'Diltiazem', category: 'Cardiovascular', dosages: ['30mg', '60mg', '90mg', '120mg', '180mg', '240mg'], maxDaily: 480, instructions: '' },
    { name: 'Nifedipine', category: 'Cardiovascular', dosages: ['10mg', '20mg', '30mg', '60mg', '90mg'], maxDaily: 120, instructions: '' },
    { name: 'Furosemide', category: 'Cardiovascular', dosages: ['20mg', '40mg', '80mg'], maxDaily: 600, instructions: '' },
    { name: 'Hydrochlorothiazide', category: 'Cardiovascular', dosages: ['12.5mg', '25mg', '50mg'], maxDaily: 50, instructions: '' },
    { name: 'Spironolactone', category: 'Cardiovascular', dosages: ['25mg', '50mg', '100mg'], maxDaily: 400, instructions: '' },
    { name: 'Indapamide', category: 'Cardiovascular', dosages: ['1.25mg', '2.5mg'], maxDaily: 2.5, instructions: '' },
    { name: 'Digoxin', category: 'Cardiovascular', dosages: ['0.0625mg', '0.125mg', '0.25mg'], maxDaily: 0.5, instructions: '' },
    { name: 'Warfarin', category: 'Cardiovascular', dosages: ['1mg', '2mg', '3mg', '5mg', '7.5mg', '10mg'], maxDaily: 10, instructions: 'Take at the same time daily' },
    { name: 'Clopidogrel', category: 'Cardiovascular', dosages: ['75mg'], maxDaily: 75, instructions: '' },
    { name: 'Rivaroxaban', category: 'Cardiovascular', dosages: ['2.5mg', '10mg', '15mg', '20mg'], maxDaily: 20, instructions: 'Take with food' },
    { name: 'Apixaban', category: 'Cardiovascular', dosages: ['2.5mg', '5mg'], maxDaily: 10, instructions: '' },

    // ── Cholesterol ──
    { name: 'Atorvastatin', category: 'Cholesterol', dosages: ['10mg', '20mg', '40mg', '80mg'], maxDaily: 80, instructions: '' },
    { name: 'Simvastatin', category: 'Cholesterol', dosages: ['10mg', '20mg', '40mg'], maxDaily: 40, instructions: 'Take in the evening' },
    { name: 'Rosuvastatin', category: 'Cholesterol', dosages: ['5mg', '10mg', '20mg', '40mg'], maxDaily: 40, instructions: '' },
    { name: 'Pravastatin', category: 'Cholesterol', dosages: ['10mg', '20mg', '40mg', '80mg'], maxDaily: 80, instructions: '' },
    { name: 'Ezetimibe', category: 'Cholesterol', dosages: ['10mg'], maxDaily: 10, instructions: '' },
    { name: 'Fenofibrate', category: 'Cholesterol', dosages: ['48mg', '145mg', '160mg'], maxDaily: 160, instructions: 'Take with food' },

    // ── Diabetes ──
    { name: 'Metformin', category: 'Diabetes', dosages: ['250mg', '500mg', '850mg', '1000mg'], maxDaily: 2550, instructions: 'Take with food' },
    { name: 'Gliclazide', category: 'Diabetes', dosages: ['30mg', '40mg', '60mg', '80mg'], maxDaily: 320, instructions: 'Take with breakfast' },
    { name: 'Glimepiride', category: 'Diabetes', dosages: ['1mg', '2mg', '3mg', '4mg'], maxDaily: 8, instructions: 'Take with breakfast' },
    { name: 'Sitagliptin', category: 'Diabetes', dosages: ['25mg', '50mg', '100mg'], maxDaily: 100, instructions: '' },
    { name: 'Empagliflozin', category: 'Diabetes', dosages: ['10mg', '25mg'], maxDaily: 25, instructions: '' },
    { name: 'Dapagliflozin', category: 'Diabetes', dosages: ['5mg', '10mg'], maxDaily: 10, instructions: '' },
    { name: 'Pioglitazone', category: 'Diabetes', dosages: ['15mg', '30mg', '45mg'], maxDaily: 45, instructions: '' },
    { name: 'Insulin Glargine', category: 'Diabetes', dosages: ['10 units', '20 units', '30 units', '40 units'], maxDaily: 80, instructions: 'Inject at the same time daily' },

    // ── Gastrointestinal ──
    { name: 'Omeprazole', category: 'Gastrointestinal', dosages: ['10mg', '20mg', '40mg'], maxDaily: 40, instructions: 'Take before meals' },
    { name: 'Pantoprazole', category: 'Gastrointestinal', dosages: ['20mg', '40mg'], maxDaily: 80, instructions: 'Take before meals' },
    { name: 'Lansoprazole', category: 'Gastrointestinal', dosages: ['15mg', '30mg'], maxDaily: 30, instructions: 'Take before meals' },
    { name: 'Esomeprazole', category: 'Gastrointestinal', dosages: ['20mg', '40mg'], maxDaily: 40, instructions: 'Take before meals' },
    { name: 'Ranitidine', category: 'Gastrointestinal', dosages: ['150mg', '300mg'], maxDaily: 300, instructions: '' },
    { name: 'Domperidone', category: 'Gastrointestinal', dosages: ['10mg'], maxDaily: 30, instructions: 'Take before meals' },
    { name: 'Loperamide', category: 'Gastrointestinal', dosages: ['2mg'], maxDaily: 16, instructions: '' },
    { name: 'Lactulose', category: 'Gastrointestinal', dosages: ['10ml', '15ml', '20ml', '30ml'], maxDaily: 60, instructions: '' },

    // ── Antibiotics ──
    { name: 'Amoxicillin', category: 'Antibiotics', dosages: ['250mg', '500mg', '875mg'], maxDaily: 3000, instructions: 'Complete the full course' },
    { name: 'Azithromycin', category: 'Antibiotics', dosages: ['250mg', '500mg'], maxDaily: 500, instructions: '' },
    { name: 'Ciprofloxacin', category: 'Antibiotics', dosages: ['250mg', '500mg', '750mg'], maxDaily: 1500, instructions: 'Avoid dairy products' },
    { name: 'Doxycycline', category: 'Antibiotics', dosages: ['50mg', '100mg'], maxDaily: 200, instructions: 'Take with plenty of water' },
    { name: 'Clarithromycin', category: 'Antibiotics', dosages: ['250mg', '500mg'], maxDaily: 1000, instructions: '' },
    { name: 'Co-amoxiclav', category: 'Antibiotics', dosages: ['375mg', '625mg'], maxDaily: 1875, instructions: 'Take with food' },
    { name: 'Flucloxacillin', category: 'Antibiotics', dosages: ['250mg', '500mg'], maxDaily: 4000, instructions: 'Take on an empty stomach' },
    { name: 'Trimethoprim', category: 'Antibiotics', dosages: ['100mg', '200mg'], maxDaily: 400, instructions: '' },
    { name: 'Nitrofurantoin', category: 'Antibiotics', dosages: ['50mg', '100mg'], maxDaily: 400, instructions: 'Take with food' },
    { name: 'Cefalexin', category: 'Antibiotics', dosages: ['250mg', '500mg'], maxDaily: 4000, instructions: '' },

    // ── Mental Health ──
    { name: 'Sertraline', category: 'Mental Health', dosages: ['25mg', '50mg', '100mg', '150mg', '200mg'], maxDaily: 200, instructions: '' },
    { name: 'Fluoxetine', category: 'Mental Health', dosages: ['10mg', '20mg', '40mg', '60mg'], maxDaily: 80, instructions: '' },
    { name: 'Citalopram', category: 'Mental Health', dosages: ['10mg', '20mg', '40mg'], maxDaily: 40, instructions: '' },
    { name: 'Escitalopram', category: 'Mental Health', dosages: ['5mg', '10mg', '20mg'], maxDaily: 20, instructions: '' },
    { name: 'Venlafaxine', category: 'Mental Health', dosages: ['37.5mg', '75mg', '150mg', '225mg'], maxDaily: 375, instructions: 'Take with food' },
    { name: 'Duloxetine', category: 'Mental Health', dosages: ['20mg', '30mg', '60mg', '90mg', '120mg'], maxDaily: 120, instructions: '' },
    { name: 'Mirtazapine', category: 'Mental Health', dosages: ['15mg', '30mg', '45mg'], maxDaily: 45, instructions: 'Take at bedtime' },
    { name: 'Amitriptyline', category: 'Mental Health', dosages: ['10mg', '25mg', '50mg', '75mg'], maxDaily: 150, instructions: 'Take at bedtime' },
    { name: 'Diazepam', category: 'Mental Health', dosages: ['2mg', '5mg', '10mg'], maxDaily: 40, instructions: '' },
    { name: 'Lorazepam', category: 'Mental Health', dosages: ['0.5mg', '1mg', '2mg'], maxDaily: 10, instructions: '' },
    { name: 'Quetiapine', category: 'Mental Health', dosages: ['25mg', '50mg', '100mg', '200mg', '300mg'], maxDaily: 800, instructions: '' },
    { name: 'Olanzapine', category: 'Mental Health', dosages: ['2.5mg', '5mg', '10mg', '15mg', '20mg'], maxDaily: 20, instructions: '' },
    { name: 'Risperidone', category: 'Mental Health', dosages: ['0.5mg', '1mg', '2mg', '3mg', '4mg'], maxDaily: 16, instructions: '' },
    { name: 'Aripiprazole', category: 'Mental Health', dosages: ['2mg', '5mg', '10mg', '15mg', '30mg'], maxDaily: 30, instructions: '' },
    { name: 'Lithium', category: 'Mental Health', dosages: ['200mg', '400mg'], maxDaily: 1800, instructions: 'Stay hydrated' },

    // ── Respiratory ──
    { name: 'Salbutamol Inhaler', category: 'Respiratory', dosages: ['100mcg', '200mcg'], maxDaily: 800, instructions: 'Use as needed for breathing' },
    { name: 'Beclometasone Inhaler', category: 'Respiratory', dosages: ['50mcg', '100mcg', '200mcg', '250mcg'], maxDaily: 800, instructions: 'Rinse mouth after use' },
    { name: 'Fluticasone Inhaler', category: 'Respiratory', dosages: ['50mcg', '125mcg', '250mcg'], maxDaily: 1000, instructions: 'Rinse mouth after use' },
    { name: 'Montelukast', category: 'Respiratory', dosages: ['4mg', '5mg', '10mg'], maxDaily: 10, instructions: 'Take in the evening' },
    { name: 'Fexofenadine', category: 'Respiratory', dosages: ['30mg', '60mg', '120mg', '180mg'], maxDaily: 180, instructions: '' },
    { name: 'Cetirizine', category: 'Respiratory', dosages: ['5mg', '10mg'], maxDaily: 10, instructions: '' },
    { name: 'Loratadine', category: 'Respiratory', dosages: ['10mg'], maxDaily: 10, instructions: '' },
    { name: 'Prednisolone', category: 'Respiratory', dosages: ['1mg', '5mg', '10mg', '20mg', '25mg'], maxDaily: 60, instructions: 'Take with food' },
    { name: 'Prednisone', category: 'Respiratory', dosages: ['1mg', '2.5mg', '5mg', '10mg', '20mg', '50mg'], maxDaily: 80, instructions: 'Take with food' },

    // ── Neurological ──
    { name: 'Gabapentin', category: 'Neurological', dosages: ['100mg', '300mg', '400mg', '600mg', '800mg'], maxDaily: 3600, instructions: '' },
    { name: 'Pregabalin', category: 'Neurological', dosages: ['25mg', '50mg', '75mg', '100mg', '150mg', '200mg', '300mg'], maxDaily: 600, instructions: '' },
    { name: 'Carbamazepine', category: 'Neurological', dosages: ['100mg', '200mg', '400mg'], maxDaily: 1600, instructions: '' },
    { name: 'Levetiracetam', category: 'Neurological', dosages: ['250mg', '500mg', '750mg', '1000mg'], maxDaily: 3000, instructions: '' },
    { name: 'Lamotrigine', category: 'Neurological', dosages: ['25mg', '50mg', '100mg', '200mg'], maxDaily: 500, instructions: '' },
    { name: 'Sumatriptan', category: 'Neurological', dosages: ['50mg', '100mg'], maxDaily: 200, instructions: 'Take at onset of migraine' },

    // ── Thyroid ──
    { name: 'Levothyroxine', category: 'Thyroid', dosages: ['25mcg', '50mcg', '75mcg', '100mcg', '125mcg', '150mcg'], maxDaily: 300, instructions: 'Take on an empty stomach' },
    { name: 'Carbimazole', category: 'Thyroid', dosages: ['5mg', '10mg', '20mg'], maxDaily: 60, instructions: '' },

    // ── Vitamins & Supplements ──
    { name: 'Vitamin C', category: 'Vitamins', dosages: ['250mg', '500mg', '1000mg'], maxDaily: 2000, instructions: '' },
    { name: 'Vitamin D', category: 'Vitamins', dosages: ['400 IU', '1000 IU', '2000 IU', '5000 IU'], maxDaily: 10000, instructions: 'Take with a fatty meal' },
    { name: 'Vitamin B12', category: 'Vitamins', dosages: ['250mcg', '500mcg', '1000mcg'], maxDaily: 2000, instructions: '' },
    { name: 'Folic Acid', category: 'Vitamins', dosages: ['400mcg', '800mcg', '5mg'], maxDaily: 5, instructions: '' },
    { name: 'Iron (Ferrous Sulfate)', category: 'Vitamins', dosages: ['200mg', '325mg'], maxDaily: 650, instructions: 'Take on an empty stomach' },
    { name: 'Calcium', category: 'Vitamins', dosages: ['500mg', '600mg', '1000mg', '1200mg'], maxDaily: 2500, instructions: '' },
    { name: 'Magnesium', category: 'Vitamins', dosages: ['200mg', '250mg', '400mg', '500mg'], maxDaily: 800, instructions: '' },
    { name: 'Zinc', category: 'Vitamins', dosages: ['15mg', '25mg', '50mg'], maxDaily: 40, instructions: '' },
    { name: 'Omega-3 Fish Oil', category: 'Vitamins', dosages: ['500mg', '1000mg', '1200mg'], maxDaily: 3000, instructions: 'Take with food' },
    { name: 'Multivitamin', category: 'Vitamins', dosages: ['1 tablet'], maxDaily: 1, instructions: 'Take with food' },

    // ── Dementia & Alzheimer's ──
    { name: 'Donepezil (Aricept)', category: 'Dementia', dosages: ['5mg', '10mg', '23mg'], maxDaily: 23, instructions: 'Take at bedtime' },
    { name: 'Rivastigmine Capsule', category: 'Dementia', dosages: ['1.5mg', '3mg', '4.5mg', '6mg'], maxDaily: 12, instructions: 'Take with food' },
    { name: 'Rivastigmine Patch', category: 'Dementia', dosages: ['4.6mg/24hr', '9.5mg/24hr', '13.3mg/24hr'], maxDaily: 13.3, instructions: 'Apply to clean, dry skin; rotate placement daily' },
    { name: 'Galantamine', category: 'Dementia', dosages: ['4mg', '8mg', '12mg'], maxDaily: 24, instructions: 'Take with food' },
    { name: 'Galantamine ER', category: 'Dementia', dosages: ['8mg', '16mg', '24mg'], maxDaily: 24, instructions: 'Take with morning meal' },
    { name: 'Memantine (Namenda)', category: 'Dementia', dosages: ['5mg', '10mg'], maxDaily: 20, instructions: '' },
    { name: 'Memantine ER', category: 'Dementia', dosages: ['7mg', '14mg', '21mg', '28mg'], maxDaily: 28, instructions: 'Take once daily' },
    { name: 'Donepezil + Memantine (Namzaric)', category: 'Dementia', dosages: ['10mg/7mg', '10mg/14mg', '10mg/21mg', '10mg/28mg'], maxDaily: 28, instructions: 'Take in the evening' },
    { name: 'Brexpiprazole', category: 'Dementia', dosages: ['0.5mg', '1mg', '2mg'], maxDaily: 3, instructions: 'For agitation in Alzheimer\'s' },
    { name: 'Trazodone', category: 'Dementia', dosages: ['25mg', '50mg', '100mg', '150mg'], maxDaily: 400, instructions: 'Take at bedtime for sleep disturbances' },
    { name: 'Citalopram (for dementia)', category: 'Dementia', dosages: ['10mg', '20mg'], maxDaily: 20, instructions: 'For depression/anxiety in dementia' },
    { name: 'Haloperidol', category: 'Dementia', dosages: ['0.5mg', '1mg', '2mg', '5mg'], maxDaily: 5, instructions: 'Use lowest effective dose; for severe agitation only' },
    { name: 'Lecanemab (Leqembi)', category: 'Dementia', dosages: ['10mg/kg IV'], maxDaily: 10, instructions: 'Administered by infusion every 2 weeks' },
    { name: 'Aducanumab (Aduhelm)', category: 'Dementia', dosages: ['1mg/kg IV', '3mg/kg IV', '6mg/kg IV', '10mg/kg IV'], maxDaily: 10, instructions: 'Administered by infusion every 4 weeks' },
    { name: 'Donanemab (Kisunla)', category: 'Dementia', dosages: ['700mg IV', '1400mg IV'], maxDaily: 1400, instructions: 'Administered by infusion every 4 weeks' },

    // ── Other Common ──
    { name: 'Allopurinol', category: 'Other', dosages: ['100mg', '200mg', '300mg'], maxDaily: 800, instructions: 'Take after food' },
    { name: 'Colchicine', category: 'Other', dosages: ['0.5mg', '0.6mg'], maxDaily: 1.2, instructions: '' },
    { name: 'Methotrexate', category: 'Other', dosages: ['2.5mg', '5mg', '7.5mg', '10mg', '15mg'], maxDaily: 25, instructions: 'Take once weekly' },
    { name: 'Hydroxychloroquine', category: 'Other', dosages: ['200mg', '400mg'], maxDaily: 400, instructions: 'Take with food' },
    { name: 'Tamsulosin', category: 'Other', dosages: ['0.4mg'], maxDaily: 0.8, instructions: 'Take after food' },
    { name: 'Finasteride', category: 'Other', dosages: ['1mg', '5mg'], maxDaily: 5, instructions: '' },
    { name: 'Sildenafil', category: 'Other', dosages: ['25mg', '50mg', '100mg'], maxDaily: 100, instructions: 'Take as needed' },
];

// Hours/minutes for the time picker
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const AMPM = ['AM', 'PM'];

export default function AddMedicationScreen({ route, navigation }) {
    const prefillDate = route?.params?.selectedDate;
    const { addMedication, showToast } = useApp();
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState(prefillDate ? 'Specific dates' : 'Once daily');
    const [instructions, setInstructions] = useState('');
    const [selectedColor, setSelectedColor] = useState('blue');
    const [times, setTimes] = useState(['8:00 AM']);

    // Picker modal states
    const [showMedPicker, setShowMedPicker] = useState(false);
    const [showDosagePicker, setShowDosagePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editingTimeIndex, setEditingTimeIndex] = useState(0);
    const [medSearch, setMedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Time picker wheel state
    const [pickerHour, setPickerHour] = useState(8);
    const [pickerMinute, setPickerMinute] = useState('00');
    const [pickerAmPm, setPickerAmPm] = useState('AM');

    const initDates = {};
    if (prefillDate) {
        initDates[prefillDate] = { selected: true, selectedColor: colors.bluePrimary };
    }
    const [specificDates, setSpecificDates] = useState(initDates);

    // Get the selected medication's data from the DB
    const selectedMedData = useMemo(() => {
        return MEDICATION_DB.find(m => m.name.toLowerCase() === name.trim().toLowerCase());
    }, [name]);

    // Dosage options for the selected medication
    const dosageOptions = useMemo(() => {
        if (selectedMedData) return selectedMedData.dosages;
        return ['5mg', '10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1000mg'];
    }, [selectedMedData]);

    // Filtered medication list for search + category
    const filteredMeds = useMemo(() => {
        let list = MEDICATION_DB;
        if (selectedCategory !== 'All') {
            list = list.filter(m => m.category === selectedCategory);
        }
        if (medSearch.trim()) {
            const q = medSearch.toLowerCase();
            list = list.filter(m => m.name.toLowerCase().includes(q));
        }
        return list;
    }, [medSearch, selectedCategory]);

    const toggleDate = (dateString) => {
        setSpecificDates((prev) => {
            const next = { ...prev };
            if (next[dateString]) {
                delete next[dateString];
            } else {
                next[dateString] = { selected: true, selectedColor: colors.bluePrimary };
            }
            return next;
        });
    };

    const addTime = () => {
        setTimes(prev => [...prev, '12:00 PM']);
    };

    const removeTime = (idx) => {
        setTimes(prev => prev.filter((_, i) => i !== idx));
    };

    const openTimePicker = (idx) => {
        const existing = times[idx];
        const match = existing.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
            setPickerHour(parseInt(match[1]));
            setPickerMinute(match[2]);
            setPickerAmPm(match[3].toUpperCase());
        }
        setEditingTimeIndex(idx);
        setShowTimePicker(true);
    };

    const confirmTimePicker = () => {
        const timeStr = `${pickerHour}:${pickerMinute} ${pickerAmPm}`;
        setTimes(prev => prev.map((t, i) => i === editingTimeIndex ? timeStr : t));
        setShowTimePicker(false);
    };

    const selectMedication = (med) => {
        setName(med.name);
        if (med.dosages.length > 0) setDosage(med.dosages[0]);
        if (med.instructions) setInstructions(med.instructions);
        setShowMedPicker(false);
        setMedSearch('');
    };

    // Build the max dosage DB from our MEDICATION_DB for safety checks
    const maxDosageMap = useMemo(() => {
        const map = {};
        MEDICATION_DB.forEach(m => {
            if (m.maxDaily) map[m.name.toLowerCase()] = m.maxDaily;
        });
        return map;
    }, []);

    const handleSave = async () => {
        if (!name.trim()) {
            showToast('Please enter a medication name', 'error');
            return;
        }

        if (frequency === 'Specific dates' && Object.keys(specificDates).length === 0) {
            showToast('Please select at least one date', 'error');
            return;
        }

        // ── Dosage Safety Check ──
        const medNameLower = name.trim().toLowerCase();
        let maxDailyLimit = null;

        for (const [dbName, limit] of Object.entries(maxDosageMap)) {
            if (medNameLower.includes(dbName)) {
                maxDailyLimit = limit;
                break;
            }
        }

        if (maxDailyLimit !== null && dosage.trim()) {
            const dosageMatch = dosage.match(/(\d+\.?\d*)\s*(\S+)?/);
            if (dosageMatch) {
                const singleDose = parseFloat(dosageMatch[1]);
                const unit = dosageMatch[2] || 'mg';
                const dosesPerDay = times.filter(t => t.trim()).length || 1;
                const dailyTotal = singleDose * dosesPerDay;

                if (dailyTotal > maxDailyLimit) {
                    Alert.alert(
                        'Overdose Warning ⚠️',
                        `The safe maximum daily limit for ${name} is ${maxDailyLimit}${unit}.\n\nYou have scheduled ${singleDose}${unit} × ${dosesPerDay} doses = ${dailyTotal}${unit} per day.\n\nPlease reduce the dosage or frequency to safely proceed.`,
                        [{ text: 'OK', style: 'default' }]
                    );
                    return;
                }
            }
        }

        await addMedication({
            name: name.trim(),
            dosage: dosage.trim(),
            frequency,
            instructions: instructions.trim(),
            color: selectedColor,
            times: times.filter(t => t.trim()),
            specific_dates: frequency === 'Specific dates' ? Object.keys(specificDates) : [],
        });
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Add Medication</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Medication Name — Tap to pick */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Medication Name *</Text>
                        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowMedPicker(true)} activeOpacity={0.7}>
                            <Ionicons name="medical-outline" size={20} color={name ? colors.bluePrimary : colors.textMuted} />
                            <Text style={[styles.pickerButtonText, !name && { color: colors.textMuted }]}>
                                {name || 'Select a medication'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Dosage — Tap to pick */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Dosage</Text>
                        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDosagePicker(true)} activeOpacity={0.7}>
                            <Ionicons name="speedometer-outline" size={20} color={dosage ? colors.bluePrimary : colors.textMuted} />
                            <Text style={[styles.pickerButtonText, !dosage && { color: colors.textMuted }]}>
                                {dosage || 'Select dosage'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Frequency */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Frequency</Text>
                        <View style={styles.freqRow}>
                            {FREQUENCIES.map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[styles.freqChip, frequency === f && styles.freqChipActive]}
                                    onPress={() => setFrequency(f)}
                                >
                                    <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Specific Dates Calendar */}
                    {frequency === 'Specific dates' && (
                        <View style={styles.field}>
                            <Text style={styles.label}>Select Dates</Text>
                            <Calendar
                                onDayPress={day => toggleDate(day.dateString)}
                                markedDates={specificDates}
                                theme={{
                                    selectedDayBackgroundColor: colors.bluePrimary,
                                    todayTextColor: colors.bluePrimary,
                                    arrowColor: colors.bluePrimary,
                                }}
                                style={styles.calendar}
                            />
                        </View>
                    )}

                    {/* Color */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Color</Text>
                        <View style={styles.colorRow}>
                            {COLORS.map(c => (
                                <TouchableOpacity
                                    key={c.key}
                                    style={[styles.colorDot, { backgroundColor: c.color }, selectedColor === c.key && styles.colorDotSelected]}
                                    onPress={() => setSelectedColor(c.key)}
                                >
                                    {selectedColor === c.key && <Ionicons name="checkmark" size={16} color={colors.white} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Times — Tap to pick */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Times</Text>
                        {times.map((t, i) => (
                            <View key={i} style={styles.timeRow}>
                                <TouchableOpacity
                                    style={[styles.pickerButton, { flex: 1 }]}
                                    onPress={() => openTimePicker(i)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="time-outline" size={20} color={colors.bluePrimary} />
                                    <Text style={styles.pickerButtonText}>{t}</Text>
                                    <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                                {times.length > 1 && (
                                    <TouchableOpacity onPress={() => removeTime(i)}>
                                        <Ionicons name="close-circle" size={24} color={colors.redPrimary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addTimeBtn} onPress={addTime}>
                            <Ionicons name="add" size={18} color={colors.bluePrimary} />
                            <Text style={styles.addTimeText}>Add time</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Instructions */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Instructions</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="e.g. Take with food"
                            placeholderTextColor={colors.textMuted}
                            value={instructions}
                            onChangeText={setInstructions}
                            multiline
                        />
                    </View>

                    {/* Save */}
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                        <Ionicons name="checkmark-circle" size={22} color={colors.white} />
                        <Text style={styles.saveBtnText}>Save Medication</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Medication Picker Modal ── */}
            <Modal visible={showMedPicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Medication</Text>
                            <TouchableOpacity onPress={() => { setShowMedPicker(false); setMedSearch(''); setSelectedCategory('All'); }}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search medications..."
                                placeholderTextColor={colors.textMuted}
                                value={medSearch}
                                onChangeText={setMedSearch}
                                autoFocus
                            />
                            {medSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setMedSearch('')}>
                                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Category Filter */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryScrollContent}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                                    onPress={() => setSelectedCategory(cat)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <FlatList
                            data={filteredMeds}
                            keyExtractor={(item) => item.name}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.medListItem, name === item.name && styles.medListItemActive]}
                                    onPress={() => selectMedication(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.medListIcon, { backgroundColor: name === item.name ? colors.bluePrimary : colors.blueLight }]}>
                                        <Ionicons name="medical" size={18} color={name === item.name ? colors.white : colors.bluePrimary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.medListName, name === item.name && { color: colors.bluePrimary }]}>{item.name}</Text>
                                        <Text style={styles.medListDosages}>{item.dosages.join(' · ')}</Text>
                                        {selectedCategory === 'All' && <Text style={styles.medListCategory}>{item.category}</Text>}
                                    </View>
                                    {name === item.name && <Ionicons name="checkmark-circle" size={22} color={colors.bluePrimary} />}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptySearch}>
                                    <Ionicons name="search-outline" size={36} color={colors.textMuted} style={{ opacity: 0.4 }} />
                                    <Text style={styles.emptySearchText}>No medications found</Text>
                                    <TouchableOpacity
                                        style={styles.customMedBtn}
                                        onPress={() => {
                                            if (medSearch.trim()) {
                                                setName(medSearch.trim());
                                                setShowMedPicker(false);
                                                setMedSearch('');
                                            }
                                        }}
                                    >
                                        <Ionicons name="add-circle-outline" size={18} color={colors.bluePrimary} />
                                        <Text style={styles.customMedBtnText}>Use "{medSearch}" as custom name</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                            style={{ maxHeight: 400 }}
                        />
                    </View>
                </View>
            </Modal>

            {/* ── Dosage Picker Modal ── */}
            <Modal visible={showDosagePicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Dosage</Text>
                            <TouchableOpacity onPress={() => setShowDosagePicker(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dosageGrid}>
                            {dosageOptions.map((d) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.dosageChip, dosage === d && styles.dosageChipActive]}
                                    onPress={() => { setDosage(d); setShowDosagePicker(false); }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.dosageChipText, dosage === d && styles.dosageChipTextActive]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.orText}>or enter custom dosage</Text>
                        <View style={styles.customDosageRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="e.g. 750mg"
                                placeholderTextColor={colors.textMuted}
                                value={dosage}
                                onChangeText={setDosage}
                            />
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={() => setShowDosagePicker(false)}
                            >
                                <Text style={styles.confirmBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Time Picker Modal (Wheel) ── */}
            <Modal visible={showTimePicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Time</Text>
                            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.wheelRow}>
                            {/* Hour wheel */}
                            <View style={styles.wheelCol}>
                                <Text style={styles.wheelLabel}>Hour</Text>
                                <Picker
                                    selectedValue={pickerHour}
                                    onValueChange={setPickerHour}
                                    style={styles.wheel}
                                    itemStyle={styles.wheelItem}
                                >
                                    {HOURS.map(h => (
                                        <Picker.Item key={h} label={String(h)} value={h} />
                                    ))}
                                </Picker>
                            </View>

                            {/* Minute wheel */}
                            <View style={styles.wheelCol}>
                                <Text style={styles.wheelLabel}>Min</Text>
                                <Picker
                                    selectedValue={pickerMinute}
                                    onValueChange={setPickerMinute}
                                    style={styles.wheel}
                                    itemStyle={styles.wheelItem}
                                >
                                    {MINUTES.map(m => (
                                        <Picker.Item key={m} label={m} value={m} />
                                    ))}
                                </Picker>
                            </View>

                            {/* AM/PM wheel */}
                            <View style={styles.wheelCol}>
                                <Text style={styles.wheelLabel}> </Text>
                                <Picker
                                    selectedValue={pickerAmPm}
                                    onValueChange={setPickerAmPm}
                                    style={styles.wheel}
                                    itemStyle={styles.wheelItem}
                                >
                                    {AMPM.map(a => (
                                        <Picker.Item key={a} label={a} value={a} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* Preview */}
                        <Text style={styles.timePreview}>{pickerHour}:{pickerMinute} {pickerAmPm}</Text>

                        <TouchableOpacity style={styles.confirmFullBtn} onPress={confirmTimePicker} activeOpacity={0.8}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                            <Text style={styles.confirmFullBtnText}>Set Time</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
    title: { fontSize: fs.xl, fontWeight: '700', color: colors.textPrimary },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    field: { marginBottom: spacing.xl },
    label: { fontSize: fs.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: colors.white, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: fs.md, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },

    // Picker buttons (replacing text inputs)
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    pickerButtonText: {
        flex: 1,
        fontSize: fs.md,
        color: colors.textPrimary,
        fontWeight: '500',
    },

    freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    freqChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.bgSecondary },
    freqChipActive: { backgroundColor: colors.bluePrimary },
    freqText: { fontSize: fs.sm, fontWeight: '600', color: colors.textSecondary },
    freqTextActive: { color: colors.white },
    colorRow: { flexDirection: 'row', gap: spacing.md },
    colorDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    colorDotSelected: { borderWidth: 3, borderColor: colors.textPrimary },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    addTimeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
    addTimeText: { color: colors.bluePrimary, fontWeight: '600', fontSize: fs.sm },
    saveBtn: { backgroundColor: colors.bluePrimary, borderRadius: borderRadius.md, paddingVertical: spacing.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, ...shadows.md },
    saveBtnText: { color: colors.white, fontSize: fs.lg, fontWeight: '700' },
    calendar: { borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },

    // ── Modal styles ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: fs.xl,
        fontWeight: '700',
        color: colors.textPrimary,
    },

    // Medication list
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: fs.md,
        color: colors.textPrimary,
    },
    medListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
        gap: spacing.md,
    },
    medListItemActive: {
        backgroundColor: colors.blueLight,
    },
    medListIcon: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    medListName: {
        fontSize: fs.md,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    medListDosages: {
        fontSize: fs.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
    medListCategory: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.bluePrimary,
        marginTop: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.7,
    },
    categoryScroll: {
        maxHeight: 40,
        marginBottom: spacing.md,
    },
    categoryScrollContent: {
        gap: spacing.xs,
        paddingRight: spacing.md,
    },
    categoryChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    categoryChipActive: {
        backgroundColor: colors.blueLight,
        borderColor: colors.bluePrimary,
    },
    categoryChipText: {
        fontSize: fs.xs,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    categoryChipTextActive: {
        color: colors.bluePrimary,
    },
    emptySearch: {
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
        gap: spacing.sm,
    },
    emptySearchText: {
        fontSize: fs.md,
        color: colors.textMuted,
    },
    customMedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.blueLight,
        borderRadius: borderRadius.full,
    },
    customMedBtnText: {
        color: colors.bluePrimary,
        fontWeight: '600',
        fontSize: fs.sm,
    },

    // Dosage grid
    dosageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    dosageChip: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    dosageChipActive: {
        backgroundColor: colors.blueLight,
        borderColor: colors.bluePrimary,
    },
    dosageChipText: {
        fontSize: fs.md,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    dosageChipTextActive: {
        color: colors.bluePrimary,
    },
    orText: {
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: fs.sm,
        marginBottom: spacing.md,
    },
    customDosageRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    confirmBtn: {
        backgroundColor: colors.bluePrimary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
    },
    confirmBtnText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: fs.md,
    },

    // Time picker wheels
    wheelRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelCol: {
        flex: 1,
        alignItems: 'center',
    },
    wheelLabel: {
        fontSize: fs.sm,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    wheel: {
        width: '100%',
        height: 180,
    },
    wheelItem: {
        fontSize: 22,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    timePreview: {
        textAlign: 'center',
        fontSize: fs.xxl,
        fontWeight: '800',
        color: colors.bluePrimary,
        marginVertical: spacing.md,
    },
    confirmFullBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bluePrimary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
        ...shadows.md,
    },
    confirmFullBtnText: {
        color: colors.white,
        fontSize: fs.lg,
        fontWeight: '700',
    },
});
