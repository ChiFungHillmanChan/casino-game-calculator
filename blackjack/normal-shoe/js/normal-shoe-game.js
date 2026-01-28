/**
 * Normal Shoe Blackjack Game
 * Main game controller for standard shoe card counting
 * Note: innerHTML is used for rendering game state (not user input)
 */

// Game State
const GameState = {
    config: {
        decks: 6,
        dealerStyle: 'american',
        dealerRule: 'S17',
        surrenderAllowed: true,
        showDeviations: true,
        minBet: 25,
        maxBet: 300
    },
    bankroll: {
        initial: 1600,
        current: 1600
    },
    count: {
        running: 0,
        cardsDealt: 0,
        dealtByRank: {}
    },
    table: {
        seats: [],
        dealer: { cards: [], holeCard: null },
        activeSeatIndex: -1
    },
    session: {
        hands: [],
        startTime: null
    },
    phase: 'setup'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSetup();
});

function initializeSetup() {
    const setupForm = document.getElementById('setupForm');
    setupForm.addEventListener('submit', handleSetupSubmit);

    const seatToggles = document.querySelectorAll('.seat-toggle');
    seatToggles.forEach(btn => {
        btn.addEventListener('click', handleSeatToggle);
    });

    document.getElementById('minBet').addEventListener('change', updateBuyinRecommendations);
    document.getElementById('maxBet').addEventListener('change', updateBuyinRecommendations);

    updateBuyinRecommendations();
}

function handleSeatToggle(e) {
    const btn = e.target;
    const currentState = btn.classList.contains('mine') ? 'mine' :
                         btn.classList.contains('active') ? 'active' : 'empty';
    const mineSeats = document.querySelectorAll('.seat-toggle.mine').length;

    if (currentState === 'empty') {
        btn.classList.add('active');
    } else if (currentState === 'active') {
        if (mineSeats < 3) {
            btn.classList.remove('active');
            btn.classList.add('mine');
        } else {
            btn.classList.remove('active');
        }
    } else {
        btn.classList.remove('mine');
    }
}

function updateBuyinRecommendations() {
    const minBet = parseInt(document.getElementById('minBet').value) || 25;
    const maxBet = parseInt(document.getElementById('maxBet').value) || 300;

    const recommendations = {
        conservative: Math.round(maxBet * 100),
        standard: Math.round(maxBet * 50),
        aggressive: Math.round(maxBet * 25)
    };

    document.getElementById('conservativeBuyin').textContent = '$' + recommendations.conservative.toLocaleString();
    document.getElementById('standardBuyin').textContent = '$' + recommendations.standard.toLocaleString();
    document.getElementById('aggressiveBuyin').textContent = '$' + recommendations.aggressive.toLocaleString();

    // Only set default if user hasn't modified the field
    var buyinInput = document.getElementById('actualBuyin');
    if (!buyinInput.dataset.userModified) {
        buyinInput.value = recommendations.standard;
    }
}

// Track when user modifies buyin input
document.addEventListener('DOMContentLoaded', function() {
    var buyinInput = document.getElementById('actualBuyin');
    if (buyinInput) {
        buyinInput.addEventListener('input', function() {
            this.dataset.userModified = 'true';
        });
    }
});

function handleSetupSubmit(e) {
    e.preventDefault();

    GameState.config.decks = parseInt(document.getElementById('decks').value);
    GameState.config.dealerStyle = document.getElementById('dealerStyle').value;
    GameState.config.dealerRule = document.getElementById('dealerRule').value;
    GameState.config.surrenderAllowed = document.getElementById('surrender').value === 'yes';
    GameState.config.showDeviations = document.getElementById('showDeviations').checked;
    GameState.config.minBet = parseInt(document.getElementById('minBet').value);
    GameState.config.maxBet = parseInt(document.getElementById('maxBet').value);

    const seatToggles = document.querySelectorAll('.seat-toggle');
    GameState.table.seats = [];
    seatToggles.forEach((btn, index) => {
        const status = btn.classList.contains('mine') ? 'mine' :
                      btn.classList.contains('active') ? 'occupied' : 'empty';
        GameState.table.seats.push({
            id: index + 1,
            status: status,
            cards: [],
            bet: 0,
            splitHands: [],
            result: null
        });
    });

    GameState.bankroll.initial = parseInt(document.getElementById('actualBuyin').value);
    GameState.bankroll.current = GameState.bankroll.initial;
    GameState.session.startTime = new Date();
    GameState.session.hands = [];

    resetCount();

    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    initializeGame();
}

function resetCount() {
    GameState.count.running = 0;
    GameState.count.cardsDealt = 0;
    GameState.count.dealtByRank = {};
    CARD_RANKS.forEach(rank => {
        GameState.count.dealtByRank[rank] = 0;
    });
}

function initializeGame() {
    updateSettingsBar();
    renderSeats();
    renderCardInput();
    updateCountDisplay();
    updateRecommendationPanel();

    document.getElementById('undoBtn').addEventListener('click', undoLastCard);
    document.getElementById('newShoeBtn').addEventListener('click', newShoe);
    document.getElementById('finishBtn').addEventListener('click', finishSession);
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
}

function updateSettingsBar() {
    document.getElementById('displayDecks').textContent = GameState.config.decks;
    document.getElementById('displayBetRange').textContent =
        '$' + GameState.config.minBet + '-$' + GameState.config.maxBet;
    updateBankrollDisplay();
}

function updateBankrollDisplay() {
    const bankrollEl = document.getElementById('displayBankroll');
    bankrollEl.textContent = '$' + GameState.bankroll.current.toLocaleString();

    const profit = GameState.bankroll.current - GameState.bankroll.initial;
    bankrollEl.classList.remove('profit', 'loss');
    if (profit > 0) {
        bankrollEl.classList.add('profit');
    } else if (profit < 0) {
        bankrollEl.classList.add('loss');
    }
}

function renderSeats() {
    const container = document.getElementById('seatsContainer');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    GameState.table.seats.forEach((seat, index) => {
        const seatEl = document.createElement('div');
        seatEl.className = 'seat ' + seat.status;
        seatEl.dataset.seatId = seat.id;

        const circleEl = document.createElement('div');
        circleEl.className = 'seat-circle';
        circleEl.onclick = function() { toggleSeatStatus(index); };

        const numberEl = document.createElement('span');
        numberEl.className = 'seat-number';
        numberEl.textContent = seat.id;
        circleEl.appendChild(numberEl);

        const iconEl = document.createElement('span');
        iconEl.className = 'seat-status-icon';
        iconEl.textContent = getSeatIcon(seat.status);
        circleEl.appendChild(iconEl);

        seatEl.appendChild(circleEl);

        const cardsEl = document.createElement('div');
        cardsEl.className = 'seat-cards';
        cardsEl.id = 'seatCards' + seat.id;
        seatEl.appendChild(cardsEl);

        const infoEl = document.createElement('div');
        infoEl.className = 'seat-info';

        const totalEl = document.createElement('div');
        totalEl.className = 'seat-total';
        totalEl.id = 'seatTotal' + seat.id;
        totalEl.textContent = '-';
        infoEl.appendChild(totalEl);

        const betEl = document.createElement('div');
        betEl.className = 'seat-bet';
        betEl.id = 'seatBet' + seat.id;
        infoEl.appendChild(betEl);

        seatEl.appendChild(infoEl);
        container.appendChild(seatEl);
    });
}

function getSeatIcon(status) {
    switch (status) {
        case 'mine': return '\u2605';
        case 'occupied': return '\u25CF';
        default: return '';
    }
}

function toggleSeatStatus(index) {
    const seat = GameState.table.seats[index];
    const mineCount = GameState.table.seats.filter(function(s) { return s.status === 'mine'; }).length;

    if (seat.status === 'empty') {
        seat.status = 'occupied';
    } else if (seat.status === 'occupied') {
        if (mineCount < 3) {
            seat.status = 'mine';
        } else {
            seat.status = 'empty';
        }
    } else {
        seat.status = 'empty';
    }

    renderSeats();
}

function renderCardInput() {
    const grid = document.getElementById('cardInputGrid');
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }

    CARD_RANKS.forEach(function(rank) {
        const maxCards = rank === '10' ? GameState.config.decks * 16 : GameState.config.decks * 4;
        const dealt = GameState.count.dealtByRank[rank] || 0;
        const remaining = maxCards - dealt;
        const hiLoValue = HI_LO_VALUES[rank];

        const btn = document.createElement('button');
        btn.className = 'card-btn' + (remaining === 0 ? ' depleted' : '');
        btn.disabled = remaining === 0;
        btn.onclick = function() { dealCard(rank); };

        const hiLoClass = hiLoValue > 0 ? 'plus' : hiLoValue < 0 ? 'minus' : 'zero';
        const hiLoDisplay = hiLoValue > 0 ? '+1' : hiLoValue < 0 ? '-1' : '0';

        const hiLoEl = document.createElement('span');
        hiLoEl.className = 'hilo-value ' + hiLoClass;
        hiLoEl.textContent = hiLoDisplay;
        btn.appendChild(hiLoEl);

        const rankEl = document.createElement('span');
        rankEl.className = 'card-rank';
        rankEl.textContent = rank;
        btn.appendChild(rankEl);

        const countEl = document.createElement('span');
        countEl.className = 'card-count';
        countEl.textContent = remaining;
        btn.appendChild(countEl);

        grid.appendChild(btn);
    });
}

// Track dealt cards history for display
var dealtCardsHistory = [];

function dealCard(rank) {
    GameState.count.running += HI_LO_VALUES[rank];
    GameState.count.cardsDealt++;
    GameState.count.dealtByRank[rank] = (GameState.count.dealtByRank[rank] || 0) + 1;

    // Add to history for display
    dealtCardsHistory.push(rank);

    renderCardInput();
    renderDealtCards();
    updateCountDisplay();
    updateRecommendationPanel();
}

function renderDealtCards() {
    var container = document.getElementById('dealtCardsDisplay');
    if (!container) return;

    // Clear existing
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Show last 20 cards dealt
    var cardsToShow = dealtCardsHistory.slice(-20);

    cardsToShow.forEach(function(rank) {
        var cardEl = document.createElement('div');
        cardEl.className = 'dealt-card-mini';

        var hiLoValue = HI_LO_VALUES[rank];
        var hiLoClass = hiLoValue > 0 ? 'low' : hiLoValue < 0 ? 'high' : 'neutral';
        cardEl.classList.add(hiLoClass);

        cardEl.textContent = rank;
        container.appendChild(cardEl);
    });

    // Update card count display
    var countLabel = document.getElementById('dealtCardsCount');
    if (countLabel) {
        countLabel.textContent = dealtCardsHistory.length + ' cards dealt';
    }
}

function undoLastCard() {
    alert('Undo functionality coming soon');
}

function newShoe() {
    if (confirm('Start a new shoe? This will reset the count.')) {
        resetCount();
        dealtCardsHistory = [];
        renderCardInput();
        renderDealtCards();
        updateCountDisplay();
        updateRecommendationPanel();
    }
}

function updateCountDisplay() {
    const totalCards = GameState.config.decks * 52;
    const decksRemaining = (totalCards - GameState.count.cardsDealt) / 52;
    const trueCount = decksRemaining > 0 ? GameState.count.running / decksRemaining : 0;
    const penetration = (GameState.count.cardsDealt / totalCards) * 100;

    const rcEl = document.getElementById('runningCount');
    rcEl.textContent = (GameState.count.running >= 0 ? '+' : '') + GameState.count.running;
    rcEl.className = 'count-value ' + (GameState.count.running > 0 ? 'positive' : GameState.count.running < 0 ? 'negative' : 'neutral');

    const tcEl = document.getElementById('trueCount');
    const tcValue = Math.round(trueCount * 10) / 10;
    tcEl.textContent = (tcValue >= 0 ? '+' : '') + tcValue.toFixed(1);
    tcEl.className = 'count-value ' + (tcValue > 0 ? 'positive' : tcValue < 0 ? 'negative' : 'neutral');

    document.getElementById('decksRemaining').textContent = decksRemaining.toFixed(1);
    document.getElementById('cardsDealt').textContent = GameState.count.cardsDealt;
    document.getElementById('penetrationFill').style.width = penetration + '%';
}

function updateRecommendationPanel() {
    const totalCards = GameState.config.decks * 52;
    const decksRemaining = (totalCards - GameState.count.cardsDealt) / 52;
    const trueCount = decksRemaining > 0 ? GameState.count.running / decksRemaining : 0;

    const edge = -BASE_HOUSE_EDGE + (trueCount * EDGE_PER_TRUE_COUNT);
    const edgePercent = (edge * 100).toFixed(2);

    const edgeBadge = document.getElementById('edgeBadge');
    if (edge > 0) {
        edgeBadge.textContent = '+' + edgePercent + '% Player Edge';
        edgeBadge.className = 'edge-badge positive';
    } else {
        edgeBadge.textContent = edgePercent + '% House Edge';
        edgeBadge.className = 'edge-badge negative';
    }

    var betUnits = 1;
    if (trueCount >= 4) betUnits = 8;
    else if (trueCount >= 3) betUnits = 6;
    else if (trueCount >= 2) betUnits = 4;
    else if (trueCount >= 1) betUnits = 2;

    var recommendedBet = Math.min(
        GameState.config.minBet * betUnits,
        GameState.config.maxBet,
        GameState.bankroll.current * 0.05
    );

    document.getElementById('recommendedBet').textContent = '$' + Math.round(recommendedBet);
    document.getElementById('betUnits').textContent = betUnits + ' unit' + (betUnits > 1 ? 's' : '') + ' (TC ' + (trueCount >= 0 ? '+' : '') + trueCount.toFixed(1) + ')';

    var profit = GameState.bankroll.current - GameState.bankroll.initial;
    var profitEl = document.getElementById('sessionProfit');
    profitEl.textContent = (profit >= 0 ? '+$' : '-$') + Math.abs(profit).toLocaleString();
    profitEl.className = 'stat-value ' + (profit >= 0 ? 'profit' : 'loss');

    document.getElementById('handsPlayed').textContent = GameState.session.hands.length;
}

function showSettings() {
    if (confirm('Return to settings? Current session will be preserved.')) {
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('setupScreen').style.display = 'flex';
    }
}

function finishSession() {
    if (confirm('Finish this session?')) {
        showSessionSummary();
    }
}

function showSessionSummary() {
    var duration = new Date() - GameState.session.startTime;
    var durationMins = Math.round(duration / 60000);
    var profit = GameState.bankroll.current - GameState.bankroll.initial;
    var profitPercent = ((profit / GameState.bankroll.initial) * 100).toFixed(1);

    var summaryContent = document.getElementById('sessionSummaryContent');
    while (summaryContent.firstChild) {
        summaryContent.removeChild(summaryContent.firstChild);
    }

    var section1 = document.createElement('div');
    section1.className = 'summary-section';
    var h3a = document.createElement('h3');
    h3a.textContent = 'Session Duration';
    section1.appendChild(h3a);
    var p1 = document.createElement('p');
    p1.textContent = durationMins + ' minutes';
    section1.appendChild(p1);
    summaryContent.appendChild(section1);

    var section2 = document.createElement('div');
    section2.className = 'summary-section';
    var h3b = document.createElement('h3');
    h3b.textContent = 'Financial Summary';
    section2.appendChild(h3b);

    var p2 = document.createElement('p');
    p2.textContent = 'Starting Bankroll: $' + GameState.bankroll.initial.toLocaleString();
    section2.appendChild(p2);

    var p3 = document.createElement('p');
    p3.textContent = 'Final Bankroll: $' + GameState.bankroll.current.toLocaleString();
    section2.appendChild(p3);

    var p4 = document.createElement('p');
    p4.className = profit >= 0 ? 'profit' : 'loss';
    p4.textContent = 'Profit/Loss: ' + (profit >= 0 ? '+' : '') + '$' + profit.toLocaleString() + ' (' + profitPercent + '%)';
    section2.appendChild(p4);

    summaryContent.appendChild(section2);

    var section3 = document.createElement('div');
    section3.className = 'summary-section';
    var h3c = document.createElement('h3');
    h3c.textContent = 'Count Statistics';
    section3.appendChild(h3c);

    var p5 = document.createElement('p');
    p5.textContent = 'Cards Tracked: ' + GameState.count.cardsDealt;
    section3.appendChild(p5);

    var p6 = document.createElement('p');
    p6.textContent = 'Final Running Count: ' + GameState.count.running;
    section3.appendChild(p6);

    summaryContent.appendChild(section3);

    document.getElementById('sessionSummaryModal').style.display = 'flex';

    document.getElementById('exportJsonBtn').onclick = exportSessionJson;
    document.getElementById('newGameBtn').onclick = startNewGame;
}

function exportSessionJson() {
    var data = {
        metadata: {
            date: new Date().toISOString(),
            duration: new Date() - GameState.session.startTime,
            config: GameState.config
        },
        financial: {
            startingBankroll: GameState.bankroll.initial,
            endingBankroll: GameState.bankroll.current,
            profitLoss: GameState.bankroll.current - GameState.bankroll.initial
        },
        counting: {
            cardsDealt: GameState.count.cardsDealt,
            finalRunningCount: GameState.count.running
        },
        hands: GameState.session.hands
    };

    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'blackjack-session-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function startNewGame() {
    document.getElementById('sessionSummaryModal').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('setupScreen').style.display = 'flex';
    GameState.phase = 'setup';
    resetCount();
}

function toggleHistory() {
    var content = document.getElementById('historyContent');
    var toggle = document.getElementById('historyToggle');

    if (content.classList.contains('open')) {
        content.classList.remove('open');
        toggle.textContent = '\u25BC';
    } else {
        content.classList.add('open');
        toggle.textContent = '\u25B2';
    }
}
