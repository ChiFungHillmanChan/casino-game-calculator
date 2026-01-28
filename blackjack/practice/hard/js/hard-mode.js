/**
 * Hard Mode - Full Table with 5-Second Timer
 */

const HardMode = {
    // Game state
    phase: 'waiting', // waiting, dealing, ai_turn, player_turn, dealer_turn, count_check
    currentSeat: 0,
    runningCount: 0,
    cardsDealtThisRound: [],
    dealingPosition: 0, // tracks dealing order during initial deal

    // Session stats
    roundsPlayed: 0,
    countChecks: 0,
    countCorrect: 0,
    timeouts: 0,
    totalCardsDealt: 0,

    // Seats state (0-3 = AI, 4 = Player)
    seats: [],
    dealerCards: [],
    dealerHoleCard: null,

    // Timer
    countdownTimer: null,

    // DOM elements
    elements: {},

    init() {
        this.cacheElements();
        this.createCardInput();
        this.bindEvents();
        this.startNewShoe();
    },

    cacheElements() {
        this.elements = {
            dealTarget: document.getElementById('deal-target'),
            cardInput: document.getElementById('card-input'),
            dealerCards: document.getElementById('dealer-cards'),
            dealerTotal: document.getElementById('dealer-total'),
            handsPlayed: document.getElementById('hands-played'),
            countAccuracy: document.getElementById('count-accuracy'),
            timeoutCount: document.getElementById('timeout-count'),
            cardsDealt: document.getElementById('cards-dealt'),
            // Action buttons
            btnHit: document.getElementById('btn-hit'),
            btnStand: document.getElementById('btn-stand'),
            btnDouble: document.getElementById('btn-double'),
            btnSplit: document.getElementById('btn-split'),
            btnNewRound: document.getElementById('btn-new-round'),
            btnNewShoe: document.getElementById('btn-new-shoe'),
            // Modals
            countModal: document.getElementById('count-modal'),
            countInput: document.getElementById('count-input'),
            timerCircle: document.getElementById('timer-circle'),
            timerSeconds: document.getElementById('timer-seconds'),
            submitCount: document.getElementById('submit-count'),
            resultModal: document.getElementById('result-modal'),
            resultIcon: document.getElementById('result-icon'),
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message'),
            cardReplay: document.getElementById('card-replay'),
            replayCards: document.getElementById('replay-cards'),
            continueBtn: document.getElementById('continue-btn'),
            sessionModal: document.getElementById('session-modal'),
            playAgainBtn: document.getElementById('play-again-btn')
        };

        // Cache seat elements
        for (let i = 0; i < 5; i++) {
            this.elements[`seat${i}Cards`] = document.getElementById(`seat-${i}-cards`);
            this.elements[`seat${i}Total`] = document.getElementById(`seat-${i}-total`);
            this.elements[`seat${i}Action`] = document.getElementById(`seat-${i}-action`);
        }
    },

    createCardInput() {
        const container = this.elements.cardInput;
        container.innerHTML = '';

        CARD_RANKS.forEach(rank => {
            const btn = document.createElement('button');
            btn.className = 'card-btn';
            btn.dataset.rank = rank;
            btn.textContent = rank;

            const countValue = HI_LO_VALUES[rank];
            if (countValue > 0) btn.classList.add('plus');
            else if (countValue < 0) btn.classList.add('minus');
            else btn.classList.add('zero');

            btn.addEventListener('click', () => this.dealCard(rank));
            container.appendChild(btn);
        });
    },

    bindEvents() {
        // Action buttons
        this.elements.btnHit.addEventListener('click', () => this.playerAction('hit'));
        this.elements.btnStand.addEventListener('click', () => this.playerAction('stand'));
        this.elements.btnDouble.addEventListener('click', () => this.playerAction('double'));
        this.elements.btnSplit.addEventListener('click', () => this.playerAction('split'));

        // Game controls
        this.elements.btnNewRound.addEventListener('click', () => this.startNewRound());
        this.elements.btnNewShoe.addEventListener('click', () => this.startNewShoe());

        // Count modal
        document.querySelectorAll('.count-adjust').forEach(btn => {
            btn.addEventListener('click', () => {
                const adjust = parseInt(btn.dataset.adjust);
                this.elements.countInput.value = parseInt(this.elements.countInput.value || 0) + adjust;
            });
        });
        this.elements.submitCount.addEventListener('click', () => this.submitCount());
        this.elements.countInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submitCount();
        });

        // Result modal
        this.elements.continueBtn.addEventListener('click', () => this.closeResultModal());

        // Session modal
        this.elements.playAgainBtn.addEventListener('click', () => {
            this.elements.sessionModal.classList.remove('active');
            this.startNewShoe();
        });
    },

    startNewShoe() {
        this.runningCount = 0;
        this.roundsPlayed = 0;
        this.countChecks = 0;
        this.countCorrect = 0;
        this.timeouts = 0;
        this.totalCardsDealt = 0;
        this.updateStats();
        this.phase = 'waiting';
        this.clearTable();
        this.elements.dealTarget.textContent = 'Click "Deal Round" to start';
    },

    startNewRound() {
        // Initialize seats
        this.seats = [];
        for (let i = 0; i < 5; i++) {
            this.seats.push({
                cards: [],
                isStanding: false,
                isBust: false
            });
        }
        this.dealerCards = [];
        this.dealerHoleCard = null;
        this.cardsDealtThisRound = [];
        this.dealingPosition = 0;
        this.phase = 'dealing';
        this.currentSeat = 0;

        this.clearTable();
        this.updateDealTarget();
        this.updateActionButtons();
    },

    clearTable() {
        for (let i = 0; i < 5; i++) {
            this.elements[`seat${i}Cards`].innerHTML = '';
            this.elements[`seat${i}Total`].textContent = '';
            this.elements[`seat${i}Action`].textContent = '';
            document.querySelector(`.seat[data-seat="${i}"]`).classList.remove('active');
        }
        this.elements.dealerCards.innerHTML = '';
        this.elements.dealerTotal.textContent = '';
    },

    updateDealTarget() {
        if (this.phase === 'dealing') {
            const position = this.dealingPosition;
            // Deal order: S1, S2, S3, S4, S5, Dealer hole, S1, S2, S3, S4, S5, Dealer up
            if (position < 5) {
                this.elements.dealTarget.textContent = `Seat ${position + 1}`;
            } else if (position === 5) {
                this.elements.dealTarget.textContent = 'Dealer (hole)';
            } else if (position < 11) {
                this.elements.dealTarget.textContent = `Seat ${position - 5}`;
            } else {
                this.elements.dealTarget.textContent = 'Dealer (up)';
            }
        } else if (this.phase === 'ai_turn') {
            this.elements.dealTarget.textContent = `Seat ${this.currentSeat + 1} (AI)`;
        } else if (this.phase === 'player_turn') {
            this.elements.dealTarget.textContent = 'Your turn - Seat 5';
        } else if (this.phase === 'dealer_turn') {
            this.elements.dealTarget.textContent = 'Dealer';
        } else {
            this.elements.dealTarget.textContent = '-';
        }
    },

    dealCard(rank) {
        const suit = CARD_SUITS[Math.floor(Math.random() * 4)];
        const card = { rank, suit };
        const countValue = HI_LO_VALUES[rank];

        this.runningCount += countValue;
        this.totalCardsDealt++;
        this.cardsDealtThisRound.push({ ...card, countValue });

        if (this.phase === 'dealing') {
            this.handleInitialDeal(card);
        } else if (this.phase === 'ai_turn') {
            this.handleAIDeal(card);
        } else if (this.phase === 'player_turn') {
            this.handlePlayerDeal(card);
        } else if (this.phase === 'dealer_turn') {
            this.handleDealerDeal(card);
        }

        this.renderTable();
        this.updateStats();
    },

    handleInitialDeal(card) {
        const pos = this.dealingPosition;

        if (pos < 5) {
            this.seats[pos].cards.push(card);
        } else if (pos === 5) {
            this.dealerHoleCard = card;
        } else if (pos < 11) {
            this.seats[pos - 6].cards.push(card);
        } else {
            this.dealerCards.push(card);
            // Initial deal complete, start AI turns
            this.phase = 'ai_turn';
            this.currentSeat = 0;
            this.processAISeat();
        }

        this.dealingPosition++;
        this.updateDealTarget();
    },

    handleAIDeal(card) {
        this.seats[this.currentSeat].cards.push(card);
        this.processAISeat();
    },

    processAISeat() {
        const seat = this.seats[this.currentSeat];
        const eval_ = HandEvaluation.evaluateHand(seat.cards);

        // Check for bust or 21
        if (eval_.isBust) {
            seat.isBust = true;
            this.showSeatAction(this.currentSeat, 'BUST');
            this.moveToNextSeat();
            return;
        }

        if (eval_.total === 21) {
            seat.isStanding = true;
            this.showSeatAction(this.currentSeat, 'STAND');
            this.moveToNextSeat();
            return;
        }

        // Get AI decision using BasicStrategy
        const dealerUpcard = this.dealerCards[0]?.rank || 'A';
        const decision = BasicStrategy.getOptimalAction(seat.cards, dealerUpcard);

        if (decision.action === 'S') {
            seat.isStanding = true;
            this.showSeatAction(this.currentSeat, 'STAND');
            this.moveToNextSeat();
        } else if (decision.action === 'H' || decision.action === 'D') {
            // AI needs another card
            this.showSeatAction(this.currentSeat, decision.action === 'D' ? 'DOUBLE' : 'HIT');
            this.highlightSeat(this.currentSeat);
            this.updateDealTarget();
        } else if (decision.action === 'P') {
            // Simplified: treat split as hit for practice
            this.showSeatAction(this.currentSeat, 'HIT');
            this.highlightSeat(this.currentSeat);
            this.updateDealTarget();
        }
    },

    moveToNextSeat() {
        this.currentSeat++;

        if (this.currentSeat === 4) {
            // Player's turn
            this.phase = 'player_turn';
            this.highlightSeat(4);
            this.updateActionButtons();
            this.updateDealTarget();
        } else if (this.currentSeat >= 5) {
            // All seats done, dealer turn
            this.phase = 'dealer_turn';
            this.revealHoleCard();
            this.processDealerTurn();
        } else {
            // Next AI seat
            this.highlightSeat(this.currentSeat);
            this.processAISeat();
        }
    },

    showSeatAction(seatIndex, action) {
        this.elements[`seat${seatIndex}Action`].textContent = action;
    },

    highlightSeat(seatIndex) {
        for (let i = 0; i < 5; i++) {
            document.querySelector(`.seat[data-seat="${i}"]`).classList.remove('active');
        }
        document.querySelector(`.seat[data-seat="${seatIndex}"]`).classList.add('active');
    },

    handlePlayerDeal(card) {
        this.seats[4].cards.push(card);
        const eval_ = HandEvaluation.evaluateHand(this.seats[4].cards);

        if (eval_.isBust) {
            this.seats[4].isBust = true;
            this.showSeatAction(4, 'BUST');
            this.moveToNextSeat();
        } else if (eval_.total === 21) {
            this.playerAction('stand');
        }

        this.updateActionButtons();
    },

    playerAction(action) {
        if (this.phase !== 'player_turn') return;

        if (action === 'stand') {
            this.seats[4].isStanding = true;
            this.showSeatAction(4, 'STAND');
            this.moveToNextSeat();
        } else if (action === 'hit') {
            this.showSeatAction(4, 'HIT');
        } else if (action === 'double') {
            this.showSeatAction(4, 'DOUBLE');
        }

        this.updateActionButtons();
    },

    updateActionButtons() {
        const isPlayerTurn = this.phase === 'player_turn';
        const playerCards = this.seats[4]?.cards || [];
        const canDouble = isPlayerTurn && playerCards.length === 2;
        const eval_ = playerCards.length > 0 ? HandEvaluation.evaluateHand(playerCards) : null;
        const canSplit = canDouble && eval_ && eval_.isPair;

        this.elements.btnHit.disabled = !isPlayerTurn;
        this.elements.btnStand.disabled = !isPlayerTurn;
        this.elements.btnDouble.disabled = !canDouble;
        this.elements.btnSplit.disabled = !canSplit;
    },

    revealHoleCard() {
        if (this.dealerHoleCard) {
            this.dealerCards.unshift(this.dealerHoleCard);
            this.dealerHoleCard = null;
            this.renderTable();
        }
    },

    handleDealerDeal(card) {
        this.dealerCards.push(card);
        this.processDealerTurn();
    },

    processDealerTurn() {
        const eval_ = HandEvaluation.evaluateHand(this.dealerCards);

        if (eval_.isBust || eval_.total >= 17) {
            // Dealer done, show count check
            this.roundsPlayed++;
            this.showCountCheck();
        } else {
            // Dealer needs more cards
            this.updateDealTarget();
        }
    },

    showCountCheck() {
        this.phase = 'count_check';
        this.elements.countInput.value = '0';
        this.elements.timerCircle.classList.remove('warning');
        this.elements.timerSeconds.textContent = '5';
        this.elements.countModal.classList.add('active');
        this.elements.countInput.focus();

        // Start 5-second countdown
        this.countdownTimer = new QuickCountdown({
            duration: 5,
            onTick: (remaining) => {
                this.elements.timerSeconds.textContent = remaining;
                if (remaining <= 2) {
                    this.elements.timerCircle.classList.add('warning');
                }
            },
            onComplete: () => {
                this.handleTimeout();
            }
        });
        this.countdownTimer.start();
    },

    submitCount() {
        if (this.countdownTimer) {
            this.countdownTimer.stop();
        }

        const userCount = parseInt(this.elements.countInput.value) || 0;
        const isCorrect = userCount === this.runningCount;

        this.countChecks++;
        if (isCorrect) this.countCorrect++;

        this.elements.countModal.classList.remove('active');
        this.showResult(isCorrect ? 'correct' : 'wrong', userCount);
    },

    handleTimeout() {
        this.countChecks++;
        this.timeouts++;
        this.elements.countModal.classList.remove('active');
        this.showResult('timeout', null);
    },

    showResult(resultType, userCount) {
        this.elements.resultIcon.className = 'result-icon ' + resultType;

        if (resultType === 'correct') {
            this.elements.resultTitle.textContent = 'Correct!';
            this.elements.resultMessage.textContent = `Running count is ${this.runningCount}`;
            this.elements.cardReplay.classList.remove('show');
        } else if (resultType === 'wrong') {
            this.elements.resultTitle.textContent = 'Incorrect';
            this.elements.resultMessage.textContent = `You answered ${userCount}, correct is ${this.runningCount}`;
            this.elements.cardReplay.classList.add('show');
            this.renderCardReplay();
        } else {
            this.elements.resultTitle.textContent = 'Time\'s Up!';
            this.elements.resultMessage.textContent = `The running count was ${this.runningCount}`;
            this.elements.cardReplay.classList.add('show');
            this.renderCardReplay();
        }

        this.elements.resultModal.classList.add('active');
        this.updateStats();
    },

    renderCardReplay() {
        this.elements.replayCards.innerHTML = '';

        this.cardsDealtThisRound.forEach(card => {
            const div = document.createElement('div');
            div.className = 'replay-card';

            const rankSpan = document.createElement('span');
            rankSpan.className = 'card-rank';
            rankSpan.textContent = card.rank;
            if (card.suit === 'hearts' || card.suit === 'diamonds') {
                rankSpan.style.color = '#c0392b';
            }

            const valueSpan = document.createElement('span');
            valueSpan.className = 'card-value';
            if (card.countValue > 0) {
                valueSpan.classList.add('plus');
                valueSpan.textContent = '+1';
            } else if (card.countValue < 0) {
                valueSpan.classList.add('minus');
                valueSpan.textContent = '-1';
            } else {
                valueSpan.classList.add('zero');
                valueSpan.textContent = '0';
            }

            div.appendChild(rankSpan);
            div.appendChild(valueSpan);
            this.elements.replayCards.appendChild(div);
        });
    },

    closeResultModal() {
        this.elements.resultModal.classList.remove('active');
        this.phase = 'waiting';
        this.clearTable();
        this.elements.dealTarget.textContent = 'Click "Deal Round" to continue';
    },

    renderTable() {
        // Render each seat
        for (let i = 0; i < 5; i++) {
            const container = this.elements[`seat${i}Cards`];
            container.innerHTML = '';

            if (this.seats[i]) {
                this.seats[i].cards.forEach(card => {
                    container.appendChild(this.createCardElement(card));
                });

                if (this.seats[i].cards.length > 0) {
                    const eval_ = HandEvaluation.evaluateHand(this.seats[i].cards);
                    this.elements[`seat${i}Total`].textContent = eval_.total;
                }
            }
        }

        // Render dealer
        this.elements.dealerCards.innerHTML = '';
        this.dealerCards.forEach(card => {
            this.elements.dealerCards.appendChild(this.createCardElement(card));
        });
        if (this.dealerHoleCard) {
            this.elements.dealerCards.appendChild(this.createCardElement(null, true));
        }

        if (this.dealerCards.length > 0) {
            const eval_ = HandEvaluation.evaluateHand(this.dealerCards);
            this.elements.dealerTotal.textContent = eval_.total;
        }
    },

    createCardElement(card, faceDown = false) {
        const div = document.createElement('div');
        div.className = 'card';

        if (faceDown) {
            div.classList.add('face-down');
            return div;
        }

        if (!card) {
            div.classList.add('empty');
            return div;
        }

        if (card.suit === 'hearts' || card.suit === 'diamonds') {
            div.classList.add('red');
        }

        const rankSpan = document.createElement('span');
        rankSpan.className = 'rank';
        rankSpan.textContent = card.rank;

        const suitSpan = document.createElement('span');
        suitSpan.className = 'suit';
        const suitSymbols = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
        suitSpan.textContent = suitSymbols[card.suit] || '';

        div.appendChild(rankSpan);
        div.appendChild(suitSpan);

        return div;
    },

    updateStats() {
        this.elements.handsPlayed.textContent = this.roundsPlayed;
        this.elements.cardsDealt.textContent = this.totalCardsDealt;
        this.elements.timeoutCount.textContent = this.timeouts;

        if (this.countChecks > 0) {
            const accuracy = Math.round((this.countCorrect / this.countChecks) * 100);
            this.elements.countAccuracy.textContent = accuracy + '%';
        } else {
            this.elements.countAccuracy.textContent = '-';
        }
    },

    endSession() {
        PracticeStats.saveSession(PRACTICE_MODES.HARD, {
            handsPlayed: this.roundsPlayed,
            cardsCount: this.totalCardsDealt,
            correctCount: this.countCorrect,
            timeouts: this.timeouts,
            bestStreak: 0
        });

        document.getElementById('session-hands').textContent = this.roundsPlayed;
        document.getElementById('session-accuracy').textContent =
            this.countChecks > 0 ? Math.round((this.countCorrect / this.countChecks) * 100) + '%' : '-';
        document.getElementById('session-timeouts').textContent = this.timeouts;

        this.elements.sessionModal.classList.add('active');
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => HardMode.init());
