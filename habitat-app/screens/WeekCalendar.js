import { addDays, format, getDate, isSameDay, startOfWeek, addWeeks } from 'date-fns';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const WeekCalendar = ({ date, onChange }) => {
    const [week, setWeek] = useState([]);
    const [selectedDate, setSelectedDate] = useState(date || new Date());
    const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
    const baseDateRef = useRef(date || new Date());
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Fade out, change week, then fade in
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true })
        ]).start();
        const baseDate = baseDateRef.current;
        const weekStart = addWeeks(startOfWeek(baseDate, { weekStartsOn: 1 }), weekOffset);
        const weekDays = getWeekDays(weekStart);
        setWeek(weekDays);
    }, [weekOffset]);

    // Automatically highlight today when the component loads
    useEffect(() => {
        if (!date) {
            onChange?.(new Date());
        }
    }, []);

    // Gesture handler for swiping
    const onGestureEvent = (event) => {
        if (event.nativeEvent.state === State.END) {
            const { translationX } = event.nativeEvent;
            if (translationX < -30) {
                // Swipe left: next week
                setWeekOffset((prev) => prev + 1);
            } else if (translationX > 30) {
                // Swipe right: previous week
                setWeekOffset((prev) => prev - 1);
            }
        }
    };

    // Get current week start for month label
    const baseDate = baseDateRef.current;
    const weekStart = addWeeks(startOfWeek(baseDate, { weekStartsOn: 1 }), weekOffset);
    const monthLabel = format(weekStart, 'MMMM yyyy');

    return (
        <PanGestureHandler onHandlerStateChange={onGestureEvent}>
            <View>
                <Text style={styles.monthLabel}>{monthLabel}</Text>
                <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                    {week.map((weekDay) => {
                        const textStyles = [styles.label];
                        const touchable = [styles.touchable];

                        const sameDay = isSameDay(weekDay.date, selectedDate);
                        if (sameDay) {
                            textStyles.push(styles.selectedLabel);
                            touchable.push(styles.selectedTouchable);
                        }

                        return (
                            <View style={styles.weekDayItem} key={weekDay.formatted + weekDay.day}>
                                <Text style={styles.weekDayText}>{weekDay.formatted}</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedDate(weekDay.date);
                                        onChange?.(weekDay.date);
                                    }}
                                    style={touchable}
                                >
                                    <Text style={textStyles}>{weekDay.day}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </Animated.View>
            </View>
        </PanGestureHandler>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    weekDayText: {
        color: 'gray',
        marginBottom: 5,
    },
    label: {
        fontSize: 14,
        color: 'black',
        textAlign: 'center',
    },
    selectedLabel: {
        color: 'white',
    },
    touchable: {
        borderRadius: 20,
        padding: 7.5,
        height: 35,
        width: 35,
    },
    selectedTouchable: {
        backgroundColor: 'green',
    },
    weekDayItem: {
        alignItems: 'center',
    },
    monthLabel: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#333',
    },
});

// Helper: Get all 7 days of the week starting Monday
export const getWeekDays = (date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const final = [];

    for (let i = 0; i < 7; i++) {
        const currentDate = addDays(start, i);
        final.push({
            formatted: format(currentDate, 'EEE'),
            date: currentDate,
            day: getDate(currentDate),
        });
    }

    return final;
};

export default WeekCalendar;
