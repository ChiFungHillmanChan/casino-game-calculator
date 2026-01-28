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
        dealer: { cards: [], total: 0 },
        dealingTarget: 'dealer' // 'dealer' or seat index (0-6)
    },
    session: {
        hands: [],
        startTime: null
    },
    phase: 'setup'
};

// Track dealt cards history for display
var dealtCardsHistory = [];

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
            total: 0,
            isSoft: false,
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
    renderDealingTargets();
    renderSeats();
    renderCardInput();
    updateCountDisplay();
    updateRecommendationPanel();

    document.getElementById('undoBtn').addEventListener('click', undoLastCard);
    document.getElementById('newShoeBtn').addEventListener('click', newShoe);
    document.getElementById('newRoundBtn').addEventListener('click', newRound);
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

// Render dealing target selector
function renderDealingTargets() {
    const container = document.getElementById('dealingTargets');
    if (!container) return;

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Dealer target button
    const dealerBtn = document.createElement('button');
    dealerBtn.className = 'target-btn' + (GameState.table.dealingTarget === 'dealer' ? ' active' : '');
    dealerBtn.textContent = 'Dealer';
    dealerBtn.onclick = function() { setDealingTarget('dealer'); };
    container.appendChild(dealerBtn);

    // Seat target buttons (only for active seats)
    GameState.table.seats.forEach((seat, index) => {
        if (seat.status !== 'empty') {
            const btn = document.createElement('button');
            const isMine = seat.status === 'mine';
            btn.className = 'target-btn' + (GameState.table.dealingTarget === index ? ' active' : '');
            btn.classList.add(isMine ? 'mine' : 'other');
            btn.textContent = 'Seat ' + seat.id;
            btn.onclick = function() { setDealingTarget(index); };
            container.appendChild(btn);
        }
    });
}

function setDealingTarget(target) {
    GameState.table.dealingTarget = target;
    renderDealingTargets();
    renderSeats();
    updateDealingIndicator();
}

function updateDealingIndicator() {
    const indicator = document.getElementById('dealingIndicator');
    if (!indicator) return;

    if (GameState.table.dealingTarget === 'dealer') {
        indicator.textContent = 'Dealing to: DEALER';
        indicator.className = 'dealing-indicator dealer';
    } else {
        const seat = GameState.table.seats[GameState.table.dealingTarget];
        const isMine = seat && seat.status === 'mine';
        indicator.textContent = 'Dealing to: Seat ' + (GameState.table.dealingTarget + 1);
        indicator.className = 'dealing-indicator ' + (isMine ? 'mine' : 'other');
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
        if (GameState.table.dealingTarget === index) {
            seatEl.classList.add('dealing-active');
        }
        seatEl.dataset.seatId = seat.id;

        const circleEl = document.createElement('div');
        circleEl.className = 'seat-circle';
        circleEl.onclick = function() { setDealingTarget(index); };

        const numberEl = document.createElement('span');
        numberEl.className = 'seat-number';
        numberEl.textContent = seat.id;
        circleEl.appendChild(numberEl);

        const iconEl = document.createElement('span');
        iconEl.className = 'seat-status-icon';
        iconEl.textContent = getSeatIcon(seat.status);
        circleEl.appendChild(iconEl);

        seatEl.appendChild(circleEl);

        // Seat cards display
        const cardsEl = document.createElement('div');
        cardsEl.className = 'seat-cards';
        cardsEl.id = 'seatCards' + seat.id;

        // Render cards for this seat
        seat.cards.forEach((card, cardIndex) => {
            const cardEl = createSeatCardElement(card, seat.status, cardIndex);
            cardsEl.appendChild(cardEl);
        });

        seatEl.appendChild(cardsEl);

        // Seat info (total)
        const infoEl = document.createElement('div');
        infoEl.className = 'seat-info';

        const totalEl = document.createElement('div');
        totalEl.className = 'seat-total';
        totalEl.id = 'seatTotal' + seat.id;
        if (seat.cards.length > 0) {
            const totalText = seat.isSoft ? seat.total + ' (soft)' : seat.total;
            totalEl.textContent = totalText;
            if (seat.total > 21) {
                totalEl.classList.add('bust');
            } else if (seat.total === 21 && seat.cards.length === 2) {
                totalEl.classList.add('blackjack');
            }
        } else {
            totalEl.textContent = '-';
        }
        infoEl.appendChild(totalEl);

        seatEl.appendChild(infoEl);
        container.appendChild(seatEl);
    });

    // Render dealer cards
    renderDealerCards();
}

function createSeatCardElement(rank, seatStatus, cardIndex) {
    const cardEl = document.createElement('div');
    cardEl.className = 'seat-card';

    // Color based on seat status
    if (seatStatus === 'mine') {
        cardEl.classList.add('mine-card');
    } else {
        cardEl.classList.add('other-card');
    }

    // Hi-Lo color coding
    const hiLoValue = HI_LO_VALUES[rank];
    if (hiLoValue > 0) {
        cardEl.classList.add('low-card');
    } else if (hiLoValue < 0) {
        cardEl.classList.add('high-card');
    }

    cardEl.textContent = rank;

    // Overlap effect
    if (cardIndex > 0) {
        cardEl.style.marginLeft = '-12px';
    }

    return cardEl;
}

function renderDealerCards() {
    const container = document.getElementById('dealerCards');
    if (!container) return;

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    GameState.table.dealer.cards.forEach((rank, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'dealer-card';

        // Hi-Lo color coding
        const hiLoValue = HI_LO_VALUES[rank];
        if (hiLoValue > 0) {
            cardEl.classList.add('low-card');
        } else if (hiLoValue < 0) {
            cardEl.classList.add('high-card');
        }

        cardEl.textContent = rank;

        if (index > 0) {
            cardEl.style.marginLeft = '-12px';
        }

        container.appendChild(cardEl);
    });

    // Update dealer total
    const totalEl = document.getElementById('dealerTotal');
    if (totalEl) {
        if (GameState.table.dealer.cards.length > 0) {
            const result = calculateHandTotal(GameState.table.dealer.cards);
            totalEl.textContent = result.total + (result.isSoft ? ' (soft)' : '');
            GameState.table.dealer.total = result.total;
        } else {
            totalEl.textContent = '-';
        }
    }
}

function getSeatIcon(status) {
    switch (status) {
        case 'mine': return '\u2605';
        case 'occupied': return '\u25CF';
        default: return '';
    }
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

    updateDealingIndicator();
}

function dealCard(rank) {
    // Update count
    GameState.count.running += HI_LO_VALUES[rank];
    GameState.count.cardsDealt++;
    GameState.count.dealtByRank[rank] = (GameState.count.dealtByRank[rank] || 0) + 1;

    // Add to history for display
    dealtCardsHistory.push({
        rank: rank,
        target: GameState.table.dealingTarget
    });

    // Deal to current target
    if (GameState.table.dealingTarget === 'dealer') {
        GameState.table.dealer.cards.push(rank);
    } else {
        const seatIndex = GameState.table.dealingTarget;
        const seat = GameState.table.seats[seatIndex];
        if (seat) {
            seat.cards.push(rank);
            // Recalculate hand total
            const result = calculateHandTotal(seat.cards);
            seat.total = result.total;
            seat.isSoft = result.isSoft;
        }
    }

    renderCardInput();
    renderSeats();
    renderDealtCards();
    updateCountDisplay();
    updateRecommendationPanel();
}

function calculateHandTotal(cards) {
    let total = 0;
    let aces = 0;

    cards.forEach(function(rank) {
        if (rank === 'A') {
            aces++;
            total += 11;
        } else if (['K', 'Q', 'J', '10'].indexOf(rank) !== -1) {
            total += 10;
        } else {
            total += parseInt(rank);
        }
    });

    // Adjust for aces
    let isSoft = aces > 0 && total <= 21;
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
        if (aces === 0) {
            isSoft = false;
        }
    }

    return { total: total, isSoft: isSoft };
}

function renderDealtCards() {
    var container = document.getElementById('dealtCardsDisplay');
    if (!container) return;

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Show last 20 cards dealt
    var cardsToShow = dealtCardsHistory.slice(-20);

    cardsToShow.forEach(function(card) {
        var cardEl = document.createElement('div');
        cardEl.className = 'dealt-card-mini';

        var hiLoValue = HI_LO_VALUES[card.rank];
        var hiLoClass = hiLoValue > 0 ? 'low' : hiLoValue < 0 ? 'high' : 'neutral';
        cardEl.classList.add(hiLoClass);

        // Add target indicator
        if (card.target === 'dealer') {
            cardEl.classList.add('dealer-dealt');
        } else {
            var seat = GameState.table.seats[card.target];
            if (seat && seat.status === 'mine') {
                cardEl.classList.add('mine-dealt');
            } else {
                cardEl.classList.add('other-dealt');
            }
        }

        cardEl.textContent = card.rank;
        container.appendChild(cardEl);
    });

    var countLabel = document.getElementById('dealtCardsCount');
    if (countLabel) {
        countLabel.textContent = dealtCardsHistory.length + ' cards dealt';
    }
}

function undoLastCard() {
    if (dealtCardsHistory.length === 0) {
        return;
    }

    var lastCard = dealtCardsHistory.pop();
    var rank = lastCard.rank;
    var target = lastCard.target;

    // Reverse count
    GameState.count.running -= HI_LO_VALUES[rank];
    GameState.count.cardsDealt--;
    GameState.count.dealtByRank[rank]--;

    // Remove from target
    if (target === 'dealer') {
        GameState.table.dealer.cards.pop();
    } else {
        var seat = GameState.table.seats[target];
        if (seat) {
            seat.cards.pop();
            var result = calculateHandTotal(seat.cards);
            seat.total = result.total;
            seat.isSoft = result.isSoft;
        }
    }

    renderCardInput();
    renderSeats();
    renderDealtCards();
    updateCountDisplay();
    updateRecommendationPanel();
}

function newRound() {
    // Clear all hands but keep the count
    GameState.table.dealer.cards = [];
    GameState.table.dealer.total = 0;

    GameState.table.seats.forEach(function(seat) {
        seat.cards = [];
        seat.total = 0;
        seat.isSoft = false;
        seat.result = null;
    });

    // Reset dealing target to dealer
    GameState.table.dealingTarget = 'dealer';

    renderDealingTargets();
    renderSeats();
    updateDealingIndicator();
}

function newShoe() {
    if (confirm('Start a new shoe? This will reset the count and all hands.')) {
        resetCount();
        dealtCardsHistory = [];

        // Clear all hands
        GameState.table.dealer.cards = [];
        GameState.table.dealer.total = 0;

        GameState.table.seats.forEach(function(seat) {
            seat.cards = [];
            seat.total = 0;
            seat.isSoft = false;
            seat.result = null;
        });

        // Reset dealing target
        GameState.table.dealingTarget = 'dealer';

        renderDealingTargets();
        renderCardInput();
        renderSeats();
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
    const decksRemaining = Math.max(0.5, (totalCards - GameState.count.cardsDealt) / 52);
    const trueCount = GameState.count.running / decksRemaining;
    const tcRounded = Math.round(trueCount * 10) / 10;

    // Calculate edge
    const baseEdge = 0.005; // 0.5% house edge
    const edgePerTC = 0.005; // 0.5% per true count
    const playerEdge = -baseEdge + (tcRounded * edgePerTC);

    // Update edge badge
    const edgeBadge = document.getElementById('edgeBadge');
    if (playerEdge > 0) {
        edgeBadge.textContent = 'Player Edge: +' + (playerEdge * 100).toFixed(2) + '%';
        edgeBadge.className = 'edge-badge positive';
    } else {
        edgeBadge.textContent = 'House Edge: ' + Math.abs(playerEdge * 100).toFixed(2) + '%';
        edgeBadge.className = 'edge-badge negative';
    }

    // Calculate recommended bet
    let recommendedBet = GameState.config.minBet;
    let betUnits = '1 unit (minimum)';

    if (tcRounded >= 4) {
        recommendedBet = GameState.config.minBet * 8;
        betUnits = '8 units (max spread)';
    } else if (tcRounded >= 3) {
        recommendedBet = GameState.config.minBet * 6;
        betUnits = '6 units';
    } else if (tcRounded >= 2) {
        recommendedBet = GameState.config.minBet * 4;
        betUnits = '4 units';
    } else if (tcRounded >= 1) {
        recommendedBet = GameState.config.minBet * 2;
        betUnits = '2 units';
    }

    // Cap at max bet
    recommendedBet = Math.min(recommendedBet, GameState.config.maxBet);

    document.getElementById('recommendedBet').textContent = '$' + recommendedBet;
    document.getElementById('betUnits').textContent = betUnits;

    // Session stats
    const profit = GameState.bankroll.current - GameState.bankroll.initial;
    const profitEl = document.getElementById('sessionProfit');
    profitEl.textContent = (profit >= 0 ? '+$' : '-$') + Math.abs(profit);
    profitEl.className = 'stat-value ' + (profit >= 0 ? 'positive' : 'negative');

    document.getElementById('handsPlayed').textContent = GameState.session.hands.length;
}

function finishSession() {
    alert('Session summary coming soon');
}

function showSettings() {
    alert('Settings panel coming soon');
}

function toggleHistory() {
    const content = document.getElementById('historyContent');
    const toggle = document.getElementById('historyToggle');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▼';
    }
}
