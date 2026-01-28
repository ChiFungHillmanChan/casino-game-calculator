// =====================================================
// RENDER WHEEL - Wheel DOM updates and animation triggers
// =====================================================

/**
 * Render the roulette wheel
 */
function renderWheel() {
    const container = document.getElementById('wheel');
    const wheelWrapper = document.querySelector('.wheel-wrapper');
    if (!container) return;

    const rouletteConfig = getRouletteConfig();
    const sequence = rouletteConfig.wheelSequence;
    const pocketCount = sequence.length;
    const degreesPerPocket = 360 / pocketCount;
    const halfPocketAngle = degreesPerPocket / 2;

    // Set CSS variable for half-pocket-angle (for divider positioning)
    if (wheelWrapper) {
        wheelWrapper.style.setProperty('--half-pocket-angle', halfPocketAngle + 'deg');
        // Default ball orbit radius for medium screens
        if (!wheelWrapper.style.getPropertyValue('--ball-orbit-radius')) {
            wheelWrapper.style.setProperty('--ball-orbit-radius', '120px');
        }
    }

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
        // Set half-pocket-angle on each pocket for divider positioning
        pocket.style.setProperty('--half-pocket-angle', halfPocketAngle + 'deg');

        // Calculate rotation angle
        const angle = index * degreesPerPocket;
        pocket.style.transform = `rotate(${angle}deg)`;

        // Inner pocket with number
        const inner = document.createElement('div');
        inner.className = 'wheel-pocket-inner ' + getNumberColor(number);
        inner.textContent = number;

        // Ball pocket area - where ball actually lands
        const ballArea = document.createElement('div');
        ballArea.className = 'wheel-pocket-ball-area';

        pocket.appendChild(inner);
        pocket.appendChild(ballArea);
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
    const wheelWrapper = document.querySelector('.wheel-wrapper');
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

    // Get ball orbit radius from CSS or calculate it
    let ballOrbitRadius = 120; // default
    if (wheelWrapper) {
        const wrapperWidth = wheelWrapper.getBoundingClientRect().width;
        // Ball lands in pocket area: wheelRadius - offset for ball pocket position
        ballOrbitRadius = (wrapperWidth / 2) - 50;
        ball.style.setProperty('--ball-orbit-radius', ballOrbitRadius + 'px');
    }

    // Set CSS variables for animation
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

        // Wait for DOM to update with new wheel position, then position ball
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Position ball at winning pocket using DOM position
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
            });
        });

    }, spinData.duration + 100);
}

/**
 * Position ball at winning pocket
 * Uses the actual DOM position of the ball pocket area for accurate placement
 * @param {number|string} number - Winning number
 * @param {number} wheelRotation - Final wheel rotation angle in degrees
 */
function positionBallAtPocket(number, wheelRotation = 0) {
    const ball = document.getElementById('ball');
    const wheelWrapper = document.querySelector('.wheel-wrapper');
    const winningPocket = document.querySelector(`.wheel-pocket[data-number="${number}"]`);

    if (!ball || !wheelWrapper) return;

    // Get the wheel wrapper dimensions
    const wrapperRect = wheelWrapper.getBoundingClientRect();
    const wheelRadius = wrapperRect.width / 2;

    // Ball orbit radius - positioned in the ball pocket area
    const ballOrbitRadius = wheelRadius - 50;

    // If we found the pocket, use its ball area position
    if (winningPocket) {
        // Try to find the ball pocket area first, fallback to pocket inner
        const ballArea = winningPocket.querySelector('.wheel-pocket-ball-area');
        const targetElement = ballArea || winningPocket.querySelector('.wheel-pocket-inner');

        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            const centerX = wrapperRect.width / 2;
            const centerY = wrapperRect.height / 2;

            // Calculate the target element's center position
            const targetCenterX = targetRect.left + targetRect.width / 2 - wrapperRect.left;
            const targetCenterY = targetRect.top + targetRect.height / 2 - wrapperRect.top;

            // Calculate vector from wheel center to target
            let dx = targetCenterX - centerX;
            let dy = targetCenterY - centerY;

            // Get the distance (for normalization)
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                // Normalize and scale to ball orbit radius
                dx = (dx / distance) * ballOrbitRadius;
                dy = (dy / distance) * ballOrbitRadius;
            }

            ball.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            ball.classList.add('visible');
            ball.classList.remove('spinning');
            return;
        }
    }

    // Fallback: use mathematical calculation
    const rouletteConfig = getRouletteConfig();
    const sequence = rouletteConfig.wheelSequence;
    const pocketIndex = sequence.findIndex(p => p.toString() === number.toString());
    const pocketCount = sequence.length;
    const degreesPerPocket = 360 / pocketCount;

    const pocketStartAngle = pocketIndex * degreesPerPocket;
    const finalAngle = pocketStartAngle + wheelRotation;
    const angleInRadians = (finalAngle * Math.PI) / 180;

    const ballX = Math.sin(angleInRadians) * ballOrbitRadius;
    const ballY = -Math.cos(angleInRadians) * ballOrbitRadius;

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
        // Clear CSS animation variables
        wheelOuter.style.removeProperty('--wheel-rotation');
        wheelOuter.style.removeProperty('--wheel-duration');
    }

    if (ball) {
        ball.classList.remove('visible', 'spinning');
        ball.style.transform = 'translate(-50%, -50%)';
        // Clear CSS animation variables
        ball.style.removeProperty('--ball-rotation');
        ball.style.removeProperty('--ball-duration');
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
