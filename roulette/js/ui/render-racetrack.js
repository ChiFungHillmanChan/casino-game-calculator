// =====================================================
// RENDER RACETRACK - Classic oval racetrack betting interface
// Exact replica of traditional casino racetrack design
// =====================================================

// Current neighbour range selection (2-7)
let currentNeighbourRange = NEIGHBOUR_BET_CONFIG.defaultNeighbours;

// Track hovered number for highlighting
let hoveredRacetrackNumber = null;

// ====== Number Layout Configuration ======
// Based on European wheel sequence

// LEFT CURVE: Numbers on the left semi-circle (top to bottom)
const LEFT_CURVE_NUMBERS = [10, 23, 8, 30];

// TOP ROW: Numbers across the top (left to right)
const TOP_ROW_NUMBERS = [5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35];

// RIGHT CURVE: Numbers on the right semi-circle (top to bottom, includes 0)
const RIGHT_CURVE_NUMBERS = [3, 26, 0, 32];

// BOTTOM ROW: Numbers across the bottom (left to right)
const BOTTOM_ROW_NUMBERS = [11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15];

// Section definitions (which numbers belong to which bet)
const VOISINS_NUMBERS = [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25];
const TIERS_NUMBERS = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
const ORPHELINS_NUMBERS = [17, 34, 6, 1, 20, 14, 31, 9];

/**
 * Render the racetrack betting interface
 * Layout: Zero on RIGHT, Tier label on LEFT
 */
function renderRacetrack() {
    const container = document.getElementById('racetrackContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="racetrack-wrapper">
            <!-- Neighbour Range Selector -->
            <div class="neighbour-selector">
                <span class="neighbour-label">Neighbours:</span>
                <div class="neighbour-buttons">
                    ${renderNeighbourButtons()}
                </div>
            </div>
            
            <!-- Racetrack Track - Stadium/Oval Shape -->
            <div class="racetrack-track">
                <!-- Left Curve -->
                <div class="track-curve-left">
                    ${LEFT_CURVE_NUMBERS.map(num => renderTrackCell(num)).join('')}
                </div>
                
                <!-- Main Track Area -->
                <div class="track-main">
                    <!-- Top Row -->
                    <div class="track-row track-row-top">
                        ${TOP_ROW_NUMBERS.map(num => renderTrackCell(num)).join('')}
                    </div>
                    
                    <!-- Center Section with Call Bet Labels -->
                    <div class="track-center">
                        <div class="track-section track-section-tier" data-call-bet="tiers" title="${TIERS_DU_CYLINDRE.name}">
                            <span class="call-bet-label">TIER</span>
                        </div>
                        <div class="track-section track-section-orphelins" data-call-bet="orphelins" title="${ORPHELINS.name}">
                            <span class="call-bet-label">ORPHELINS</span>
                        </div>
                        <div class="track-section track-section-voisins" data-call-bet="voisins" title="${VOISINS_DU_ZERO.name}">
                            <span class="call-bet-label">VOISINS DU ZERO</span>
                        </div>
                    </div>
                    
                    <!-- Bottom Row -->
                    <div class="track-row track-row-bottom">
                        ${BOTTOM_ROW_NUMBERS.map(num => renderTrackCell(num)).join('')}
                    </div>
                </div>
                
                <!-- Right Curve (includes 0) -->
                <div class="track-curve-right">
                    ${RIGHT_CURVE_NUMBERS.map(num => renderTrackCell(num)).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Initialize handlers
    initRacetrackHandlers();
}

/**
 * Render a single track cell with proper color
 */
function renderTrackCell(num) {
    const color = getNumberColor(num);
    return `<div class="track-cell ${color}" data-racetrack-number="${num}">${num}</div>`;
}

/**
 * Render neighbour range buttons (2-7)
 */
function renderNeighbourButtons() {
    let html = '';
    
    for (let i = NEIGHBOUR_BET_CONFIG.minNeighbours; i <= NEIGHBOUR_BET_CONFIG.maxNeighbours; i++) {
        const isActive = i === currentNeighbourRange;
        const totalChips = i * 2 + 1;
        html += `
            <button class="neighbour-btn ${isActive ? 'active' : ''}" 
                    data-neighbour-range="${i}"
                    title="${totalChips} chips total">
                ${i}
            </button>
        `;
    }
    
    return html;
}

/**
 * Initialize racetrack event handlers
 */
function initRacetrackHandlers() {
    const container = document.getElementById('racetrackContainer');
    if (!container) return;
    
    // Prevent duplicate handlers
    if (container.dataset.handlersInitialized === 'true') return;
    container.dataset.handlersInitialized = 'true';
    
    // Handle clicks
    container.addEventListener('click', (e) => {
        const callBetSection = e.target.closest('[data-call-bet]');
        if (callBetSection) {
            const betName = callBetSection.dataset.callBet;
            handleCallBetClick(betName);
            return;
        }
        
        const numberEl = e.target.closest('[data-racetrack-number]');
        if (numberEl) {
            const number = numberEl.dataset.racetrackNumber;
            handleNeighbourBetClick(number === '00' ? '00' : parseInt(number));
            return;
        }
        
        const rangeBtn = e.target.closest('[data-neighbour-range]');
        if (rangeBtn) {
            const range = parseInt(rangeBtn.dataset.neighbourRange);
            setNeighbourRange(range);
            return;
        }
    });
    
    // Handle right-click to remove bets
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const callBetSection = e.target.closest('[data-call-bet]');
        if (callBetSection) {
            const betName = callBetSection.dataset.callBet;
            handleCallBetRemove(betName);
            return;
        }
        
        const numberEl = e.target.closest('[data-racetrack-number]');
        if (numberEl) {
            const number = numberEl.dataset.racetrackNumber;
            handleNeighbourBetRemove(number === '00' ? '00' : parseInt(number));
            return;
        }
        
        return false;
    });
    
    // Handle hover for highlighting neighbours
    container.addEventListener('mouseover', (e) => {
        const numberEl = e.target.closest('[data-racetrack-number]');
        if (numberEl) {
            const number = numberEl.dataset.racetrackNumber;
            highlightNeighbours(number === '00' ? '00' : parseInt(number));
        }
        
        const callBetSection = e.target.closest('[data-call-bet]');
        if (callBetSection) {
            const betName = callBetSection.dataset.callBet;
            highlightCallBetNumbers(betName);
        }
    });
    
    container.addEventListener('mouseout', (e) => {
        const numberEl = e.target.closest('[data-racetrack-number]');
        const callBetSection = e.target.closest('[data-call-bet]');
        
        if (numberEl || callBetSection) {
            clearRacetrackHighlights();
        }
    });
}

/**
 * Handle call bet section click
 */
function handleCallBetClick(betName) {
    if (getGamePhase() !== GAME_PHASES.BETTING) return;
    
    const chipValue = getSelectedChip();
    const success = placeCallBet(betName, chipValue);
    
    if (success) {
        renderPlacedChips();
        updateTotalBetDisplay();
        updateButtonStates();
        showCallBetFeedback(betName, true);
    } else {
        showCallBetFeedback(betName, false);
    }
}

/**
 * Handle call bet removal
 */
function handleCallBetRemove(betName) {
    if (getGamePhase() !== GAME_PHASES.BETTING) return;
    
    const chipValue = getSelectedChip();
    removeCallBet(betName, chipValue);
    
    renderPlacedChips();
    updateTotalBetDisplay();
    updateButtonStates();
}

/**
 * Handle neighbour bet click
 */
function handleNeighbourBetClick(number) {
    if (getGamePhase() !== GAME_PHASES.BETTING) return;
    
    const chipValue = getSelectedChip();
    const wheelSequence = getRouletteConfig().wheelSequence;
    const success = placeNeighbourBet(number, currentNeighbourRange, chipValue, wheelSequence);
    
    if (success) {
        renderPlacedChips();
        updateTotalBetDisplay();
        updateButtonStates();
        showNeighbourBetFeedback(number, true);
    } else {
        showNeighbourBetFeedback(number, false);
    }
}

/**
 * Handle neighbour bet removal
 */
function handleNeighbourBetRemove(number) {
    if (getGamePhase() !== GAME_PHASES.BETTING) return;
    
    const chipValue = getSelectedChip();
    const wheelSequence = getRouletteConfig().wheelSequence;
    removeNeighbourBet(number, currentNeighbourRange, chipValue, wheelSequence);
    
    renderPlacedChips();
    updateTotalBetDisplay();
    updateButtonStates();
}

/**
 * Set the neighbour range
 */
function setNeighbourRange(range) {
    currentNeighbourRange = Math.max(
        NEIGHBOUR_BET_CONFIG.minNeighbours,
        Math.min(NEIGHBOUR_BET_CONFIG.maxNeighbours, range)
    );
    
    document.querySelectorAll('.neighbour-btn').forEach(btn => {
        const btnRange = parseInt(btn.dataset.neighbourRange);
        btn.classList.toggle('active', btnRange === currentNeighbourRange);
    });
    
    if (hoveredRacetrackNumber !== null) {
        highlightNeighbours(hoveredRacetrackNumber);
    }
}

/**
 * Get current neighbour range
 */
function getNeighbourRange() {
    return currentNeighbourRange;
}

/**
 * Highlight neighbours of a number on the racetrack
 */
function highlightNeighbours(number) {
    hoveredRacetrackNumber = number;
    const wheelSequence = getRouletteConfig().wheelSequence;
    const neighbours = getWheelNeighbours(number, currentNeighbourRange, wheelSequence);
    
    document.querySelectorAll('.track-cell').forEach(el => {
        el.classList.remove('highlight', 'center');
    });
    
    neighbours.forEach(num => {
        const el = document.querySelector(`[data-racetrack-number="${num}"]`);
        if (el) {
            el.classList.add('highlight');
            if (num === number || num.toString() === number.toString()) {
                el.classList.add('center');
            }
        }
    });
}

/**
 * Highlight numbers for a call bet
 */
function highlightCallBetNumbers(betName) {
    const callBet = CALL_BETS[betName];
    if (!callBet) return;
    
    document.querySelectorAll('.track-cell').forEach(el => {
        el.classList.remove('highlight', 'center');
    });
    
    callBet.numbers.forEach(num => {
        const el = document.querySelector(`[data-racetrack-number="${num}"]`);
        if (el) {
            el.classList.add('highlight');
        }
    });
}

/**
 * Clear all racetrack highlights
 */
function clearRacetrackHighlights() {
    hoveredRacetrackNumber = null;
    document.querySelectorAll('.track-cell').forEach(el => {
        el.classList.remove('highlight', 'center');
    });
}

/**
 * Show visual feedback for call bet placement
 */
function showCallBetFeedback(betName, success) {
    const section = document.querySelector(`[data-call-bet="${betName}"]`);
    if (!section) return;
    
    section.classList.add(success ? 'bet-placed' : 'bet-failed');
    setTimeout(() => {
        section.classList.remove('bet-placed', 'bet-failed');
    }, 400);
}

/**
 * Show visual feedback for neighbour bet placement
 */
function showNeighbourBetFeedback(number, success) {
    const el = document.querySelector(`[data-racetrack-number="${number}"]`);
    if (!el) return;
    
    el.classList.add(success ? 'bet-placed' : 'bet-failed');
    setTimeout(() => {
        el.classList.remove('bet-placed', 'bet-failed');
    }, 300);
}

/**
 * Update racetrack to show placed bets
 */
function updateRacetrackBetDisplay() {
    const bets = getAllBets();
    
    document.querySelectorAll('.track-cell').forEach(el => {
        const num = el.dataset.racetrackNumber;
        const hasBet = bets.straight[num] && bets.straight[num] > 0;
        el.classList.toggle('has-bet', hasBet);
    });
}
