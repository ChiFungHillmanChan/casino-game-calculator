// =====================================================
// CONSTANTS & CONFIGURATION
// =====================================================

const TOTAL_DECKS = 8;
const CARDS_PER_DECK = 52;
const TOTAL_CARDS = TOTAL_DECKS * CARDS_PER_DECK;
const CARDS_PER_RANK = TOTAL_DECKS * 4;

const CARD_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0, 0, 0];

// Count systems
const MAIN_BET_TAGS = [1, 1, 1, 1, -1, -1, -1, -1, 0, 0, 0, 0, 0];
const DRAGON7_TAGS = [0, 0, 0, -1, -1, -1, -1, 2, 2, 0, 0, 0, 0];
const PANDA8_TAGS = [1, 1, 1, -2, -2, -2, -1, -1, -2, 1, 1, 1, 1];

// Base EVs (8 deck)
const BASE_EV = {
    banker: -0.0106,
    player: -0.0124,
    tie: -0.1436,
    dragon7: -0.0761,
    panda8: -0.1019
};

// Egalité base probabilities (8 deck) - from Wizard of Odds
const EGALITE_BASE_PROB = {
    0: 0.00575,  // 0-0 tie
    1: 0.00376,  // 1-1 tie
    2: 0.00355,  // 2-2 tie
    3: 0.00432,  // 3-3 tie
    4: 0.00712,  // 4-4 tie
    5: 0.00816,  // 5-5 tie
    6: 0.01836,  // 6-6 tie
    7: 0.02082,  // 7-7 tie (most common)
    8: 0.01018,  // 8-8 tie
    9: 0.00986   // 9-9 tie
};

// Default payouts (standard UK casinos)
const DEFAULT_EGALITE_PAYOUTS = {
    0: 150,
    1: 215,
    2: 225,
    3: 200,
    4: 120,
    5: 110,
    6: 45,
    7: 45,
    8: 80,
    9: 80
};
