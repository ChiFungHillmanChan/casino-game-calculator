// =====================================================
// RENDER RACETRACK - SVG-based oval racetrack
// True curved wedge shapes matching casino design
// =====================================================

// Current neighbour range selection (2-7)
let currentNeighbourRange = NEIGHBOUR_BET_CONFIG.defaultNeighbours;

// Track hovered number for highlighting
let hoveredRacetrackNumber = null;

// ====== SVG Dimensions ======
const SVG_WIDTH = 1020;
const SVG_HEIGHT = 280;
const PADDING = 8;

// Oval dimensions
const OVAL_HEIGHT = SVG_HEIGHT - PADDING * 2;
const OVAL_WIDTH = SVG_WIDTH - PADDING * 2;
const CURVE_RADIUS = OVAL_HEIGHT / 2;

// Cell dimensions
const CELL_HEIGHT = 44;
const CELL_GAP = 2;
const FONT_SIZE = 15; // Consistent font size for all numbers

// Center positions for curves
const LEFT_CENTER_X = PADDING + CURVE_RADIUS;
const RIGHT_CENTER_X = SVG_WIDTH - PADDING - CURVE_RADIUS;
const CENTER_Y = SVG_HEIGHT / 2;

// ====== Number Layout Configuration ======
const LEFT_CURVE_NUMBERS = [10, 23, 8, 30];
const TOP_ROW_NUMBERS = [5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35];
const RIGHT_CURVE_NUMBERS = [3, 26, 0, 32];
const BOTTOM_ROW_NUMBERS = [11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15];

// Section definitions
const VOISINS_NUMBERS = [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25];
const TIERS_NUMBERS = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
const ORPHELINS_NUMBERS = [17, 34, 6, 1, 20, 14, 31, 9];

// Colors
const COLORS = {
    red: '#c41e3a',
    black: '#1a1a1a',
    green: '#228B22',
    border: '#8B0000',
    goldLine: '#c9a227',
    centerBg: '#1a4d2e',
    trackBg: '#0a0a0a'
};

/**
 * Convert degrees to radians
 */
function degToRad(deg) {
    return deg * Math.PI / 180;
}

/**
 * Get point on circle
 */
function getCirclePoint(cx, cy, radius, angleDeg) {
    const rad = degToRad(angleDeg);
    return {
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad)
    };
}

/**
 * Create wedge path for curved sections
 */
function createWedgePath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
    const innerStart = getCirclePoint(cx, cy, innerRadius, startAngle);
    const innerEnd = getCirclePoint(cx, cy, innerRadius, endAngle);
    const outerStart = getCirclePoint(cx, cy, outerRadius, startAngle);
    const outerEnd = getCirclePoint(cx, cy, outerRadius, endAngle);
    
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    
    return `M ${innerStart.x} ${innerStart.y} 
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}
            L ${outerEnd.x} ${outerEnd.y}
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerStart.x} ${outerStart.y}
            Z`;
}

/**
 * Get text position for wedge
 */
function getWedgeTextPosition(cx, cy, radius, startAngle, endAngle) {
    const midAngle = (startAngle + endAngle) / 2;
    return getCirclePoint(cx, cy, radius, midAngle);
}

/**
 * Render the racetrack betting interface using SVG
 */
function renderRacetrack() {
    const container = document.getElementById('racetrackContainer');
    if (!container) return;
    
    const innerRadius = 55;
    const outerRadius = CURVE_RADIUS - 6;
    const wedgeAngle = 180 / LEFT_CURVE_NUMBERS.length;
    
    // Calculate row positions - cells touch the center section  
    const topRowY = PADDING + 6;
    const bottomRowY = SVG_HEIGHT - PADDING - CELL_HEIGHT - 6;
    // Green center section: overlap significantly into number cells (half cell height)
    const centerTopY = topRowY + CELL_HEIGHT / 2;
    const centerBottomY = bottomRowY + CELL_HEIGHT / 2;
    
    const rowStartX = LEFT_CENTER_X + CELL_GAP;
    const rowEndX = RIGHT_CENTER_X - CELL_GAP;
    const rowWidth = rowEndX - rowStartX;
    
    // Calculate divider positions based on number positions
    // ORPHELINS top: between 33 (index 3) and 1 (index 4), between 9 (index 8) and 22 (index 9)
    // ORPHELINS bottom: between 27 (index 3) and 6 (index 4), between 17 (index 6) and 25 (index 7)
    const topCellWidth = (rowWidth - (TOP_ROW_NUMBERS.length - 1) * CELL_GAP) / TOP_ROW_NUMBERS.length;
    const bottomCellWidth = (rowWidth - (BOTTOM_ROW_NUMBERS.length - 1) * CELL_GAP) / BOTTOM_ROW_NUMBERS.length;
    
    // Divider 1: Between 33 and 1 (top index 3-4), between 27 and 6 (bottom index 3-4)
    const divider1TopX = rowStartX + 4 * (topCellWidth + CELL_GAP) - CELL_GAP/2;
    const divider1BottomX = rowStartX + 4 * (bottomCellWidth + CELL_GAP) - CELL_GAP/2;
    
    // Divider 2: Between 9 and 22 (top index 8-9), between 17 and 25 (bottom index 6-7)
    const divider2TopX = rowStartX + 9 * (topCellWidth + CELL_GAP) - CELL_GAP/2;
    const divider2BottomX = rowStartX + 7 * (bottomCellWidth + CELL_GAP) - CELL_GAP/2;
    
    container.innerHTML = `
        <div class="racetrack-wrapper">
            <!-- Neighbour Range Selector -->
            <div class="neighbour-selector">
                <span class="neighbour-label">Neighbours:</span>
                <div class="neighbour-buttons">
                    ${renderNeighbourButtons()}
                </div>
            </div>
            
            <!-- SVG Racetrack -->
            <svg class="racetrack-svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#d64545"/>
                        <stop offset="100%" style="stop-color:#8b0000"/>
                    </linearGradient>
                    <linearGradient id="blackGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#3a3a3a"/>
                        <stop offset="100%" style="stop-color:#0a0a0a"/>
                    </linearGradient>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#2ea043"/>
                        <stop offset="100%" style="stop-color:#0f5f0f"/>
                    </linearGradient>
                </defs>
                
                <!-- Outer oval background -->
                <rect x="${PADDING}" y="${PADDING}" 
                      width="${OVAL_WIDTH}" height="${OVAL_HEIGHT}" 
                      rx="${CURVE_RADIUS}" ry="${CURVE_RADIUS}"
                      fill="${COLORS.trackBg}" stroke="${COLORS.border}" stroke-width="4"/>
                
                <!-- Gold inner line -->
                <rect x="${PADDING + 8}" y="${PADDING + 8}" 
                      width="${OVAL_WIDTH - 16}" height="${OVAL_HEIGHT - 16}" 
                      rx="${CURVE_RADIUS - 8}" ry="${CURVE_RADIUS - 8}"
                      fill="none" stroke="${COLORS.goldLine}" stroke-width="2"/>
                
                <!-- Center section background (stadium shape) - rendered first so numbers overlay -->
                ${renderCenterSection(rowStartX, rowEndX, centerTopY, centerBottomY, divider1TopX, divider1BottomX, divider2TopX, divider2BottomX)}
                
                <!-- Left curve wedges -->
                ${LEFT_CURVE_NUMBERS.map((num, i) => {
                    const startAngle = 90 + i * wedgeAngle;
                    const endAngle = 90 + (i + 1) * wedgeAngle;
                    const path = createWedgePath(LEFT_CENTER_X, CENTER_Y, innerRadius, outerRadius, startAngle, endAngle);
                    const textPos = getWedgeTextPosition(LEFT_CENTER_X, CENTER_Y, (innerRadius + outerRadius) / 2, startAngle, endAngle);
                    const color = getNumberColor(num);
                    const gradientId = color === 'red' ? 'redGradient' : (color === 'green' ? 'greenGradient' : 'blackGradient');
                    return `
                        <g class="track-cell" data-racetrack-number="${num}">
                            <path d="${path}" fill="url(#${gradientId})" stroke="${COLORS.goldLine}" stroke-width="1"/>
                            <text x="${textPos.x}" y="${textPos.y}" 
                                  text-anchor="middle" dominant-baseline="middle"
                                  fill="white" font-family="Georgia, serif" font-size="${FONT_SIZE}" font-weight="bold">${num}</text>
                        </g>
                    `;
                }).join('')}
                
                <!-- Right curve wedges -->
                ${RIGHT_CURVE_NUMBERS.map((num, i) => {
                    const startAngle = -90 + i * wedgeAngle;
                    const endAngle = -90 + (i + 1) * wedgeAngle;
                    const path = createWedgePath(RIGHT_CENTER_X, CENTER_Y, innerRadius, outerRadius, startAngle, endAngle);
                    const textPos = getWedgeTextPosition(RIGHT_CENTER_X, CENTER_Y, (innerRadius + outerRadius) / 2, startAngle, endAngle);
                    const color = getNumberColor(num);
                    const gradientId = color === 'red' ? 'redGradient' : (color === 'green' ? 'greenGradient' : 'blackGradient');
                    return `
                        <g class="track-cell" data-racetrack-number="${num}">
                            <path d="${path}" fill="url(#${gradientId})" stroke="${COLORS.goldLine}" stroke-width="1"/>
                            <text x="${textPos.x}" y="${textPos.y}" 
                                  text-anchor="middle" dominant-baseline="middle"
                                  fill="white" font-family="Georgia, serif" font-size="${FONT_SIZE}" font-weight="bold">${num}</text>
                        </g>
                    `;
                }).join('')}
                
                <!-- Top row cells -->
                ${TOP_ROW_NUMBERS.map((num, i) => {
                    const x = rowStartX + i * (topCellWidth + CELL_GAP);
                    const color = getNumberColor(num);
                    const gradientId = color === 'red' ? 'redGradient' : (color === 'green' ? 'greenGradient' : 'blackGradient');
                    return `
                        <g class="track-cell" data-racetrack-number="${num}">
                            <rect x="${x}" y="${topRowY}" width="${topCellWidth}" height="${CELL_HEIGHT}" 
                                  rx="3" fill="url(#${gradientId})" stroke="${COLORS.goldLine}" stroke-width="0.5"/>
                            <text x="${x + topCellWidth/2}" y="${topRowY + CELL_HEIGHT/2}" 
                                  text-anchor="middle" dominant-baseline="middle"
                                  fill="white" font-family="Georgia, serif" font-size="${FONT_SIZE}" font-weight="bold">${num}</text>
                        </g>
                    `;
                }).join('')}
                
                <!-- Bottom row cells -->
                ${BOTTOM_ROW_NUMBERS.map((num, i) => {
                    const x = rowStartX + i * (bottomCellWidth + CELL_GAP);
                    const color = getNumberColor(num);
                    const gradientId = color === 'red' ? 'redGradient' : (color === 'green' ? 'greenGradient' : 'blackGradient');
                    return `
                        <g class="track-cell" data-racetrack-number="${num}">
                            <rect x="${x}" y="${bottomRowY}" width="${bottomCellWidth}" height="${CELL_HEIGHT}" 
                                  rx="3" fill="url(#${gradientId})" stroke="${COLORS.goldLine}" stroke-width="0.5"/>
                            <text x="${x + bottomCellWidth/2}" y="${bottomRowY + CELL_HEIGHT/2}" 
                                  text-anchor="middle" dominant-baseline="middle"
                                  fill="white" font-family="Georgia, serif" font-size="${FONT_SIZE}" font-weight="bold">${num}</text>
                        </g>
                    `;
                }).join('')}
            </svg>
        </div>
    `;
    
    initRacetrackHandlers();
}

/**
 * Render the center section with TIER, ORPHELINS, VOISINS DU ZERO
 * Dividers are diagonal to connect different positions on top/bottom rows
 */
function renderCenterSection(startX, endX, topY, bottomY, div1TopX, div1BottomX, div2TopX, div2BottomX) {
    const height = bottomY - topY;
    const width = endX - startX;
    const radius = height / 2;
    
    // Stadium shape path for the whole center
    const centerPath = `
        M ${startX + radius} ${topY}
        L ${endX - radius} ${topY}
        A ${radius} ${radius} 0 0 1 ${endX - radius} ${bottomY}
        L ${startX + radius} ${bottomY}
        A ${radius} ${radius} 0 0 1 ${startX + radius} ${topY}
        Z
    `;
    
    // Calculate center positions for labels
    const tierCenterX = (startX + radius + div1TopX) / 2;
    const orphelinsCenterX = (div1TopX + div2TopX) / 2;
    const voisinsCenterX = (div2TopX + endX - radius) / 2;
    const labelY = topY + height / 2;
    
    return `
        <!-- Center background - no stroke to blend seamlessly with number rows -->
        <path d="${centerPath}" fill="${COLORS.centerBg}"/>
        
        <!-- Diagonal divider 1: between 33-1 (top) and 27-6 (bottom) -->
        <line x1="${div1TopX}" y1="${topY + 2}" x2="${div1BottomX}" y2="${bottomY - 2}" 
              stroke="${COLORS.goldLine}" stroke-width="2"/>
        
        <!-- Diagonal divider 2: between 9-22 (top) and 17-25 (bottom) -->
        <line x1="${div2TopX}" y1="${topY + 2}" x2="${div2BottomX}" y2="${bottomY - 2}" 
              stroke="${COLORS.goldLine}" stroke-width="2"/>
        
        <!-- TIER section -->
        <g class="track-section" data-call-bet="tiers">
            <path d="M ${startX + radius} ${topY} L ${div1TopX} ${topY} L ${div1BottomX} ${bottomY} L ${startX + radius} ${bottomY} A ${radius} ${radius} 0 0 1 ${startX + radius} ${topY} Z" 
                  fill="transparent" class="section-hitbox"/>
            <text x="${tierCenterX}" y="${labelY}" 
                  text-anchor="middle" dominant-baseline="middle"
                  fill="white" font-family="Georgia, serif" font-size="18" font-weight="bold" 
                  letter-spacing="3" class="section-label">TIER</text>
        </g>
        
        <!-- ORPHELINS section -->
        <g class="track-section" data-call-bet="orphelins">
            <path d="M ${div1TopX} ${topY} L ${div2TopX} ${topY} L ${div2BottomX} ${bottomY} L ${div1BottomX} ${bottomY} Z" 
                  fill="transparent" class="section-hitbox"/>
            <text x="${orphelinsCenterX}" y="${labelY}" 
                  text-anchor="middle" dominant-baseline="middle"
                  fill="white" font-family="Georgia, serif" font-size="18" font-weight="bold" 
                  letter-spacing="3" class="section-label">ORPHELINS</text>
        </g>
        
        <!-- VOISINS DU ZERO section -->
        <g class="track-section" data-call-bet="voisins">
            <path d="M ${div2TopX} ${topY} L ${endX - radius} ${topY} A ${radius} ${radius} 0 0 1 ${endX - radius} ${bottomY} L ${div2BottomX} ${bottomY} Z" 
                  fill="transparent" class="section-hitbox"/>
            <text x="${voisinsCenterX}" y="${labelY}" 
                  text-anchor="middle" dominant-baseline="middle"
                  fill="white" font-family="Georgia, serif" font-size="18" font-weight="bold" 
                  letter-spacing="2" class="section-label">VOISINS DU ZERO</text>
        </g>
    `;
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
    
    if (container.dataset.handlersInitialized === 'true') return;
    container.dataset.handlersInitialized = 'true';
    
    container.addEventListener('click', (e) => {
        const callBetSection = e.target.closest('[data-call-bet]');
        if (callBetSection) {
            handleCallBetClick(callBetSection.dataset.callBet);
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
            setNeighbourRange(parseInt(rangeBtn.dataset.neighbourRange));
            return;
        }
    });
    
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const callBetSection = e.target.closest('[data-call-bet]');
        if (callBetSection) {
            handleCallBetRemove(callBetSection.dataset.callBet);
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
    
    container.addEventListener('mouseover', (e) => {
        const numberEl = e.target.closest('[data-racetrack-number]');
        if (numberEl) {
            const number = numberEl.dataset.racetrackNumber;
            highlightNeighbours(number === '00' ? '00' : parseInt(number));
        }
        
        const callBetSection = e.target.closest('[data-call-bet]');
        if (callBetSection) {
            highlightCallBetNumbers(callBetSection.dataset.callBet);
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
