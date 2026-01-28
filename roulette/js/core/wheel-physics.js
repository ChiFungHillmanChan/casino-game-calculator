// =====================================================
// WHEEL PHYSICS - RNG and spin parameter generation
// Pure functions, no DOM dependencies
// =====================================================

/**
 * Generate cryptographically secure random result
 * @param {array} wheelSequence - The wheel sequence array
 * @returns {number|string} Winning pocket (0-36 or '00')
 */
function generateRandomResult(wheelSequence) {
    const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % wheelSequence.length;
    return wheelSequence[randomIndex];
}

/**
 * Get the index of a pocket number in the wheel sequence
 * @param {number|string} pocketNumber - The pocket to find
 * @param {array} wheelSequence - The wheel sequence
 * @returns {number} Index in the sequence
 */
function getPocketIndex(pocketNumber, wheelSequence) {
    return wheelSequence.findIndex(p => p === pocketNumber || p.toString() === pocketNumber.toString());
}

/**
 * Calculate wheel angle for a specific pocket
 * @param {number|string} pocketNumber - Target pocket
 * @param {array} wheelSequence - Ordered sequence of pockets
 * @returns {number} Angle in degrees (0-360)
 */
function getPocketAngle(pocketNumber, wheelSequence) {
    const index = getPocketIndex(pocketNumber, wheelSequence);
    if (index === -1) return 0;
    const degreesPerPocket = 360 / wheelSequence.length;
    return index * degreesPerPocket;
}

/**
 * Generate realistic spin parameters
 * @returns {object} Animation parameters for the spin
 */
function generateSpinParams() {
    return {
        wheelRotations: 4 + Math.random() * 3,      // 4-7 full wheel spins
        ballRotations: 6 + Math.random() * 4,       // 6-10 ball orbits (opposite direction)
        spinDuration: 4000 + Math.random() * 2000,  // 4-6 seconds total
        // Easing for natural deceleration
        easingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)'
    };
}

/**
 * Calculate the final wheel rotation angle to land on a specific pocket
 * The ball lands at a fixed position (right side, 3 o'clock = 0 degrees from center-right)
 * So we need to rotate the wheel so the target pocket ends up at that position
 * 
 * @param {number|string} targetPocket - The pocket to land on
 * @param {array} wheelSequence - The wheel sequence
 * @param {number} baseRotations - Number of full rotations before landing
 * @returns {number} Final rotation angle in degrees
 */
function calculateFinalWheelAngle(targetPocket, wheelSequence, baseRotations) {
    const index = getPocketIndex(targetPocket, wheelSequence);
    const pocketCount = wheelSequence.length;
    const degreesPerPocket = 360 / pocketCount;
    
    // The pocket's starting angle (where it is initially on the wheel)
    const pocketStartAngle = index * degreesPerPocket;
    
    // Ball lands at 0 degrees (right side / 3 o'clock position)
    // We need the pocket to be at 0 degrees when wheel stops
    // So wheel rotation = baseRotations * 360 - pocketStartAngle
    // This brings the pocket to the 0 degree position
    const finalAngle = (baseRotations * 360) - pocketStartAngle;
    
    return finalAngle;
}

/**
 * Calculate ball rotation angle (opposite direction from wheel)
 * @param {number} baseRotations - Number of full rotations
 * @returns {number} Ball rotation angle in degrees (negative for counter-clockwise)
 */
function calculateBallAngle(baseRotations) {
    // Ball spins opposite direction and ends at 0 degrees (right side)
    return -(baseRotations * 360);
}

/**
 * Generate complete spin animation data
 * @param {array} wheelSequence - The wheel sequence
 * @returns {object} Complete spin data including result and animation params
 */
function generateSpinData(wheelSequence) {
    const result = generateRandomResult(wheelSequence);
    const params = generateSpinParams();
    
    const wheelAngle = calculateFinalWheelAngle(result, wheelSequence, params.wheelRotations);
    const ballAngle = calculateBallAngle(params.ballRotations);
    
    return {
        result: result,
        wheelAngle: wheelAngle,
        ballAngle: ballAngle,
        duration: params.spinDuration,
        easing: params.easingFunction,
        phases: {
            acceleration: params.spinDuration * 0.15,    // 15% - speed up
            fullSpeed: params.spinDuration * 0.35,       // 35% - maintain speed
            deceleration: params.spinDuration * 0.40,    // 40% - slow down
            landing: params.spinDuration * 0.10          // 10% - final settle
        }
    };
}

/**
 * Get neighboring pockets on the wheel
 * @param {number|string} pocketNumber - The center pocket
 * @param {array} wheelSequence - The wheel sequence
 * @param {number} neighbors - Number of neighbors on each side (default 2)
 * @returns {array} Array of neighboring pockets including the center
 */
function getNeighborPockets(pocketNumber, wheelSequence, neighbors = 2) {
    const index = getPocketIndex(pocketNumber, wheelSequence);
    if (index === -1) return [pocketNumber];
    
    const result = [];
    const total = wheelSequence.length;
    
    for (let i = -neighbors; i <= neighbors; i++) {
        const neighborIndex = (index + i + total) % total;
        result.push(wheelSequence[neighborIndex]);
    }
    
    return result;
}

/**
 * Get the wheel sector (Voisins, Orphelins, Tiers, Zero) for European roulette
 * @param {number|string} pocketNumber - The pocket number
 * @returns {string|null} Sector name or null
 */
function getWheelSector(pocketNumber) {
    // Voisins du Zéro (neighbors of zero) - 17 numbers
    const voisins = [0, 2, 3, 4, 7, 12, 15, 18, 19, 21, 22, 25, 26, 28, 29, 32, 35];
    
    // Tiers du Cylindre (thirds of the wheel) - 12 numbers
    const tiers = [5, 8, 10, 11, 13, 16, 23, 24, 27, 30, 33, 36];
    
    // Orphelins (orphans) - 8 numbers
    const orphelins = [1, 6, 9, 14, 17, 20, 31, 34];
    
    const num = typeof pocketNumber === 'string' ? pocketNumber : parseInt(pocketNumber);
    
    if (voisins.includes(num)) return 'voisins';
    if (tiers.includes(num)) return 'tiers';
    if (orphelins.includes(num)) return 'orphelins';
    
    return null;
}
