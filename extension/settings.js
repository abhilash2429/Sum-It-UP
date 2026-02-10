// ═══════════════════════════════════════════════════════════
// Settings Management Module
// ═══════════════════════════════════════════════════════════

const DEFAULT_SETTINGS = {
    theme: 'dark',              // 'light' or 'dark'
    length: 'medium',           // 'short', 'medium', 'long', 'xl'
    fontSize: 'medium',         // 'small', 'medium', 'large'
    colorPalette: 'ocean'       // 'slate', 'cedar', 'mint', 'ocean', 'ember', 'iris'
};

// Color palettes extracted from reference image
const COLOR_PALETTES = {
    slate: {
        name: 'Slate',
        primary: '#516170',
        secondary: '#7b929e',
        accent: '#364752'
    },
    cedar: {
        name: 'Cedar',
        primary: '#c4622d',
        secondary: '#e8a87c',
        accent: '#dd9a5a'
    },
    mint: {
        name: 'Mint',
        primary: '#37a987',
        secondary: '#76d7c4',
        accent: '#50c4a8'
    },
    ocean: {
        name: 'Ocean',
        primary: '#1e88e5',
        secondary: '#4fc3f7',
        accent: '#29b6f6'
    },
    ember: {
        name: 'Ember',
        primary: '#d84315',
        secondary: '#ff8a65',
        accent: '#ff7043'
    },
    iris: {
        name: 'Iris',
        primary: '#5e35b1',
        secondary: '#b39ddb',
        accent: '#9575cd'
    }
};

class SettingsManager {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.listeners = [];
    }

    // Load settings from chrome.storage
    async load() {
        try {
            const stored = await chrome.storage.local.get('settings');
            if (stored.settings) {
                this.settings = { ...DEFAULT_SETTINGS, ...stored.settings };

                // Migrate legacy length values
                if (this.settings.length === 'brief') this.settings.length = 'short';
                if (this.settings.length === 'comprehensive') this.settings.length = 'long';

                // Save back if migration happened
                if (stored.settings.length !== this.settings.length) {
                    await this.save();
                }
            }
            console.log('[Settings] Loaded:', this.settings);
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        return this.settings;
    }

    // Save settings to chrome.storage
    async save() {
        try {
            await chrome.storage.local.set({ settings: this.settings });
            this.notifyListeners();
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    // Get a specific setting
    get(key) {
        return this.settings[key];
    }

    // Set a specific setting
    async set(key, value) {
        console.log(`[Settings] Setting ${key} = ${value}`);
        this.settings[key] = value;
        await this.save();
    }

    // Apply settings to the UI
    apply() {
        const root = document.documentElement;

        // Apply theme
        root.setAttribute('data-theme', this.settings.theme);

        // Apply font size
        const fontSizes = {
            small: '13px',
            medium: '14px',
            large: '16px'
        };
        root.style.setProperty('--base-font-size', fontSizes[this.settings.fontSize]);

        // Apply color palette
        const palette = COLOR_PALETTES[this.settings.colorPalette];
        if (palette) {
            root.style.setProperty('--accent', palette.primary);
            root.style.setProperty('--accent-hover', palette.secondary);
            root.style.setProperty('--accent-muted', palette.accent);
        }

        this.currentPalette = palette;
        console.log('[Settings] Applied:', this.settings);
    }

    // Register listener for settings changes
    onChange(callback) {
        this.listeners.push(callback);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(cb => cb(this.settings));
    }

    // Get all available color palettes
    getPalettes() {
        return COLOR_PALETTES;
    }
}

// Export singleton instance
const settingsManager = new SettingsManager();
