import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Animated,
    StatusBar,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize as fs, shadows, normalize, SCREEN_WIDTH, SCREEN_HEIGHT } from '../theme';

const width = SCREEN_WIDTH;

const SLIDES = [
    {
        id: '1',
        icon: 'pulse',
        iconBg: '#4A90D9',
        title: 'Welcome to MediMind',
        subtitle: 'Your Smart Medication Companion',
        description:
            'Never miss a dose again. MediMind helps you and your loved ones stay on top of medication schedules with smart reminders and real-time tracking.',
        features: [
            { icon: 'notifications-outline', text: 'Smart reminders' },
            { icon: 'calendar-outline', text: 'Daily schedules' },
            { icon: 'shield-checkmark-outline', text: 'Dosage safety checks' },
        ],
    },
    {
        id: '2',
        icon: 'people',
        iconBg: '#34C759',
        title: 'Care Together',
        subtitle: 'Connected Health for Families',
        description:
            'Whether you\'re managing your own medications or caring for a loved one, MediMind keeps everyone informed with real-time updates and adherence reports.',
        features: [
            { icon: 'person-outline', text: 'Patient & caretaker roles' },
            { icon: 'stats-chart-outline', text: 'Adherence reports' },
            { icon: 'link-outline', text: 'Invite code linking' },
        ],
    },
];

export default function WelcomeScreen({ navigation }) {
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);

    // Fade-in animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        }
    };

    const renderSlide = ({ item, index }) => {
        const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
        ];

        const iconScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp',
        });

        const textOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
        });

        const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [20, 0, 20],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.slide}>
                {/* Icon */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        { backgroundColor: item.iconBg, transform: [{ scale: iconScale }] },
                    ]}
                >
                    <Ionicons name={item.icon} size={52} color={colors.white} />
                </Animated.View>

                {/* Text content */}
                <Animated.View
                    style={[
                        styles.textContainer,
                        { opacity: textOpacity, transform: [{ translateY }] },
                    ]}
                >
                    <Text style={styles.slideTitle}>{item.title}</Text>
                    <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.slideDescription}>{item.description}</Text>

                    {/* Feature pills */}
                    <View style={styles.featuresContainer}>
                        {item.features.map((feature, i) => (
                            <View key={i} style={styles.featurePill}>
                                <Ionicons
                                    name={feature.icon}
                                    size={16}
                                    color={item.iconBg}
                                />
                                <Text style={styles.featureText}>{feature.text}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </View>
        );
    };

    // Dot indicators
    const renderDots = () => (
        <View style={styles.dotsContainer}>
            {SLIDES.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });
                const dotOpacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });
                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity: dotOpacity,
                                backgroundColor: colors.bluePrimary,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background decorative circles */}
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />

            <Animated.View
                style={[
                    styles.content,
                    { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                ]}
            >
                {/* Slides */}
                <FlatList
                    ref={flatListRef}
                    data={SLIDES}
                    renderItem={renderSlide}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    scrollEventThrottle={16}
                />

                {/* Dots */}
                {renderDots()}

                {/* Bottom section */}
                <View style={styles.bottomSection}>
                    {currentIndex < SLIDES.length - 1 ? (
                        /* Next button during slides */
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={handleNext}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                            <Ionicons name="arrow-forward" size={20} color={colors.white} />
                        </TouchableOpacity>
                    ) : (
                        /* Auth buttons on last slide */
                        <View style={styles.authButtons}>
                            <TouchableOpacity
                                style={styles.getStartedButton}
                                onPress={() => navigation.navigate('Login', { mode: 'register' })}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="person-add-outline" size={20} color={colors.white} />
                                <Text style={styles.getStartedText}>Create Account</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={() => navigation.navigate('Login', { mode: 'login' })}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="log-in-outline" size={20} color={colors.bluePrimary} />
                                <Text style={styles.loginButtonText}>I already have an account</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Skip on first slide */}
                    {currentIndex < SLIDES.length - 1 && (
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={() =>
                                flatListRef.current?.scrollToIndex({
                                    index: SLIDES.length - 1,
                                })
                            }
                        >
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    bgCircle1: {
        position: 'absolute',
        top: -80,
        right: -60,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: colors.blueLight,
        opacity: 0.5,
    },
    bgCircle2: {
        position: 'absolute',
        bottom: 100,
        left: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: colors.greenLight,
        opacity: 0.4,
    },
    content: {
        flex: 1,
    },
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    iconContainer: {
        width: normalize(110),
        height: normalize(110),
        borderRadius: normalize(32),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xxxl,
        ...shadows.lg,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    slideTitle: {
        fontSize: normalize(28),
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: spacing.sm,
    },
    slideSubtitle: {
        fontSize: fs.lg,
        fontWeight: '600',
        color: colors.bluePrimary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    slideDescription: {
        fontSize: fs.md,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xxl,
    },
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        ...shadows.sm,
    },
    featureText: {
        fontSize: fs.sm,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xxl,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    bottomSection: {
        paddingHorizontal: spacing.xxl,
        paddingBottom: Platform.OS === 'ios' ? 50 : 30,
        alignItems: 'center',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bluePrimary,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxxl,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        width: '100%',
        ...shadows.md,
    },
    nextButtonText: {
        color: colors.white,
        fontSize: fs.lg,
        fontWeight: '700',
    },
    skipButton: {
        marginTop: spacing.lg,
        paddingVertical: spacing.sm,
    },
    skipText: {
        color: colors.textMuted,
        fontSize: fs.md,
        fontWeight: '600',
    },
    authButtons: {
        width: '100%',
        gap: spacing.md,
    },
    getStartedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bluePrimary,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        ...shadows.md,
    },
    getStartedText: {
        color: colors.white,
        fontSize: fs.lg,
        fontWeight: '700',
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        borderColor: colors.bluePrimary,
        gap: spacing.sm,
        ...shadows.sm,
    },
    loginButtonText: {
        color: colors.bluePrimary,
        fontSize: fs.md,
        fontWeight: '700',
    },
});
