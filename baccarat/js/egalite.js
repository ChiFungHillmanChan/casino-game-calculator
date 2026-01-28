// =====================================================
// EGALITÉ CALCULATIONS
// =====================================================

function getAdjustedEgaliteProb(tieValue) {
    // Adjust probability based on cards remaining
    // This is a simplified model - real adjustment would be more complex
    const decksRemaining = (TOTAL_CARDS - totalDealt) / CARDS_PER_DECK;
    if (decksRemaining < 0.5) return EGALITE_BASE_PROB[tieValue]; // Too few cards
    
    // Slight adjustment based on how many cards of certain values remain
    let baseProb = EGALITE_BASE_PROB[tieValue];
    
    // If we're tracking tie value counts from history, slightly adjust expectations
    // This is a very basic model - real card counting for egalite is complex
    return baseProb;
}

function calculateEgaliteEV(tieValue) {
    const prob = getAdjustedEgaliteProb(tieValue);
    const payout = egalitePayouts[tieValue];
    // EV = (prob * payout) - (1 - prob) * 1
    // EV = prob * payout - 1 + prob
    // EV = prob * (payout + 1) - 1
    return prob * (payout + 1) - 1;
}

function updateEgalitePayout(tieValue, payout) {
    egalitePayouts[tieValue] = parseInt(payout) || 1;
    renderEgaliteGrid();
    updateAllDisplays();
}
