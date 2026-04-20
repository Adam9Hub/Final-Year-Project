import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import SuccessScreen from '../screens/SuccessScreen';
import PatientScheduleScreen from '../screens/PatientScheduleScreen';
import PatientSettingsScreen from '../screens/PatientSettingsScreen';
import CaretakerDashboardScreen from '../screens/CaretakerDashboardScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import CaretakerReportsScreen from '../screens/CaretakerReportsScreen';
import CaretakerSettingsScreen from '../screens/CaretakerSettingsScreen';
import CaretakerMedsScreen from '../screens/CaretakerMedsScreen';
import CaretakerFamilyScreen from '../screens/CaretakerFamilyScreen';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const PatientTab = createBottomTabNavigator();
const CaretakerTab = createBottomTabNavigator();
const IndependentTab = createBottomTabNavigator();
const PatientStack = createNativeStackNavigator();
const CaretakerStack = createNativeStackNavigator();
const IndependentStack = createNativeStackNavigator();

function PatientTabs() {
    const insets = useSafeAreaInsets();
    return (
        <PatientTab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Schedule') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.bluePrimary,
                tabBarInactiveTintColor: colors.textMuted,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopColor: colors.borderLight,
                    paddingBottom: Math.max(insets.bottom, 10),
                    height: 60 + Math.max(insets.bottom, 10),
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            })}
        >
            <PatientTab.Screen name="Home" component={PatientHomeScreen} />
            <PatientTab.Screen name="Schedule" component={PatientScheduleScreen} />
            <PatientTab.Screen name="Settings" component={PatientSettingsScreen} />
        </PatientTab.Navigator>
    );
}

function IndependentTabs() {
    const insets = useSafeAreaInsets();
    return (
        <IndependentTab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Meds') iconName = focused ? 'medical' : 'medical-outline';
                    else if (route.name === 'Reports') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.bluePrimary,
                tabBarInactiveTintColor: colors.textMuted,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopColor: colors.borderLight,
                    paddingBottom: Math.max(insets.bottom, 10),
                    height: 60 + Math.max(insets.bottom, 10),
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            })}
        >
            <IndependentTab.Screen name="Home" component={PatientHomeScreen} />
            <IndependentTab.Screen name="Meds" component={CaretakerMedsScreen} />
            <IndependentTab.Screen name="Reports" component={CaretakerReportsScreen} />
            <IndependentTab.Screen name="Settings" component={PatientSettingsScreen} />
        </IndependentTab.Navigator>
    );
}

function CaretakerTabs() {
    const insets = useSafeAreaInsets();
    return (
        <CaretakerTab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Meds') iconName = focused ? 'medical' : 'medical-outline';
                    else if (route.name === 'Family') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'CaretakerSettings') iconName = focused ? 'settings' : 'settings-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.bluePrimary,
                tabBarInactiveTintColor: colors.textMuted,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopColor: colors.borderLight,
                    paddingBottom: Math.max(insets.bottom, 10) + 8,
                    height: 65 + Math.max(insets.bottom, 10) + 8,
                    paddingTop: 10,
                    paddingHorizontal: 30,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            })}
        >
            <CaretakerTab.Screen name="Dashboard" component={CaretakerDashboardScreen} />
            <CaretakerTab.Screen name="Meds" component={CaretakerMedsScreen} />
            <CaretakerTab.Screen name="Family" component={CaretakerFamilyScreen} />
            <CaretakerTab.Screen name="CaretakerSettings" component={CaretakerSettingsScreen} options={{ tabBarLabel: 'Settings' }} />
        </CaretakerTab.Navigator>
    );
}

function PatientStackNav() {
    return (
        <PatientStack.Navigator screenOptions={{ headerShown: false }}>
            <PatientStack.Screen name="PatientTabs" component={PatientTabs} />
            <PatientStack.Screen name="Success" component={SuccessScreen} />
        </PatientStack.Navigator>
    );
}

function CaretakerStackNav() {
    return (
        <CaretakerStack.Navigator screenOptions={{ headerShown: false }}>
            <CaretakerStack.Screen name="CaretakerTabs" component={CaretakerTabs} />
            <CaretakerStack.Screen name="AddMedication" component={AddMedicationScreen} />
            <CaretakerStack.Screen name="Reports" component={CaretakerReportsScreen} />
        </CaretakerStack.Navigator>
    );
}

function IndependentStackNav() {
    return (
        <IndependentStack.Navigator screenOptions={{ headerShown: false }}>
            <IndependentStack.Screen name="IndependentTabs" component={IndependentTabs} />
            <IndependentStack.Screen name="Success" component={SuccessScreen} />
            <IndependentStack.Screen name="AddMedication" component={AddMedicationScreen} />
            <IndependentStack.Screen name="PatientSchedule" component={PatientScheduleScreen} />
        </IndependentStack.Navigator>
    );
}

function WelcomeStackNav() {
    const { completeWelcome } = useApp();

    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Welcome">
                {(props) => (
                    <WelcomeScreen
                        {...props}
                        navigation={{
                            ...props.navigation,
                            navigate: (screen, params) => {
                                completeWelcome();
                                props.navigation.navigate(screen, params);
                            },
                        }}
                    />
                )}
            </AuthStack.Screen>
            <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useApp();

    if (isLoading) return null;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth" component={WelcomeStackNav} />
                ) : user.role === 'patient' ? (
                    <Stack.Screen name="PatientMain" component={PatientStackNav} />
                ) : user.role === 'independent' ? (
                    <Stack.Screen name="IndependentMain" component={IndependentStackNav} />
                ) : (
                    <Stack.Screen name="CaretakerMain" component={CaretakerStackNav} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
