// =====================================================
// EVENT HANDLERS - All click/touch event bindings
// =====================================================

/**
 * Initialize all event handlers
 */
function initEventHandlers() {
    // Setup form handlers
    initSetupHandlers();
    
    // Game control handlers
    initGameControlHandlers();
    
    // Betting table handlers (initialized after table is rendered)
    // initBettingTableHandlers();
    
    // Stats panel handlers
    initStatsHandlers();
}

/**
 * Setup screen event handlers
 */
function initSetupHandlers() {
    // Roulette type radio buttons
    const typeRadios = document.querySelectorAll('input[name="rouletteType"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', handleRouletteTypeChange);
    });
    
    // Stack preset buttons
    const presetBtns = document.querySelectorAll('#stackPresets .preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', handleStackPresetClick);
    });
    
    // Custom stack input
    const customStack = document.getElementById('customStack');
    if (customStack) {
        customStack.addEventListener('input', handleCustomStackInput);
    }
    
    // Setup form submission
    const setupForm = document.getElementById('setupForm');
    if (setupForm) {
        setupForm.addEventListener('submit', handleSetupSubmit);
    }
}

/**
 * Handle roulette type change
 */
function handleRouletteTypeChange(e) {
    const type = e.target.value;
    const infoEl = document.getElementById('houseEdgeInfo');
    
    if (type === 'european') {
        infoEl.textContent = 'European roulette has a 2.70% house edge due to the single zero. All standard bets have the same expected return of -2.70%.';
    } else {
        infoEl.textContent = 'American roulette has a 5.26% house edge due to the double zero (0 and 00). The "Top Line" bet has the worst odds at 7.89% house edge.';
    }
}

/**
 * Handle stack preset button click
 */
function handleStackPresetClick(e) {
    const btn = e.target;
    const value = parseInt(btn.dataset.value);
    
    // Update active state
    document.querySelectorAll('#stackPresets .preset-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    
    // Clear custom input
    const customInput = document.getElementById('customStack');
    if (customInput) {
        customInput.value = '';
    }
}

/**
 * Handle custom stack input
 */
function handleCustomStackInput(e) {
    const value = e.target.value;
    
    if (value) {
        // Clear preset selection
        document.querySelectorAll('#stackPresets .preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
}

/**
 * Handle setup form submission
 */
function handleSetupSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const rouletteType = document.querySelector('input[name="rouletteType"]:checked').value;
    const customStack = document.getElementById('customStack').value;
    const activePreset = document.querySelector('#stackPresets .preset-btn.active');
    const minBet = parseInt(document.getElementById('minBet').value);
    const maxBet = parseInt(document.getElementById('maxBet').value);
    
    // Determine stack value
    let initialStack;
    if (customStack) {
        initialStack = parseInt(customStack);
    } else if (activePreset) {
        initialStack = parseInt(activePreset.dataset.value);
    } else {
        initialStack = 1000; // Default
    }
    
    // Validate
    if (initialStack < minBet) {
        alert('Starting bankroll must be at least the minimum bet.');
        return;
    }
    
    if (minBet >= maxBet) {
        alert('Maximum bet must be greater than minimum bet.');
        return;
    }
    
    // Start game with config
    const config = {
        rouletteType,
        initialStack,
        minBet,
        maxBet
    };
    
    startGame(config);
    
    // Switch to game screen
    showGameScreen();
}

/**
 * Game control event handlers
 */
function initGameControlHandlers() {
    // Spin button
    const spinBtn = document.getElementById('spinBtn');
    if (spinBtn) {
        spinBtn.addEventListener('click', handleSpinClick);
    }
    
    // Clear bets button
    const clearBtn = document.getElementById('clearBetsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearBets);
    }
    
    // Undo button
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', handleUndo);
    }
    
    // Repeat button
    const repeatBtn = document.getElementById('repeatBtn');
    if (repeatBtn) {
        repeatBtn.addEventListener('click', handleRepeatBets);
    }
    
    // Skip button (simulate 100 spins)
    const skipBtn = document.getElementById('skipBtn');
    if (skipBtn) {
        skipBtn.addEventListener('click', handleSkipSpins);
    }
    
    // Result overlay buttons
    const newBetsBtn = document.getElementById('newBetsBtn');
    if (newBetsBtn) {
        newBetsBtn.addEventListener('click', handleNewBets);
    }
    
    const sameBetsBtn = document.getElementById('sameBetsBtn');
    if (sameBetsBtn) {
        sameBetsBtn.addEventListener('click', handleSameBets);
    }
    
    // Game over - new game button
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', handleNewGame);
    }
    
    // Menu button
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', handleMenuClick);
    }
}

/**
 * Handle spin button click
 */
function handleSpinClick() {
    if (isSpinning() || !hasBets()) return;
    
    // Store current bets for repeat
    storeLastBets(getAllBets());
    
    // Disable betting during spin
    setGamePhase(GAME_PHASES.SPINNING);
    updateButtonStates();
    
    // Generate spin and animate
    const rouletteConfig = getRouletteConfig();
    const spinData = generateSpinData(rouletteConfig.wheelSequence);
    setSpinData(spinData);
    
    // Start wheel animation
    animateWheelSpin(spinData, () => {
        // Animation complete - resolve bets
        const resolution = resolveAllBets(spinData.result, getAllBets(), gameState.config.rouletteType);
        
        // Record in stats
        recordSpin(spinData.result, resolution.totalWagered, resolution.totalWinnings);
        
        // Update bankroll
        updateBankroll(resolution.netResult);
        
        // Clear bets after resolution
        clearAllBets();
        
        // Clear spin state
        clearSpinData();
        
        // Update displays
        renderBankroll();
        renderStats();
        renderPlacedChips(); // Clear chips from table
        
        // Check for game over (bankroll <= 0 after the round)
        if (isBankrupt()) {
            // Show result briefly, then show game over
            showResult(spinData.result, resolution);
            setGamePhase(GAME_PHASES.GAME_OVER);
            
            // After a short delay, show game over overlay
            setTimeout(() => {
                hideResultOverlay();
                showGameOver();
            }, 2000);
        } else {
            // Normal result display
            showResult(spinData.result, resolution);
            setGamePhase(GAME_PHASES.RESULT);
        }
    });
}

/**
 * Handle clear bets button
 */
function handleClearBets() {
    clearAllBets();
    renderPlacedChips();
    updateTotalBetDisplay();
    updateButtonStates();
}

/**
 * Handle undo button (remove last bet)
 */
function handleUndo() {
    if (getGamePhase() !== GAME_PHASES.BETTING) return;

    if (undoLastBet()) {
        renderPlacedChips();
        updateTotalBetDisplay();
        updateButtonStates();
    }
}

/**
 * Handle skip button - simulate 100 random spins for statistics
 * This simulates casino history without affecting bankroll
 */
function handleSkipSpins() {
    if (getGamePhase() !== GAME_PHASES.BETTING) return;
    
    const skipBtn = document.getElementById('skipBtn');
    if (skipBtn) {
        skipBtn.disabled = true;
        skipBtn.textContent = 'Simulating...';
    }
    
    const rouletteConfig = getRouletteConfig();
    const wheelSequence = rouletteConfig.wheelSequence;
    
    // Simulate 100 spins
    let simulated = 0;
    const totalToSimulate = 100;
    
    // Use small batches to allow UI updates
    function simulateBatch() {
        const batchSize = 10;
        for (let i = 0; i < batchSize && simulated < totalToSimulate; i++) {
            // Generate random result
            const result = generateRandomResult(wheelSequence);
            
            // Record in stats (no wagering, just the spin result)
            recordSpinOnly(result);
            
            simulated++;
        }
        
        // Update stats display
        renderStats();
        
        if (simulated < totalToSimulate) {
            // Continue with next batch
            setTimeout(simulateBatch, 10);
        } else {
            // Done
            if (skipBtn) {
                skipBtn.disabled = false;
                skipBtn.textContent = 'Skip 100';
            }
        }
    }
    
    // Start simulation
    simulateBatch();
}

/**
 * Handle repeat bets button
 */
function handleRepeatBets() {
    const lastBets = getLastBets();
    if (!lastBets) return;
    
    const success = restoreBets(lastBets, getCurrentBankroll());
    if (success) {
        renderPlacedChips();
        updateTotalBetDisplay();
        updateButtonStates();
    } else {
        alert('Cannot afford to repeat last bets.');
    }
}

/**
 * Handle new bets after result
 */
function handleNewBets() {
    hideResultOverlay();
    clearAllBets();
    renderPlacedChips();
    updateTotalBetDisplay();
    setGamePhase(GAME_PHASES.BETTING);
    updateButtonStates();
}

/**
 * Handle same bets after result
 */
function handleSameBets() {
    hideResultOverlay();
    
    const lastBets = getLastBets();
    if (lastBets && restoreBets(lastBets, getCurrentBankroll())) {
        renderPlacedChips();
        updateTotalBetDisplay();
    } else {
        clearAllBets();
        renderPlacedChips();
        updateTotalBetDisplay();
    }
    
    setGamePhase(GAME_PHASES.BETTING);
    updateButtonStates();
}

/**
 * Handle new game from game over
 */
function handleNewGame() {
    hideGameOverOverlay();
    showSetupScreen();
    resetGameState();
    resetBetState();
    resetStatsState();
}

/**
 * Handle menu button click
 */
function handleMenuClick() {
    if (confirm('Return to setup? Current game will be lost.')) {
        handleNewGame();
    }
}

/**
 * Stats panel event handlers
 */
function initStatsHandlers() {
    // Collapsible sections
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    collapsibleHeaders.forEach(header => {
        header.addEventListener('click', handleCollapsibleToggle);
    });

    // Mobile tab bar handlers
    initMobileTabHandlers();
}

/**
 * Initialize mobile tab bar handlers
 */
function initMobileTabHandlers() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });
}

/**
 * Handle mobile tab switching between Game and Stats
 */
function handleTabSwitch(e) {
    const btn = e.currentTarget;
    const tab = btn.dataset.tab;

    // Update button states
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');

    // Get elements
    const gameArea = document.getElementById('gameArea');
    const statsPanel = document.getElementById('statsPanel');
    const actionBar = document.getElementById('actionBar');
    const chipSelector = document.getElementById('chipSelector');

    if (tab === 'game') {
        // Show game, hide stats
        if (gameArea) gameArea.classList.remove('tab-hidden');
        if (statsPanel) statsPanel.classList.remove('tab-active');
        if (actionBar) actionBar.style.display = '';
        if (chipSelector) chipSelector.style.display = '';
    } else if (tab === 'stats') {
        // Show stats, hide game
        if (gameArea) gameArea.classList.add('tab-hidden');
        if (statsPanel) statsPanel.classList.add('tab-active');
        if (actionBar) actionBar.style.display = 'none';
        if (chipSelector) chipSelector.style.display = 'none';
    }
}

/**
 * Handle collapsible section toggle
 */
function handleCollapsibleToggle(e) {
    const header = e.currentTarget;
    const section = header.dataset.section;
    const content = document.getElementById(`${section}Content`);
    const toggle = header.querySelector('.collapsible-toggle');
    
    if (content) {
        content.classList.toggle('open');
        toggle.textContent = content.classList.contains('open') ? '▲' : '▼';
    }
}

/**
 * Handle chip selection
 */
function handleChipSelect(value) {
    setSelectedChip(value);
    renderChipSelector();
}

/**
 * Handle bet placement on table
 */
function handleBetPlacement(betType, betValue, e) {
    if (getGamePhase() !== GAME_PHASES.BETTING) return;
    
    const chipValue = getSelectedChip();
    const totalWagered = getTotalWagered();
    const currentBankroll = getCurrentBankroll();
    const remainingBankroll = currentBankroll - totalWagered;
    
    // Check if can afford this bet
    if (!canAffordBet(chipValue, currentBankroll, totalWagered)) {
        // Try to find a smaller chip that we can afford
        const available = getAvailableChips();
        const affordable = available.filter(c => canAffordBet(c, currentBankroll, totalWagered));
        
        if (affordable.length === 0) {
            // Can't afford any bet - show visual feedback
            showBetError('Cannot place bet - bankroll limit reached');
            return;
        }
        
        // Auto-select largest affordable chip and place bet
        const largestAffordable = Math.max(...affordable);
        setSelectedChip(largestAffordable);
        renderChipSelector();
        
        // Place the bet with the affordable chip
        addBet(betType, betValue, largestAffordable);
    } else {
        // Add the bet with selected chip
        addBet(betType, betValue, chipValue);
    }
    
    // Update display
    renderPlacedChips();
    updateTotalBetDisplay();
    updateButtonStates();
}

/**
 * Show bet error message briefly
 */
function showBetError(message) {
    // Check if error element exists, create if not
    let errorEl = document.getElementById('betError');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'betError';
        errorEl.className = 'bet-error-message';
        document.body.appendChild(errorEl);
    }
    
    errorEl.textContent = message;
    errorEl.classList.add('visible');
    
    // Hide after 2 seconds
    setTimeout(() => {
        errorEl.classList.remove('visible');
    }, 2000);
}

/**
 * Handle bet removal (right-click)
 */
function handleBetRemoval(betType, betValue, e) {
    e.preventDefault();
    
    if (getGamePhase() !== GAME_PHASES.BETTING) return;
    
    const chipValue = getSelectedChip();
    removeBet(betType, betValue, chipValue);
    
    renderPlacedChips();
    updateTotalBetDisplay();
    updateButtonStates();
}

/**
 * Update button states based on game state
 */
function updateButtonStates() {
    const phase = getGamePhase();
    const hasBetsPlaced = hasBets();
    const hasLastBets = getLastBets() !== null;
    const canAfford = getCurrentBankroll() > 0;
    const hasUndoActions = canUndo();

    const spinBtn = document.getElementById('spinBtn');
    const clearBtn = document.getElementById('clearBetsBtn');
    const undoBtn = document.getElementById('undoBtn');
    const repeatBtn = document.getElementById('repeatBtn');

    if (spinBtn) {
        spinBtn.disabled = phase !== GAME_PHASES.BETTING || !hasBetsPlaced;
        spinBtn.classList.toggle('spinning', phase === GAME_PHASES.SPINNING);
    }

    if (clearBtn) {
        clearBtn.disabled = phase !== GAME_PHASES.BETTING || !hasBetsPlaced;
    }

    if (undoBtn) {
        undoBtn.disabled = phase !== GAME_PHASES.BETTING || !hasUndoActions;
    }

    if (repeatBtn) {
        repeatBtn.disabled = phase !== GAME_PHASES.BETTING || !hasLastBets || !canAfford;
    }
}

/**
 * Update total bet display
 */
function updateTotalBetDisplay() {
    const totalEl = document.getElementById('totalBetAmount');
    if (totalEl) {
        totalEl.textContent = '$' + getTotalWagered().toLocaleString();
    }
}
