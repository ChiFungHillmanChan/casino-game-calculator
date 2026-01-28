// =====================================================
// RENDER WHEEL - Wheel DOM updates and animation triggers
// =====================================================

/**
 * Render the roulette wheel
 */
function renderWheel() {
    const container = document.getElementById('wheel');
    if (!container) return;
    
    const rouletteConfig = getRouletteConfig();
    const sequence = rouletteConfig.wheelSequence;
    const pocketCount = sequence.length;
    const degreesPerPocket = 360 / pocketCount;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Add wheel outer ring
    const outer = document.createElement('div');
    outer.className = 'wheel-outer';
    
    // Create pockets
    sequence.forEach((number, index) => {
        const pocket = document.createElement('div');
        pocket.className = 'wheel-pocket';
        pocket.dataset.number = number;
        
        // Calculate rotation angle
        const angle = index * degreesPerPocket;
        pocket.style.transform = `rotate(${angle}deg)`;
        
        // Inner pocket with number
        const inner = document.createElement('div');
        inner.className = 'wheel-pocket-inner ' + getNumberColor(number);
        inner.textContent = number;
        
        pocket.appendChild(inner);
        outer.appendChild(pocket);
    });
    
    container.appendChild(outer);
    
    // Initialize ball
    const ball = document.getElementById('ball');
    if (ball) {
        ball.classList.remove('visible', 'spinning');
    }
    
    // Clear result indicator
    const indicator = document.getElementById('resultIndicator');
    if (indicator) {
        indicator.textContent = '';
    }
}

/**
 * Animate wheel spin
 * @param {object} spinData - Spin data from generateSpinData
 * @param {function} onComplete - Callback when animation completes
 */
function animateWheelSpin(spinData, onComplete) {
    const wheel = document.getElementById('wheel');
    const wheelOuter = wheel ? wheel.querySelector('.wheel-outer') : null;
    const ball = document.getElementById('ball');
    const indicator = document.getElementById('resultIndicator');
    
    if (!wheel || !wheelOuter || !ball) {
        onComplete();
        return;
    }
    
    // Clear previous state
    wheelOuter.classList.remove('spinning');
    ball.classList.remove('spinning', 'visible');
    if (indicator) indicator.textContent = '';
    
    // Force reflow
    wheelOuter.offsetHeight;
    
    // Set CSS variables for animation on the wheel-outer element
    const wheelRotation = spinData.wheelAngle;
    const ballRotation = spinData.ballAngle;
    const duration = spinData.duration;
    
    wheelOuter.style.setProperty('--wheel-rotation', wheelRotation + 'deg');
    wheelOuter.style.setProperty('--wheel-duration', duration + 'ms');
    ball.style.setProperty('--ball-rotation', ballRotation + 'deg');
    ball.style.setProperty('--ball-duration', duration + 'ms');
    
    // Start animations
    ball.classList.add('visible');
    
    // Small delay before starting spin
    setTimeout(() => {
        wheelOuter.classList.add('spinning');
        ball.classList.add('spinning');
        
        // Update spin button
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.textContent = 'SPINNING...';
            spinBtn.classList.add('spinning');
        }
    }, 100);
    
    // Handle animation completion
    setTimeout(() => {
        // Remove spinning classes
        wheelOuter.classList.remove('spinning');
        ball.classList.remove('spinning');
        
        // Set final rotation state on wheel-outer
        wheelOuter.style.transform = `rotate(${wheelRotation}deg)`;
        
        // Position ball at winning pocket (accounting for wheel rotation)
        positionBallAtPocket(spinData.result, wheelRotation);
        
        // Show result in center
        if (indicator) {
            indicator.textContent = spinData.result;
            indicator.className = 'result-indicator ' + getNumberColor(spinData.result);
        }
        
        // Highlight winning pocket
        highlightWinningPocket(spinData.result);
        highlightWinningNumber(spinData.result);
        
        // Reset spin button
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.textContent = 'SPIN';
            spinBtn.classList.remove('spinning');
        }
        
        // Callback
        onComplete();
        
    }, spinData.duration + 100);
}

/**
 * Position ball at winning pocket
 * The ball should land on top of the winning number after the wheel stops rotating
 * @param {number|string} number - Winning number
 * @param {number} wheelRotation - Final wheel rotation angle in degrees
 */
function positionBallAtPocket(number, wheelRotation = 0) {
    const ball = document.getElementById('ball');
    const wheelWrapper = document.querySelector('.wheel-wrapper');

    if (!ball || !wheelWrapper) return;

    // Get wheel dimensions for calculating ball position
    const wrapperRect = wheelWrapper.getBoundingClientRect();
    const wheelRadius = wrapperRect.width / 2;

    // Ball orbits slightly inside the outer edge (about 85% of the wheel radius)
    const ballOrbitRadius = wheelRadius * 0.38;

    // Get the winning pocket's position in the wheel sequence
    const rouletteConfig = getRouletteConfig();
    const sequence = rouletteConfig.wheelSequence;
    const pocketIndex = sequence.findIndex(p => p.toString() === number.toString());
    const pocketCount = sequence.length;
    const degreesPerPocket = 360 / pocketCount;

    // Calculate the pocket's angle on the wheel (before rotation)
    // Pockets are arranged starting from top (12 o'clock = -90 degrees in CSS)
    const pocketAngle = pocketIndex * degreesPerPocket;

    // After wheel rotation, the pocket ends up at: pocketAngle + wheelRotation
    // We need to normalize this and convert to radians
    // Subtract 90 degrees because CSS rotation 0 is at 3 o'clock, but we want 12 o'clock reference
    const finalAngleFromTop = (pocketAngle + wheelRotation - 90) % 360;
    const angleInRadians = (finalAngleFromTop * Math.PI) / 180;

    // Calculate ball position (relative to center of wheel)
    const ballX = Math.cos(angleInRadians) * ballOrbitRadius;
    const ballY = Math.sin(angleInRadians) * ballOrbitRadius;

    ball.style.transform = `translate(calc(-50% + ${ballX}px), calc(-50% + ${ballY}px))`;
    ball.classList.add('visible');
    ball.classList.remove('spinning');
}

/**
 * Highlight winning pocket on wheel
 * @param {number|string} number - Winning number
 */
function highlightWinningPocket(number) {
    // Remove existing highlights
    document.querySelectorAll('.wheel-pocket.winning').forEach(el => {
        el.classList.remove('winning');
    });
    
    // Find and highlight winning pocket
    const pocket = document.querySelector(`.wheel-pocket[data-number="${number}"]`);
    if (pocket) {
        pocket.classList.add('winning');
    }
}

/**
 * Clear wheel winning state
 */
function clearWheelWinningState() {
    document.querySelectorAll('.wheel-pocket.winning').forEach(el => {
        el.classList.remove('winning');
    });
    
    const indicator = document.getElementById('resultIndicator');
    if (indicator) {
        indicator.textContent = '';
    }
}

/**
 * Reset wheel to initial state
 */
function resetWheel() {
    const wheel = document.getElementById('wheel');
    const wheelOuter = wheel ? wheel.querySelector('.wheel-outer') : null;
    const ball = document.getElementById('ball');
    const indicator = document.getElementById('resultIndicator');
    
    if (wheelOuter) {
        wheelOuter.classList.remove('spinning');
        wheelOuter.style.transform = 'rotate(0deg)';
    }
    
    if (ball) {
        ball.classList.remove('visible', 'spinning');
        ball.style.transform = 'translate(-50%, -50%)';
    }
    
    if (indicator) {
        indicator.textContent = '';
    }
    
    clearWheelWinningState();
    clearWinningHighlight();
}

/**
 * Create simple wheel visualization (CSS-only fallback)
 */
function renderSimpleWheel() {
    const container = document.getElementById('wheel');
    if (!container) return;
    
    container.innerHTML = '<div class="wheel-simple"></div>';
}

/**
 * Animate a quick flash on the wheel
 */
function flashWheel() {
    const wheel = document.getElementById('wheel');
    if (!wheel) return;
    
    wheel.classList.add('flash');
    setTimeout(() => {
        wheel.classList.remove('flash');
    }, 300);
}
