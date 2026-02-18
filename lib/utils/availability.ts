import { Reservation } from '@/types/database';

/**
 * Availability calculation utilities for restaurant booking system
 */

export interface TimeSlot {
    time: string;
    available: boolean;
    tablesAvailable: number;
}

export interface AvailabilityOptions {
    date: Date;
    partySize: number;
    turnoverMinutes?: number; // Default: 120 minutes (2 hours)
    openingTime?: string; // Default: '12:00'
    closingTime?: string; // Default: '23:00'
}

/**
 * Calculate table turnover time based on party size
 * Larger parties typically need more time
 */
export function calculateTurnoverTime(partySize: number, baseTurnover: number = 120): number {
    if (partySize <= 2) return baseTurnover;
    if (partySize <= 4) return baseTurnover + 30; // 2.5 hours
    if (partySize <= 6) return baseTurnover + 60; // 3 hours
    return baseTurnover + 90; // 3.5 hours for large parties
}

/**
 * Generate time slots for a given day
 * Returns 30-minute intervals between opening and closing time
 */
export function generateTimeSlots(
    openingTime: string = '12:00',
    closingTime: string = '23:00',
    intervalMinutes: number = 30
): string[] {
    const slots: string[] = [];
    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);

    let currentMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    while (currentMinutes < closeMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        currentMinutes += intervalMinutes;
    }

    return slots;
}

/**
 * Check if a table is available at a specific time
 * Considers existing reservations and turnover time
 */
export function isTableAvailable(
    tableId: string,
    requestedTime: Date,
    partySize: number,
    existingReservations: Reservation[],
    turnoverMinutes?: number
): boolean {
    const turnover = turnoverMinutes || calculateTurnoverTime(partySize);
    const requestedStart = requestedTime.getTime();
    const requestedEnd = requestedStart + turnover * 60 * 1000;

    // Check for conflicts with existing reservations
    const hasConflict = existingReservations.some(reservation => {
        if (reservation.table_id !== tableId) return false;
        if (reservation.status === 'cancelled') return false;

        const reservationStart = new Date(reservation.reservation_time).getTime();
        const reservationTurnover = calculateTurnoverTime(reservation.guest_count);
        const reservationEnd = reservationStart + reservationTurnover * 60 * 1000;

        // Check if time ranges overlap
        return (
            (requestedStart >= reservationStart && requestedStart < reservationEnd) ||
            (requestedEnd > reservationStart && requestedEnd <= reservationEnd) ||
            (requestedStart <= reservationStart && requestedEnd >= reservationEnd)
        );
    });

    return !hasConflict;
}

/**
 * Get all available tables for a specific time and party size
 */
export function getAvailableTables(
    allTables: Array<{ id: string; capacity: number }>,
    requestedTime: Date,
    partySize: number,
    existingReservations: Reservation[],
    turnoverMinutes?: number
): Array<{ id: string; capacity: number }> {
    return allTables.filter(table => {
        // Table must have sufficient capacity
        if (table.capacity < partySize) return false;

        // Table must be available at requested time
        return isTableAvailable(
            table.id,
            requestedTime,
            partySize,
            existingReservations,
            turnoverMinutes
        );
    });
}

/**
 * Get availability for all time slots on a given day
 */
export function getDayAvailability(
    date: Date,
    allTables: Array<{ id: string; capacity: number }>,
    existingReservations: Reservation[],
    partySize: number,
    options: {
        openingTime?: string;
        closingTime?: string;
        turnoverMinutes?: number;
    } = {}
): TimeSlot[] {
    const { openingTime = '12:00', closingTime = '23:00', turnoverMinutes } = options;
    const timeSlots = generateTimeSlots(openingTime, closingTime);

    return timeSlots.map(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotDate = new Date(date);
        slotDate.setHours(hours, minutes, 0, 0);

        const availableTables = getAvailableTables(
            allTables,
            slotDate,
            partySize,
            existingReservations,
            turnoverMinutes
        );

        return {
            time,
            available: availableTables.length > 0,
            tablesAvailable: availableTables.length,
        };
    });
}

/**
 * Check if a reservation conflicts with existing reservations
 */
export function hasReservationConflict(
    tableId: string,
    reservationTime: Date,
    partySize: number,
    existingReservations: Reservation[],
    excludeReservationId?: string
): boolean {
    const turnover = calculateTurnoverTime(partySize);
    const requestedStart = reservationTime.getTime();
    const requestedEnd = requestedStart + turnover * 60 * 1000;

    return existingReservations.some(reservation => {
        if (reservation.id === excludeReservationId) return false;
        if (reservation.table_id !== tableId) return false;
        if (reservation.status === 'cancelled') return false;

        const reservationStart = new Date(reservation.reservation_time).getTime();
        const reservationTurnover = calculateTurnoverTime(reservation.guest_count);
        const reservationEnd = reservationStart + reservationTurnover * 60 * 1000;

        return (
            (requestedStart >= reservationStart && requestedStart < reservationEnd) ||
            (requestedEnd > reservationStart && requestedEnd <= reservationEnd) ||
            (requestedStart <= reservationStart && requestedEnd >= reservationEnd)
        );
    });
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Get next available time slot for a party size
 */
export function getNextAvailableSlot(
    date: Date,
    allTables: Array<{ id: string; capacity: number }>,
    existingReservations: Reservation[],
    partySize: number,
    options: {
        openingTime?: string;
        closingTime?: string;
        turnoverMinutes?: number;
    } = {}
): string | null {
    const availability = getDayAvailability(date, allTables, existingReservations, partySize, options);
    const availableSlot = availability.find(slot => slot.available);
    return availableSlot ? availableSlot.time : null;
}
