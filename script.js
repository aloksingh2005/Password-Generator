/**
 * Password Generator & Strength Checker
 * Advanced Frontend-Only Password Tool
 * Features: Generation, Strength Analysis, Local Storage, Dark Mode
 */

class PasswordGenerator {
    constructor() {
        // Character sets for password generation
        this.charSets = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
            similar: '0Oo1lI',
            ambiguous: '{}[]()\/\\"\'\`~,;.<>'
        };

        // DOM elements
        this.elements = {};
        this.initializeElements();

        // State
        this.isPasswordVisible = false;
        this.passwordHistory = this.loadPasswordHistory();

        // Initialize the application
        this.init();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        const elementIds = [
            'darkModeToggle', 'lengthSlider', 'lengthValue',
            'includeUppercase', 'includeLowercase', 'includeNumbers',
            'includeSymbols', 'excludeSimilar', 'excludeAmbiguous',
            'generateButton', 'generatedPassword', 'copyButton',
            'regenerateButton', 'strengthInput', 'toggleVisibility',
            'visibilityIcon', 'strengthProgress', 'strengthLabel',
            'strengthScore', 'lengthCriterion', 'uppercaseCriterion',
            'lowercaseCriterion', 'numberCriterion', 'symbolCriterion',
            'lengthBonusCriterion', 'strengthSuggestions', 'suggestionsList',
            'passwordHistory', 'clearHistoryButton', 'toast'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    /**
     * Initialize application
     */
    init() {
        this.setupEventListeners();
        this.loadTheme();
        this.generatePassword();
        this.renderPasswordHistory();

        // Set initial length display
        this.elements.lengthValue.textContent = this.elements.lengthSlider.value;
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Dark mode toggle
        this.elements.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Length slider
        this.elements.lengthSlider.addEventListener('input', (e) => {
            this.elements.lengthValue.textContent = e.target.value;
        });

        // Generate button
        this.elements.generateButton.addEventListener('click', () => this.generatePassword());

        // Copy button
        this.elements.copyButton.addEventListener('click', () => this.copyToClipboard());

        // Regenerate button
        this.elements.regenerateButton.addEventListener('click', () => this.generatePassword());

        // Strength checker input
        this.elements.strengthInput.addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        // Password visibility toggle
        this.elements.toggleVisibility.addEventListener('click', () => this.togglePasswordVisibility());

        // Clear history button
        this.elements.clearHistoryButton.addEventListener('click', () => this.clearPasswordHistory());

        // Auto-generate on option change
        const checkboxes = [
            'includeUppercase', 'includeLowercase', 'includeNumbers',
            'includeSymbols', 'excludeSimilar', 'excludeAmbiguous'
        ];

        checkboxes.forEach(id => {
            this.elements[id].addEventListener('change', () => {
                if (this.elements.generatedPassword.value) {
                    this.generatePassword();
                }
            });
        });

        // Auto-generate on length change
        this.elements.lengthSlider.addEventListener('change', () => {
            if (this.elements.generatedPassword.value) {
                this.generatePassword();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'g':
                        e.preventDefault();
                        this.generatePassword();
                        break;
                    case 'c':
                        if (this.elements.generatedPassword.value) {
                            e.preventDefault();
                            this.copyToClipboard();
                        }
                        break;
                }
            }
        });
    }

    /**
     * Generate a random password based on selected options
     */
    generatePassword() {
        const options = this.getPasswordOptions();

        if (!this.validateOptions(options)) {
            this.showToast('Please select at least one character type!', 'error');
            return;
        }

        const password = this.createPassword(options);
        this.elements.generatedPassword.value = password;

        // Add to history
        this.addToHistory(password);

        // Check strength of generated password
        this.checkPasswordStrength(password);

        // Show success message
        this.showToast('Password generated successfully!', 'success');
    }

    /**
     * Get current password generation options
     */
    getPasswordOptions() {
        return {
            length: parseInt(this.elements.lengthSlider.value),
            includeUppercase: this.elements.includeUppercase.checked,
            includeLowercase: this.elements.includeLowercase.checked,
            includeNumbers: this.elements.includeNumbers.checked,
            includeSymbols: this.elements.includeSymbols.checked,
            excludeSimilar: this.elements.excludeSimilar.checked,
            excludeAmbiguous: this.elements.excludeAmbiguous.checked
        };
    }

    /**
     * Validate password generation options
     */
    validateOptions(options) {
        return options.includeUppercase || options.includeLowercase ||
            options.includeNumbers || options.includeSymbols;
    }

    /**
     * Create password string based on options
     */
    createPassword(options) {
        let charset = '';
        let guaranteedChars = [];

        // Build character set and ensure at least one character from each selected type
        if (options.includeUppercase) {
            let upperChars = this.charSets.uppercase;
            if (options.excludeSimilar) {
                upperChars = this.removeChars(upperChars, this.charSets.similar);
            }
            charset += upperChars;
            guaranteedChars.push(this.getRandomChar(upperChars));
        }

        if (options.includeLowercase) {
            let lowerChars = this.charSets.lowercase;
            if (options.excludeSimilar) {
                lowerChars = this.removeChars(lowerChars, this.charSets.similar);
            }
            charset += lowerChars;
            guaranteedChars.push(this.getRandomChar(lowerChars));
        }

        if (options.includeNumbers) {
            let numberChars = this.charSets.numbers;
            if (options.excludeSimilar) {
                numberChars = this.removeChars(numberChars, this.charSets.similar);
            }
            charset += numberChars;
            guaranteedChars.push(this.getRandomChar(numberChars));
        }

        if (options.includeSymbols) {
            let symbolChars = this.charSets.symbols;
            if (options.excludeAmbiguous) {
                symbolChars = this.removeChars(symbolChars, this.charSets.ambiguous);
            }
            charset += symbolChars;
            guaranteedChars.push(this.getRandomChar(symbolChars));
        }

        // Generate remaining characters
        const remainingLength = options.length - guaranteedChars.length;
        const randomChars = [];

        for (let i = 0; i < remainingLength; i++) {
            randomChars.push(this.getRandomChar(charset));
        }

        // Combine and shuffle all characters
        const allChars = [...guaranteedChars, ...randomChars];
        return this.shuffleArray(allChars).join('');
    }

    /**
     * Remove specified characters from a character set
     */
    removeChars(charset, charsToRemove) {
        return charset.split('').filter(char => !charsToRemove.includes(char)).join('');
    }

    /**
     * Get a cryptographically secure random character from charset
     */
    getRandomChar(charset) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return charset[array[0] % charset.length];
    }

    /**
     * Shuffle array using Fisher-Yates algorithm with crypto random
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const randomArray = new Uint32Array(1);
            crypto.getRandomValues(randomArray);
            const j = randomArray[0] % (i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Copy password to clipboard
     */
    async copyToClipboard() {
        const password = this.elements.generatedPassword.value;

        if (!password) {
            this.showToast('No password to copy!', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(password);
            this.showToast('Password copied to clipboard!', 'success');

            // Update button text temporarily
            const originalText = this.elements.copyButton.innerHTML;
            this.elements.copyButton.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Copied!</span>';

            setTimeout(() => {
                this.elements.copyButton.innerHTML = originalText;
            }, 2000);

        } catch (err) {
            // Fallback for older browsers
            this.fallbackCopyToClipboard(password);
        }
    }

    /**
     * Fallback copy method for older browsers
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showToast('Password copied to clipboard!', 'success');
        } catch (err) {
            this.showToast('Failed to copy password!', 'error');
        }

        document.body.removeChild(textArea);
    }

    /**
     * Check password strength and update UI
     */
    checkPasswordStrength(password) {
        if (!password) {
            this.resetStrengthMeter();
            return;
        }

        const analysis = this.analyzePassword(password);
        this.updateStrengthMeter(analysis);
        this.updateCriteria(password, analysis);
        this.updateSuggestions(analysis);
    }

    /**
     * Analyze password strength
     */
    analyzePassword(password) {
        const analysis = {
            length: password.length,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSymbols: /[^A-Za-z0-9]/.test(password),
            hasRepeated: this.hasRepeatedChars(password),
            hasSequential: this.hasSequentialChars(password),
            entropy: this.calculateEntropy(password),
            score: 0,
            level: 'Very Weak'
        };

        // Calculate score
        analysis.score = this.calculateStrengthScore(analysis);
        analysis.level = this.getStrengthLevel(analysis.score);

        return analysis;
    }

    /**
     * Check for repeated characters
     */
    hasRepeatedChars(password) {
        const chars = password.split('');
        const repeated = chars.filter((char, index) => {
            return chars.indexOf(char) !== index;
        });
        return repeated.length > 0;
    }

    /**
     * Check for sequential characters
     */
    hasSequentialChars(password) {
        const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

        for (let seq of sequences) {
            for (let i = 0; i < seq.length - 2; i++) {
                const subseq = seq.substring(i, i + 3);
                if (password.toLowerCase().includes(subseq) ||
                    password.toLowerCase().includes(subseq.split('').reverse().join(''))) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Calculate password entropy
     */
    calculateEntropy(password) {
        let charset = 0;

        if (/[a-z]/.test(password)) charset += 26;
        if (/[A-Z]/.test(password)) charset += 26;
        if (/\d/.test(password)) charset += 10;
        if (/[^A-Za-z0-9]/.test(password)) charset += 32;

        return password.length * Math.log2(charset);
    }

    /**
     * Calculate strength score (0-100)
     */
    calculateStrengthScore(analysis) {
        let score = 0;

        // Length scoring
        if (analysis.length >= 8) score += 25;
        if (analysis.length >= 12) score += 15;
        if (analysis.length >= 16) score += 10;

        // Character type scoring
        if (analysis.hasUppercase) score += 10;
        if (analysis.hasLowercase) score += 10;
        if (analysis.hasNumbers) score += 10;
        if (analysis.hasSymbols) score += 15;

        // Entropy bonus
        if (analysis.entropy > 40) score += 10;
        if (analysis.entropy > 60) score += 5;

        // Penalties
        if (analysis.hasRepeated) score -= 10;
        if (analysis.hasSequential) score -= 15;
        if (analysis.length < 8) score -= 20;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Get strength level based on score
     */
    getStrengthLevel(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Strong';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        if (score >= 20) return 'Weak';
        return 'Very Weak';
    }

    /**
     * Update strength meter display
     */
    updateStrengthMeter(analysis) {
        const progress = this.elements.strengthProgress;
        const label = this.elements.strengthLabel;
        const score = this.elements.strengthScore;

        // Update progress bar
        progress.style.width = `${analysis.score}%`;

        // Remove existing strength classes
        progress.className = 'strength-progress';

        // Add appropriate strength class
        const levelClass = `strength-${analysis.level.toLowerCase().replace(' ', '-')}`;
        progress.classList.add(levelClass);

        // Update labels
        label.textContent = analysis.level;
        score.textContent = `${analysis.score}/100`;

        // Add animation
        progress.style.transition = 'width 0.5s ease, background-color 0.3s ease';
    }

    /**
     * Reset strength meter
     */
    resetStrengthMeter() {
        this.elements.strengthProgress.style.width = '0%';
        this.elements.strengthProgress.className = 'strength-progress';
        this.elements.strengthLabel.textContent = 'Enter a password to check';
        this.elements.strengthScore.textContent = '';

        // Reset all criteria
        const criteria = [
            'lengthCriterion', 'uppercaseCriterion', 'lowercaseCriterion',
            'numberCriterion', 'symbolCriterion', 'lengthBonusCriterion'
        ];

        criteria.forEach(id => {
            this.elements[id].classList.remove('met');
        });

        // Hide suggestions
        this.elements.strengthSuggestions.style.display = 'none';
    }

    /**
     * Update criteria display
     */
    updateCriteria(password, analysis) {
        const criteria = {
            lengthCriterion: password.length >= 8,
            uppercaseCriterion: analysis.hasUppercase,
            lowercaseCriterion: analysis.hasLowercase,
            numberCriterion: analysis.hasNumbers,
            symbolCriterion: analysis.hasSymbols,
            lengthBonusCriterion: password.length >= 12
        };

        Object.keys(criteria).forEach(id => {
            const element = this.elements[id];
            if (criteria[id]) {
                element.classList.add('met');
            } else {
                element.classList.remove('met');
            }
        });
    }

    /**
     * Update suggestions display
     */
    updateSuggestions(analysis) {
        const suggestions = [];

        if (analysis.length < 8) {
            suggestions.push('Use at least 8 characters');
        }
        if (analysis.length < 12) {
            suggestions.push('Use 12+ characters for better security');
        }
        if (!analysis.hasUppercase) {
            suggestions.push('Add uppercase letters');
        }
        if (!analysis.hasLowercase) {
            suggestions.push('Add lowercase letters');
        }
        if (!analysis.hasNumbers) {
            suggestions.push('Add numbers');
        }
        if (!analysis.hasSymbols) {
            suggestions.push('Add special characters');
        }
        if (analysis.hasRepeated) {
            suggestions.push('Avoid repeated characters');
        }
        if (analysis.hasSequential) {
            suggestions.push('Avoid sequential characters');
        }

        const suggestionsList = this.elements.suggestionsList;
        const suggestionsContainer = this.elements.strengthSuggestions;

        if (suggestions.length > 0) {
            suggestionsList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }

    /**
     * Toggle password visibility in strength checker
     */
    togglePasswordVisibility() {
        const input = this.elements.strengthInput;
        const icon = this.elements.visibilityIcon;

        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = '🙈';
            this.isPasswordVisible = true;
        } else {
            input.type = 'password';
            icon.textContent = '👁️';
            this.isPasswordVisible = false;
        }
    }

    /**
     * Add password to history
     */
    addToHistory(password) {
        // Avoid duplicates
        if (this.passwordHistory.includes(password)) {
            return;
        }

        this.passwordHistory.unshift(password);

        // Keep only last 10 passwords
        if (this.passwordHistory.length > 10) {
            this.passwordHistory = this.passwordHistory.slice(0, 10);
        }

        this.savePasswordHistory();
        this.renderPasswordHistory();
    }

    /**
     * Render password history
     */
    renderPasswordHistory() {
        const container = this.elements.passwordHistory;

        if (this.passwordHistory.length === 0) {
            container.innerHTML = '<p class="no-history">No passwords generated yet</p>';
            return;
        }

        const historyHTML = this.passwordHistory.map((password, index) => `
            <div class="history-item">
                <span class="history-password">${this.truncatePassword(password)}</span>
                <div class="history-actions">
                    <button class="history-btn btn-primary" onclick="passwordGen.copyHistoryPassword('${password}')">
                        Copy
                    </button>
                    <button class="history-btn btn-secondary" onclick="passwordGen.removeFromHistory(${index})">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = historyHTML;
    }

    /**
     * Truncate password for display
     */
    truncatePassword(password) {
        return password.length > 30 ? password.substring(0, 30) + '...' : password;
    }

    /**
     * Copy password from history
     */
    async copyHistoryPassword(password) {
        try {
            await navigator.clipboard.writeText(password);
            this.showToast('Password copied from history!', 'success');
        } catch (err) {
            this.fallbackCopyToClipboard(password);
        }
    }

    /**
     * Remove password from history
     */
    removeFromHistory(index) {
        this.passwordHistory.splice(index, 1);
        this.savePasswordHistory();
        this.renderPasswordHistory();
        this.showToast('Password removed from history', 'info');
    }

    /**
     * Clear all password history
     */
    clearPasswordHistory() {
        if (this.passwordHistory.length === 0) {
            this.showToast('History is already empty', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all password history?')) {
            this.passwordHistory = [];
            this.savePasswordHistory();
            this.renderPasswordHistory();
            this.showToast('Password history cleared', 'success');
        }
    }

    /**
     * Save password history to localStorage
     */
    savePasswordHistory() {
        try {
            localStorage.setItem('passwordHistory', JSON.stringify(this.passwordHistory));
        } catch (err) {
            console.warn('Could not save password history:', err);
        }
    }

    /**
     * Load password history from localStorage
     */
    loadPasswordHistory() {
        try {
            const saved = localStorage.getItem('passwordHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (err) {
            console.warn('Could not load password history:', err);
            return [];
        }
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Update toggle icon
        const icon = this.elements.darkModeToggle.querySelector('.toggle-icon');
        icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';

        this.showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`, 'info');
    }

    /**
     * Load saved theme
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        const icon = this.elements.darkModeToggle.querySelector('.toggle-icon');
        icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = this.elements.toast;
        toast.textContent = message;
        toast.className = `toast ${type}`;

        // Show toast
        toast.classList.add('show');

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.passwordGen = new PasswordGenerator();
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Additional utility functions and enhancements

/**
 * Password strength testing suite
 */
class PasswordTester {
    static commonPasswords = [
        'password', '123456', 'password123', 'admin', 'qwerty',
        'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
    ];

    static isCommonPassword(password) {
        return this.commonPasswords.some(common =>
            password.toLowerCase().includes(common.toLowerCase())
        );
    }

    static checkAgainstLeaks(password) {
        // In a real implementation, this would check against known breached passwords
        // For demo purposes, we'll simulate with common patterns
        const commonPatterns = [
            /^password\d+$/i,
            /^admin\d*$/i,
            /^user\d*$/i,
            /^test\d*$/i,
            /^\d{4,8}$/,
            /^[a-zA-Z]{1,8}$/
        ];

        return commonPatterns.some(pattern => pattern.test(password));
    }
}

/**
 * Advanced password analysis
 */
class AdvancedAnalyzer {
    static analyzePattern(password) {
        const patterns = {
            keyboard: this.isKeyboardPattern(password),
            dictionary: this.isDictionaryWord(password),
            personal: this.mightBePersonalInfo(password),
            repeated: this.hasRepeatedSubstring(password)
        };

        return patterns;
    }

    static isKeyboardPattern(password) {
        const keyboardRows = [
            'qwertyuiop',
            'asdfghjkl',
            'zxcvbnm',
            '1234567890'
        ];

        return keyboardRows.some(row => {
            for (let i = 0; i <= row.length - 3; i++) {
                const pattern = row.substring(i, i + 3);
                if (password.toLowerCase().includes(pattern)) {
                    return true;
                }
            }
            return false;
        });
    }

    static isDictionaryWord(password) {
        // Simple dictionary check - in production, use a comprehensive wordlist
        const commonWords = [
            'password', 'welcome', 'hello', 'world', 'love', 'family',
            'friend', 'computer', 'internet', 'security', 'login'
        ];

        return commonWords.some(word =>
            password.toLowerCase().includes(word)
        );
    }

    static mightBePersonalInfo(password) {
        // Check for potential dates, names, etc.
        const patterns = [
            /\d{2}\/\d{2}\/\d{4}/, // Date format
            /\d{4}-\d{2}-\d{2}/, // ISO date
            /\d{2}-\d{2}-\d{4}/, // Date format
            /(19|20)\d{2}/, // Years
            /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i // Months
        ];

        return patterns.some(pattern => pattern.test(password));
    }

    static hasRepeatedSubstring(password) {
        for (let len = 2; len <= Math.floor(password.length / 2); len++) {
            for (let i = 0; i <= password.length - len * 2; i++) {
                const substring = password.substring(i, i + len);
                const remaining = password.substring(i + len);
                if (remaining.includes(substring)) {
                    return true;
                }
            }
        }
        return false;
    }
}

/**
 * Extend the main PasswordGenerator class with additional methods
 */
PasswordGenerator.prototype.generateMultiplePasswords = function (count = 5) {
    const passwords = [];
    const options = this.getPasswordOptions();

    if (!this.validateOptions(options)) {
        this.showToast('Please select at least one character type!', 'error');
        return;
    }

    for (let i = 0; i < count; i++) {
        passwords.push(this.createPassword(options));
    }

    this.showMultiplePasswordsModal(passwords);
};

PasswordGenerator.prototype.showMultiplePasswordsModal = function (passwords) {
    // Create modal dynamically
    const modal = document.createElement('div');
    modal.className = 'password-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🎲 Generated Passwords</h3>
                <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="modal-body">
                ${passwords.map((pwd, index) => `
                    <div class="password-option">
                        <input type="text" value="${pwd}" readonly class="password-field">
                        <button class="btn btn-primary" onclick="passwordGen.copyPassword('${pwd}')">Copy</button>
                    </div>
                `).join('')}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
            </div>
        </div>
    `;

    // Add modal styles
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .password-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .modal-content {
                background: var(--card-background);
                border-radius: var(--radius-xl);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px var(--shadow-color);
            }
            .modal-header {
                padding: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: var(--spacing-sm);
                border-radius: var(--radius-sm);
                transition: background-color var(--transition-normal);
            }
            .modal-close:hover {
                background: var(--border-color);
            }
            .modal-body {
                padding: var(--spacing-lg);
                max-height: 400px;
                overflow-y: auto;
            }
            .password-option {
                display: flex;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-md);
                align-items: center;
            }
            .password-option .password-field {
                flex: 1;
                padding: var(--spacing-md);
                border: 2px solid var(--border-color);
                border-radius: var(--radius-md);
                font-family: 'Courier New', monospace;
                background: var(--surface-color);
                color: var(--text-color);
            }
            .modal-footer {
                padding: var(--spacing-lg);
                border-top: 1px solid var(--border-color);
                text-align: right;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(modal);
};

PasswordGenerator.prototype.copyPassword = function (password) {
    this.copyToClipboard = async function () {
        try {
            await navigator.clipboard.writeText(password);
            this.showToast('Password copied!', 'success');
        } catch (err) {
            this.fallbackCopyToClipboard(password);
        }
    };
    this.copyToClipboard();
};

PasswordGenerator.prototype.exportPasswords = function () {
    if (this.passwordHistory.length === 0) {
        this.showToast('No passwords to export!', 'error');
        return;
    }

    const data = {
        passwords: this.passwordHistory,
        exportDate: new Date().toISOString(),
        generator: 'Password Generator & Strength Checker'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords-export-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('Passwords exported successfully!', 'success');
};

/**
 * Advanced strength checking with more detailed analysis
 */
PasswordGenerator.prototype.performAdvancedAnalysis = function (password) {
    const basicAnalysis = this.analyzePassword(password);
    const patterns = AdvancedAnalyzer.analyzePattern(password);
    const isCommon = PasswordTester.isCommonPassword(password);
    const isLeaked = PasswordTester.checkAgainstLeaks(password);

    const advancedAnalysis = {
        ...basicAnalysis,
        patterns,
        isCommon,
        isLeaked,
        recommendations: this.getAdvancedRecommendations(basicAnalysis, patterns, isCommon, isLeaked)
    };

    return advancedAnalysis;
};

PasswordGenerator.prototype.getAdvancedRecommendations = function (basic, patterns, isCommon, isLeaked) {
    const recommendations = [];

    if (isCommon) {
        recommendations.push({ type: 'critical', text: 'Avoid common passwords' });
    }

    if (isLeaked) {
        recommendations.push({ type: 'critical', text: 'This pattern appears in data breaches' });
    }

    if (patterns.keyboard) {
        recommendations.push({ type: 'warning', text: 'Avoid keyboard patterns' });
    }

    if (patterns.dictionary) {
        recommendations.push({ type: 'warning', text: 'Avoid dictionary words' });
    }

    if (patterns.personal) {
        recommendations.push({ type: 'warning', text: 'Avoid personal information like dates' });
    }

    if (patterns.repeated) {
        recommendations.push({ type: 'info', text: 'Avoid repeated character patterns' });
    }

    if (basic.entropy < 50) {
        recommendations.push({ type: 'info', text: 'Increase password complexity' });
    }

    return recommendations;
};

/**
 * Password strength visualization
 */
PasswordGenerator.prototype.createStrengthVisualization = function (password) {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!password) return canvas;

    const analysis = this.analyzePassword(password);
    const segments = [
        { label: 'Length', value: Math.min(analysis.length / 16, 1), color: '#3366ff' },
        { label: 'Variety', value: (analysis.hasUppercase + analysis.hasLowercase + analysis.hasNumbers + analysis.hasSymbols) / 4, color: '#28a745' },
        { label: 'Entropy', value: Math.min(analysis.entropy / 80, 1), color: '#ffc107' }
    ];

    const barWidth = 80;
    const barHeight = 20;
    const spacing = 30;

    segments.forEach((segment, index) => {
        const x = 10;
        const y = index * spacing + 10;

        // Draw background
        ctx.fillStyle = '#e9ecef';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw progress
        ctx.fillStyle = segment.color;
        ctx.fillRect(x, y, barWidth * segment.value, barHeight);

        // Draw label
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(segment.label, x + barWidth + 10, y + 15);
    });

    return canvas;
};

/**
 * Keyboard shortcuts handler
 */
document.addEventListener('keydown', (e) => {
    if (e.altKey) {
        switch (e.key) {
            case 'g':
                e.preventDefault();
                if (window.passwordGen) {
                    window.passwordGen.generateMultiplePasswords();
                }
                break;
            case 'e':
                e.preventDefault();
                if (window.passwordGen) {
                    window.passwordGen.exportPasswords();
                }
                break;
            case 'd':
                e.preventDefault();
                if (window.passwordGen) {
                    window.passwordGen.toggleDarkMode();
                }
                break;
        }
    }
});

/**
 * Touch device optimizations
 */
if ('ontouchstart' in window) {
    // Add touch-friendly classes
    document.documentElement.classList.add('touch-device');

    // Optimize sliders for touch
    document.addEventListener('DOMContentLoaded', () => {
        const sliders = document.querySelectorAll('.slider');
        sliders.forEach(slider => {
            slider.style.height = '30px';
        });
    });
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
    static startTime = performance.now();

    static logPageLoad() {
        window.addEventListener('load', () => {
            const loadTime = performance.now() - this.startTime;
            console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
        });
    }

    static logPasswordGeneration() {
        const originalGenerate = PasswordGenerator.prototype.generatePassword;
        PasswordGenerator.prototype.generatePassword = function () {
            const start = performance.now();
            const result = originalGenerate.call(this);
            const end = performance.now();
            console.log(`Password generated in ${(end - start).toFixed(2)}ms`);
            return result;
        };
    }
}

// Initialize performance monitoring
PerformanceMonitor.logPageLoad();
PerformanceMonitor.logPasswordGeneration();

/**
 * Accessibility enhancements
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add ARIA labels dynamically
    const strengthProgress = document.getElementById('strengthProgress');
    if (strengthProgress) {
        strengthProgress.setAttribute('role', 'progressbar');
        strengthProgress.setAttribute('aria-valuemin', '0');
        strengthProgress.setAttribute('aria-valuemax', '100');
    }

    // Add keyboard navigation hints
    const helpText = document.createElement('div');
    helpText.className = 'keyboard-shortcuts';
    helpText.innerHTML = `
        <details style="margin-top: 2rem; padding: 1rem; background: var(--surface-color); border-radius: var(--radius-md);">
            <summary>⌨️ Keyboard Shortcuts</summary>
            <ul style="margin-top: 1rem; padding-left: 1rem;">
                <li><strong>Ctrl/Cmd + G</strong>: Generate password</li>
                <li><strong>Ctrl/Cmd + C</strong>: Copy password</li>
                <li><strong>Alt + G</strong>: Generate multiple passwords</li>
                <li><strong>Alt + E</strong>: Export passwords</li>
                <li><strong>Alt + D</strong>: Toggle dark mode</li>
            </ul>
        </details>
    `;

    const footer = document.querySelector('.footer');
    if (footer) {
        footer.parentNode.insertBefore(helpText, footer);
    }
});

// Analytics stub (replace with your analytics service)
class Analytics {
    static track(event, properties = {}) {
        // Replace with your analytics implementation
        console.log('Analytics:', event, properties);
    }
}

// Track usage
document.addEventListener('DOMContentLoaded', () => {
    Analytics.track('page_view', { page: 'password_generator' });

    // Track password generation
    const originalGenerate = PasswordGenerator.prototype.generatePassword;
    PasswordGenerator.prototype.generatePassword = function () {
        Analytics.track('password_generated');
        return originalGenerate.call(this);
    };

    // Track strength checks
    const originalCheck = PasswordGenerator.prototype.checkPasswordStrength;
    PasswordGenerator.prototype.checkPasswordStrength = function (password) {
        if (password) {
            Analytics.track('strength_checked', { length: password.length });
        }
        return originalCheck.call(this, password);
    };
});

console.log('🔐 Password Generator & Strength Checker loaded successfully!');
console.log('💡 Use keyboard shortcuts: Ctrl+G (generate), Ctrl+C (copy), Alt+G (multiple), Alt+D (dark mode)');

