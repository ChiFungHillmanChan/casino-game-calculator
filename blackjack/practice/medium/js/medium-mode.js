/**
 * Medium Mode - 1v1 Dealer Training with Count Verification
 */

const MediumMode = {
    // Game state
    phase: 'betting', // betting, player_turn, dealer_turn, resolution, count_check
    runningCount: 0,
    cardsDealtThisHand: [],

    // Session stats
    handsPlayed: 0,
    handsWon: 0,
    countChecks: 0,
    countCorrect: 0,
    totalCardsDealt: 0,

    // Hand state
    playerCards: [],
    dealerCards: [],
    dealerHoleCard: null,

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
            playerCards: document.getElementById('player-cards'),
            dealerCards: document.getElementById('dealer-cards'),
            playerTotal: document.getElementById('player-total'),
            dealerTotal: document.getElementById('dealer-total'),
            dealTarget: document.getElementById('deal-target'),
            cardInput: document.getElementById('card-input'),
            handsPlayed: document.getElementById('hands-played'),
            countAccuracy: document.getElementById('count-accuracy'),
            cardsDealt: document.getElementById('cards-dealt'),
            // Buttons
            btnHit: document.getElementById('btn-hit'),
            btnStand: document.getElementById('btn-stand'),
            btnDouble: document.getElementById('btn-double'),
            btnSplit: document.getElementById('btn-split'),
            btnNewHand: document.getElementById('btn-new-hand'),
            btnNewShoe: document.getElementById('btn-new-shoe'),
            // Modals
            countModal: document.getElementById('count-modal'),
            countInput: document.getElementById('count-input'),
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
    },

    createCardInput() {
        const container = this.elements.cardInput;
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        CARD_RANKS.forEach(rank => {
            const btn = document.createElement('button');
            btn.className = 'card-btn';
            btn.dataset.rank = rank;
            btn.textContent = rank;

            // Color by count value
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
        this.elements.btnNewHand.addEventListener('click', () => this.startNewHand());
        this.elements.btnNewShoe.addEventListener('click', () => this.startNewShoe());

        // Count modal
        document.querySelectorAll('.count-adjust').forEach(btn => {
            btn.addEventListener('click', () => {
                const adjust = parseInt(btn.dataset.adjust);
                this.elements.countInput.value = parseInt(this.elements.countInput.value || 0) + adjust;
            });
        });
        this.elements.submitCount.addEventListener('click', () => this.checkCount());
        this.elements.countInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.checkCount();
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
        this.handsPlayed = 0;
        this.handsWon = 0;
        this.countChecks = 0;
        this.countCorrect = 0;
        this.totalCardsDealt = 0;
        this.updateStats();
        this.startNewHand();
    },

    startNewHand() {
        this.playerCards = [];
        this.dealerCards = [];
        this.dealerHoleCard = null;
        this.cardsDealtThisHand = [];
        this.phase = 'dealing';

        this.renderTable();
        this.updateActionButtons();
        this.elements.dealTarget.textContent = 'Player';
    },

    dealCard(rank) {
        const suit = CARD_SUITS[Math.floor(Math.random() * 4)];
        const card = { rank, suit };
        const countValue = HI_LO_VALUES[rank];

        // Update running count
        this.runningCount += countValue;
        this.totalCardsDealt++;
        this.cardsDealtThisHand.push({ ...card, countValue });

        // Deal to appropriate position based on phase and card count
        if (this.phase === 'dealing') {
            const totalCards = this.playerCards.length + this.dealerCards.length + (this.dealerHoleCard ? 1 : 0);

            if (totalCards === 0) {
                // First card to player
                this.playerCards.push(card);
                this.elements.dealTarget.textContent = 'Dealer (hole)';
            } else if (totalCards === 1) {
                // Hole card to dealer
                this.dealerHoleCard = card;
                this.elements.dealTarget.textContent = 'Player';
            } else if (totalCards === 2) {
                // Second card to player
                this.playerCards.push(card);
                this.elements.dealTarget.textContent = 'Dealer (up)';
            } else if (totalCards === 3) {
                // Upcard to dealer
                this.dealerCards.push(card);
                this.phase = 'player_turn';
                this.elements.dealTarget.textContent = 'Player';
                this.checkForBlackjack();
            }
        } else if (this.phase === 'player_turn') {
            this.playerCards.push(card);
            this.checkPlayerHand();
        } else if (this.phase === 'dealer_turn') {
            this.dealerCards.push(card);
            this.checkDealerHand();
        }

        this.renderTable();
        this.updateActionButtons();
        this.updateStats();
    },

    checkForBlackjack() {
        const playerEval = HandEvaluation.evaluateHand(this.playerCards);

        // Reveal hole card for blackjack check
        if (playerEval.isBlackjack) {
            this.revealHoleCard();
            const dealerEval = HandEvaluation.evaluateHand([...this.dealerCards, this.dealerHoleCard]);
            if (dealerEval.isBlackjack) {
                this.resolveHand('push');
            } else {
                this.resolveHand('blackjack');
            }
        }
    },

    checkPlayerHand() {
        const eval_ = HandEvaluation.evaluateHand(this.playerCards);
        if (eval_.isBust) {
            this.resolveHand('bust');
        } else if (eval_.total === 21) {
            this.playerAction('stand');
        }
    },

    checkDealerHand() {
        const allDealerCards = [...this.dealerCards];
        if (this.dealerHoleCard) allDealerCards.push(this.dealerHoleCard);

        const eval_ = HandEvaluation.evaluateHand(allDealerCards);

        if (eval_.isBust) {
            this.resolveHand('dealer_bust');
        } else if (eval_.total >= 17) {
            this.compareHands();
        } else {
            this.elements.dealTarget.textContent = 'Dealer';
        }
    },

    playerAction(action) {
        if (this.phase !== 'player_turn') return;

        if (action === 'stand') {
            this.phase = 'dealer_turn';
            this.revealHoleCard();
            this.checkDealerHand();
        } else if (action === 'hit') {
            this.elements.dealTarget.textContent = 'Player';
        } else if (action === 'double') {
            this.elements.dealTarget.textContent = 'Player (double)';
            // After next card, auto-stand
        }

        this.updateActionButtons();
        this.renderTable();
    },

    revealHoleCard() {
        if (this.dealerHoleCard) {
            this.dealerCards.unshift(this.dealerHoleCard);
            this.dealerHoleCard = null;
            this.renderTable();
        }
    },

    compareHands() {
        const playerEval = HandEvaluation.evaluateHand(this.playerCards);
        const dealerEval = HandEvaluation.evaluateHand(this.dealerCards);

        if (playerEval.total > dealerEval.total) {
            this.resolveHand('win');
        } else if (playerEval.total < dealerEval.total) {
            this.resolveHand('lose');
        } else {
            this.resolveHand('push');
        }
    },

    resolveHand(result) {
        this.phase = 'resolution';
        this.handsPlayed++;

        if (result === 'win' || result === 'blackjack' || result === 'dealer_bust') {
            this.handsWon++;
        }

        // Show count check modal
        setTimeout(() => {
            this.elements.countInput.value = '0';
            this.elements.countModal.classList.add('active');
            this.elements.countInput.focus();
        }, 500);
    },

    checkCount() {
        const userCount = parseInt(this.elements.countInput.value) || 0;
        const isCorrect = userCount === this.runningCount;

        this.countChecks++;
        if (isCorrect) this.countCorrect++;

        this.elements.countModal.classList.remove('active');
        this.showResult(isCorrect, userCount);
    },

    showResult(isCorrect, userCount) {
        this.elements.resultIcon.className = 'result-icon ' + (isCorrect ? 'correct' : 'wrong');
        this.elements.resultTitle.textContent = isCorrect ? 'Correct!' : 'Incorrect';
        this.elements.resultMessage.textContent = isCorrect
            ? `Running count is ${this.runningCount}`
            : `You answered ${userCount}, but the running count is ${this.runningCount}`;

        // Show card replay on wrong answer
        if (!isCorrect) {
            this.elements.cardReplay.classList.add('show');
            this.renderCardReplay();
        } else {
            this.elements.cardReplay.classList.remove('show');
        }

        this.elements.resultModal.classList.add('active');
        this.updateStats();
    },

    renderCardReplay() {
        const container = this.elements.replayCards;
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        this.cardsDealtThisHand.forEach(card => {
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
            container.appendChild(div);
        });
    },

    closeResultModal() {
        this.elements.resultModal.classList.remove('active');
        this.startNewHand();
    },

    renderTable() {
        // Render player cards
        const playerContainer = this.elements.playerCards;
        while (playerContainer.firstChild) {
            playerContainer.removeChild(playerContainer.firstChild);
        }
        this.playerCards.forEach(card => {
            playerContainer.appendChild(this.createCardElement(card));
        });
        if (this.playerCards.length === 0) {
            playerContainer.appendChild(this.createCardElement(null));
            playerContainer.appendChild(this.createCardElement(null));
        }

        // Render dealer cards
        const dealerContainer = this.elements.dealerCards;
        while (dealerContainer.firstChild) {
            dealerContainer.removeChild(dealerContainer.firstChild);
        }
        this.dealerCards.forEach(card => {
            dealerContainer.appendChild(this.createCardElement(card));
        });
        if (this.dealerHoleCard) {
            dealerContainer.appendChild(this.createCardElement(null, true));
        }
        if (this.dealerCards.length === 0 && !this.dealerHoleCard) {
            dealerContainer.appendChild(this.createCardElement(null));
            dealerContainer.appendChild(this.createCardElement(null));
        }

        // Update totals
        if (this.playerCards.length > 0) {
            const eval_ = HandEvaluation.evaluateHand(this.playerCards);
            this.elements.playerTotal.textContent = eval_.total + (eval_.isSoft ? ' (soft)' : '');
        } else {
            this.elements.playerTotal.textContent = '';
        }

        if (this.dealerCards.length > 0) {
            const eval_ = HandEvaluation.evaluateHand(this.dealerCards);
            this.elements.dealerTotal.textContent = eval_.total;
        } else {
            this.elements.dealerTotal.textContent = '';
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

    updateActionButtons() {
        const isPlayerTurn = this.phase === 'player_turn';
        const canDouble = isPlayerTurn && this.playerCards.length === 2;
        const playerEval = this.playerCards.length > 0 ? HandEvaluation.evaluateHand(this.playerCards) : null;
        const canSplit = canDouble && playerEval && playerEval.isPair;

        this.elements.btnHit.disabled = !isPlayerTurn;
        this.elements.btnStand.disabled = !isPlayerTurn;
        this.elements.btnDouble.disabled = !canDouble;
        this.elements.btnSplit.disabled = !canSplit;
    },

    updateStats() {
        this.elements.handsPlayed.textContent = this.handsPlayed;
        this.elements.cardsDealt.textContent = this.totalCardsDealt;

        if (this.countChecks > 0) {
            const accuracy = Math.round((this.countCorrect / this.countChecks) * 100);
            this.elements.countAccuracy.textContent = accuracy + '%';
        } else {
            this.elements.countAccuracy.textContent = '-';
        }
    },

    endSession() {
        // Save session stats
        PracticeStats.saveSession(PRACTICE_MODES.MEDIUM, {
            handsPlayed: this.handsPlayed,
            handsWon: this.handsWon,
            cardsCount: this.totalCardsDealt,
            correctCount: this.countCorrect,
            bestStreak: 0
        });

        // Show session modal
        document.getElementById('session-hands').textContent = this.handsPlayed;
        document.getElementById('session-accuracy').textContent =
            this.countChecks > 0 ? Math.round((this.countCorrect / this.countChecks) * 100) + '%' : '-';
        document.getElementById('session-winrate').textContent =
            this.handsPlayed > 0 ? Math.round((this.handsWon / this.handsPlayed) * 100) + '%' : '-';

        this.elements.sessionModal.classList.add('active');
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => MediumMode.init());
