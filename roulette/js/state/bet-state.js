// =====================================================
// BET STATE - Placed bets tracking
// =====================================================

let betState = createInitialBetState();

/**
 * Create initial bet state
 * @returns {object} Fresh bet state object
 */
function createInitialBetState() {
    return {
        // Inside bets (keyed by bet identifier)
        straight: {},    // { "17": 25, "23": 50 }
        split: {},       // { "17-20": 10, "0-1": 25 }
        street: {},      // { "1-2-3": 25 }
        corner: {},      // { "1-2-4-5": 10 }
        firstFour: 0,    // European only (0,1,2,3)
        topLine: 0,      // American only (0,00,1,2,3)
        line: {},        // { "1-2-3-4-5-6": 15 }
        
        // Outside bets
        column: {},      // { "1": 50, "2": 25, "3": 30 }
        dozen: {},       // { "1": 100, "2": 50 }
        
        // Even money bets (simple number values)
        red: 0,
        black: 0,
        even: 0,
        odd: 0,
        low: 0,
        high: 0
    };
}

/**
 * Reset bet state to initial values
 */
function resetBetState() {
    betState = createInitialBetState();
}

/**
 * Add a bet to the state
 * @param {string} betType - Type of bet (from BET_TYPES)
 * @param {string|null} betValue - Specific value for the bet (number, combination, etc.)
 * @param {number} amount - Amount to add
 * @returns {boolean} Success
 */
function addBet(betType, betValue, amount) {
    if (amount <= 0) return false;
    
    // Even money bets (no betValue needed)
    if (['red', 'black', 'even', 'odd', 'low', 'high', 'firstFour', 'topLine'].includes(betType)) {
        betState[betType] += amount;
        return true;
    }
    
    // Object-based bets
    if (betState[betType] !== undefined && typeof betState[betType] === 'object') {
        if (!betState[betType][betValue]) {
            betState[betType][betValue] = 0;
        }
        betState[betType][betValue] += amount;
        return true;
    }
    
    return false;
}

/**
 * Remove a bet from the state
 * @param {string} betType - Type of bet
 * @param {string|null} betValue - Specific value for the bet
 * @param {number} amount - Amount to remove
 * @returns {boolean} Success
 */
function removeBet(betType, betValue, amount) {
    if (amount <= 0) return false;
    
    // Even money bets
    if (['red', 'black', 'even', 'odd', 'low', 'high', 'firstFour', 'topLine'].includes(betType)) {
        betState[betType] = Math.max(0, betState[betType] - amount);
        return true;
    }
    
    // Object-based bets
    if (betState[betType] !== undefined && typeof betState[betType] === 'object') {
        if (betState[betType][betValue]) {
            betState[betType][betValue] = Math.max(0, betState[betType][betValue] - amount);
            if (betState[betType][betValue] === 0) {
                delete betState[betType][betValue];
            }
            return true;
        }
    }
    
    return false;
}

/**
 * Clear a specific bet completely
 * @param {string} betType - Type of bet
 * @param {string|null} betValue - Specific value for the bet
 */
function clearBet(betType, betValue) {
    // Even money bets
    if (['red', 'black', 'even', 'odd', 'low', 'high', 'firstFour', 'topLine'].includes(betType)) {
        betState[betType] = 0;
        return;
    }
    
    // Object-based bets
    if (betState[betType] !== undefined && typeof betState[betType] === 'object') {
        if (betValue && betState[betType][betValue]) {
            delete betState[betType][betValue];
        }
    }
}

/**
 * Clear all bets
 */
function clearAllBets() {
    betState = createInitialBetState();
}

/**
 * Get a specific bet amount
 * @param {string} betType - Type of bet
 * @param {string|null} betValue - Specific value for the bet
 * @returns {number} Bet amount
 */
function getBetAmount(betType, betValue) {
    // Even money bets
    if (['red', 'black', 'even', 'odd', 'low', 'high', 'firstFour', 'topLine'].includes(betType)) {
        return betState[betType] || 0;
    }
    
    // Object-based bets
    if (betState[betType] !== undefined && typeof betState[betType] === 'object') {
        return betState[betType][betValue] || 0;
    }
    
    return 0;
}

/**
 * Get total amount wagered
 * @returns {number} Total wagered
 */
function getTotalWagered() {
    return calculateTotalWagered(betState);
}

/**
 * Check if any bets are placed
 * @returns {boolean}
 */
function hasBets() {
    return getTotalWagered() > 0;
}

/**
 * Get all placed bets
 * @returns {object} Copy of bet state
 */
function getAllBets() {
    return JSON.parse(JSON.stringify(betState));
}

/**
 * Restore bets from a previous state (for repeat feature)
 * @param {object} savedBets - Previously saved bets
 * @param {number} maxBankroll - Current bankroll to validate against
 * @returns {boolean} Success
 */
function restoreBets(savedBets, maxBankroll) {
    if (!savedBets) return false;
    
    // Calculate total of saved bets
    const total = calculateTotalWagered(savedBets);
    
    // Check if player can afford it
    if (total > maxBankroll) {
        return false;
    }
    
    betState = JSON.parse(JSON.stringify(savedBets));
    return true;
}

/**
 * Get bet count by type
 * @returns {object} Count of each bet type
 */
function getBetCounts() {
    const counts = {};
    
    for (const [betType, value] of Object.entries(betState)) {
        if (typeof value === 'object') {
            counts[betType] = Object.keys(value).length;
        } else if (value > 0) {
            counts[betType] = 1;
        } else {
            counts[betType] = 0;
        }
    }
    
    return counts;
}

/**
 * Get all straight bets (for highlighting on wheel/table)
 * @returns {array} Array of numbers with straight bets
 */
function getStraightBetNumbers() {
    return Object.keys(betState.straight).map(n => n === '00' ? '00' : parseInt(n));
}

/**
 * Validate all bets against table limits
 * @param {number} minBet - Minimum bet
 * @param {number} maxBet - Maximum bet
 * @returns {object} Validation result with any errors
 */
function validateAllBets(minBet, maxBet) {
    const errors = [];

    for (const [betType, value] of Object.entries(betState)) {
        if (typeof value === 'object') {
            for (const [betValue, amount] of Object.entries(value)) {
                if (amount > 0 && amount < minBet) {
                    errors.push(`${betType} on ${betValue}: below minimum bet`);
                }
                if (amount > maxBet) {
                    errors.push(`${betType} on ${betValue}: exceeds maximum bet`);
                }
            }
        } else if (value > 0) {
            if (value < minBet) {
                errors.push(`${betType}: below minimum bet`);
            }
            if (value > maxBet) {
                errors.push(`${betType}: exceeds maximum bet`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Restore bets from storage (used when loading saved game)
 * @param {object} savedBets - Bets object from storage
 */
function restoreBetsFromStorage(savedBets) {
    if (!savedBets) return;

    // Restore all bet types
    betState.straight = savedBets.straight || {};
    betState.split = savedBets.split || {};
    betState.street = savedBets.street || {};
    betState.corner = savedBets.corner || {};
    betState.firstFour = savedBets.firstFour || 0;
    betState.topLine = savedBets.topLine || 0;
    betState.line = savedBets.line || {};
    betState.column = savedBets.column || {};
    betState.dozen = savedBets.dozen || {};
    betState.red = savedBets.red || 0;
    betState.black = savedBets.black || 0;
    betState.even = savedBets.even || 0;
    betState.odd = savedBets.odd || 0;
    betState.low = savedBets.low || 0;
    betState.high = savedBets.high || 0;
}
