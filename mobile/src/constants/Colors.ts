export const Colors = {
    // Brand
    primary: '#8B1A10',
    primaryLight: '#B83024',
    primaryDark: '#6B1208',
    primarySoft: 'rgba(139, 26, 16, 0.08)',

    // Neutrals
    secondary: '#F1F5F9',
    accent: '#B45309',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceDarker: '#F1F5F9',
    surfaceElevated: '#FFFFFF',

    // Text
    text: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textLight: '#94A3B8',

    // Borders & Dividers
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#E2E8F0',

    // Semantic
    success: '#10B981',
    successSoft: 'rgba(16, 185, 129, 0.1)',
    error: '#EF4444',
    errorSoft: 'rgba(239, 68, 68, 0.1)',
    warning: '#F59E0B',
    warningSoft: 'rgba(245, 158, 11, 0.1)',
    info: '#3B82F6',

    // Overlays & Glass
    glass: 'rgba(255, 255, 255, 0.85)',
    glassDark: 'rgba(15, 23, 42, 0.8)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.03)',

    // Shadows (used with shadowColor)
    shadow: '#0F172A',
};

// Consistent shadow presets
export const Shadows = {
    sm: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    md: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    lg: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 6,
    },
    colored: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    }),
};
