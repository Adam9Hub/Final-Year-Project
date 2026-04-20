import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import RoleToggle from '../components/RoleToggle';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize } from '../theme';
import { API_BASE_URL } from '../config';

export default function LoginScreen({ route }) {
    const { login, showToast } = useApp();
    const initialMode = route?.params?.mode === 'register';
    const [isSignUp, setIsSignUp] = useState(initialMode);
    const [role, setRole] = useState('patient');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                if (!name || !email || !password) {
                    setError('Please fill in all fields');
                    setIsLoading(false);
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || 'Registration failed');
                    setIsLoading(false);
                    return;
                }
                login(data);
                showToast(`Welcome to MediMind, ${data.name}!`, 'success');
            } else {
                if (!email || !password) {
                    setError('Please enter your email and password');
                    setIsLoading(false);
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || 'Login failed');
                    setIsLoading(false);
                    return;
                }
                login(data);
                showToast(`Welcome back, ${data.name}!`, 'success');
            }
            setIsLoading(false);
        } catch {
            setError('Could not connect to the server. Check your API_BASE_URL in config.js');
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={styles.logo}>
                    <View style={styles.logoIcon}>
                        <Ionicons name="pulse" size={36} color={colors.white} />
                    </View>
                    <Text style={styles.appName}>MediMind</Text>
                    <Text style={styles.tagline}>Smart medication management{'\n'}for you and your loved ones</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    {/* Mode toggle */}
                    <View style={styles.modeToggle}>
                        <TouchableOpacity
                            style={[styles.modeBtn, !isSignUp && styles.modeBtnActive]}
                            onPress={() => { setIsSignUp(false); setError(''); }}
                        >
                            <Text style={[styles.modeBtnText, !isSignUp && styles.modeBtnTextActive]}>Sign In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, isSignUp && styles.modeBtnActive]}
                            onPress={() => { setIsSignUp(true); setError(''); }}
                        >
                            <Text style={[styles.modeBtnText, isSignUp && styles.modeBtnTextActive]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Role */}
                    <View style={styles.field}>
                        <Text style={styles.label}>I am a</Text>
                        <RoleToggle value={role} onChange={setRole} />
                    </View>

                    {/* Name (sign up) */}
                    {isSignUp && (
                        <View style={styles.field}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrap}>
                                <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={colors.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>
                    )}

                    {/* Email */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder={isSignUp ? 'your@email.com' : 'margaret@email.com'}
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={colors.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Error */}
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {/* Forgot password */}
                    {!isSignUp && (
                        <TouchableOpacity onPress={() => showToast('Password reset link sent to your email', 'success')}>
                            <Text style={styles.forgot}>Forgot password?</Text>
                        </TouchableOpacity>
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submit, isLoading && styles.submitDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.submitText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Hint */}
                    <View style={styles.hint}>
                        <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.hintText}>
                            {isSignUp ? 'Create an account to get started' : 'Default: margaret@email.com / password123'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    logo: {
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },
    logoIcon: {
        width: normalize(64),
        height: normalize(64),
        borderRadius: normalize(20),
        backgroundColor: colors.bluePrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        ...shadows.lg,
    },
    appName: {
        fontSize: normalize(32),
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: fs.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
        lineHeight: 22,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        ...shadows.md,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.bgSecondary,
        borderRadius: borderRadius.md,
        padding: 3,
        marginBottom: spacing.xl,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: spacing.sm + 2,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    modeBtnActive: {
        backgroundColor: colors.white,
        ...shadows.sm,
    },
    modeBtnText: {
        fontSize: fs.md,
        fontWeight: '600',
        color: colors.textMuted,
    },
    modeBtnTextActive: {
        color: colors.textPrimary,
    },
    field: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fs.sm,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md + 2,
        fontSize: fs.md,
        color: colors.textPrimary,
    },
    error: {
        color: colors.redPrimary,
        fontSize: fs.sm,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    forgot: {
        color: colors.bluePrimary,
        fontSize: fs.sm,
        fontWeight: '600',
        textAlign: 'right',
        marginBottom: spacing.lg,
    },
    submit: {
        backgroundColor: colors.bluePrimary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
        ...shadows.md,
    },
    submitDisabled: {
        opacity: 0.7,
    },
    submitText: {
        color: colors.white,
        fontSize: fs.lg,
        fontWeight: '700',
    },
    hint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.lg,
    },
    hintText: {
        fontSize: fs.xs,
        color: colors.textMuted,
    },
});
