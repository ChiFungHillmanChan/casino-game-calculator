# Casino Game Calculator - Code Structure

This document tracks all functions, components, and modules in the codebase to prevent duplication and promote reuse.

---

## Roulette Module (`/roulette`)

### Core Functions (`/roulette/js/core/`)

#### constants.js
| Function/Constant | Purpose | Location |
|------------------|---------|----------|
| `ROULETTE_TYPES` | European and American roulette configurations | constants.js |
| `PAYOUTS` | Payout ratios for all bet types | constants.js |
| `BET_COVERAGE` | Number of winning pockets per bet type | constants.js |
| `RED_NUMBERS` | Set of red numbers (1-36) | constants.js |
| `BLACK_NUMBERS` | Set of black numbers (1-36) | constants.js |
| `CHIP_DENOMINATIONS` | Available chip values | constants.js |
| `TABLE_LAYOUT` | Number arrangement for table rendering | constants.js |
| `COLUMNS` | Column bet number groups | constants.js |
| `DOZENS` | Dozen bet number groups | constants.js |
| `STREETS` | Street bet definitions | constants.js |
| `CORNERS` | Corner bet definitions | constants.js |
| `LINES` | Line bet definitions | constants.js |

#### calculations.js
| Function | Purpose | Location |
|----------|---------|----------|
| `getNumberColor(num)` | Get color (red/black/green) for a number | calculations.js |
| `isEven(num)` | Check if number is even | calculations.js |
| `isOdd(num)` | Check if number is odd | calculations.js |
| `isLow(num)` | Check if number is 1-18 | calculations.js |
| `isHigh(num)` | Check if number is 19-36 | calculations.js |
| `getColumn(num)` | Get column (1/2/3) for a number | calculations.js |
| `getDozen(num)` | Get dozen (1/2/3) for a number | calculations.js |
| `calculateProbability(winning, total)` | Calculate win probability | calculations.js |
| `calculateExpectedValue(payout, winning, total)` | Calculate EV for a bet | calculations.js |
| `calculateWinnings(betAmount, payoutRatio)` | Calculate total return | calculations.js |
| `calculateProfit(betAmount, payoutRatio)` | Calculate profit only | calculations.js |
| `isBetWinner(result, betType, betValue, type)` | Check if bet wins | calculations.js |
| `getPayoutForBet(betType)` | Get payout ratio for bet type | calculations.js |
| `resolveAllBets(result, placedBets, type)` | Resolve all bets for a spin | calculations.js |
| `calculateTotalWagered(placedBets)` | Sum all wagered amounts | calculations.js |
| `validateBetAmount(amount, min, max)` | Validate bet within limits | calculations.js |
| `canAffordBet(amount, stack, wagered)` | Check if player can afford bet | calculations.js |

#### wheel-physics.js
| Function | Purpose | Location |
|----------|---------|----------|
| `generateRandomResult(wheelSequence)` | Generate cryptographic random result | wheel-physics.js |
| `getPocketIndex(pocket, sequence)` | Get index of pocket in wheel | wheel-physics.js |
| `getPocketAngle(pocket, sequence)` | Calculate angle for pocket position | wheel-physics.js |
| `generateSpinParams()` | Generate realistic spin animation params | wheel-physics.js |
| `calculateFinalWheelAngle(target, sequence, rotations)` | Calculate final rotation angle | wheel-physics.js |
| `calculateBallAngle(target, sequence, rotations, wheelAngle)` | Calculate ball rotation | wheel-physics.js |
| `generateSpinData(wheelSequence)` | Generate complete spin animation data | wheel-physics.js |
| `getNeighborPockets(pocket, sequence, count)` | Get neighboring pockets | wheel-physics.js |
| `getWheelSector(pocket)` | Get wheel sector (Voisins, Tiers, etc.) | wheel-physics.js |

### State Management (`/roulette/js/state/`)

#### game-state.js
| Function | Purpose | Location |
|----------|---------|----------|
| `createInitialGameState()` | Create fresh game state | game-state.js |
| `resetGameState()` | Reset to initial state | game-state.js |
| `updateGameConfig(config)` | Update configuration | game-state.js |
| `setGamePhase(phase)` | Set current game phase | game-state.js |
| `initializeBankroll(amount)` | Set starting bankroll | game-state.js |
| `updateBankroll(change)` | Update bankroll after spin | game-state.js |
| `setSelectedChip(value)` | Set selected chip denomination | game-state.js |
| `getSelectedChip()` | Get current selected chip | game-state.js |
| `storeLastBets(bets)` | Store bets for repeat feature | game-state.js |
| `getLastBets()` | Get stored last bets | game-state.js |
| `setSpinData(spinData)` | Set current spin data | game-state.js |
| `clearSpinData()` | Clear spin data | game-state.js |
| `getSpinResult()` | Get current spin result | game-state.js |
| `isSpinning()` | Check if wheel is spinning | game-state.js |
| `getCurrentBankroll()` | Get current bankroll | game-state.js |
| `getSessionProfit()` | Get session profit/loss | game-state.js |
| `getRouletteConfig()` | Get active roulette type config | game-state.js |
| `getGamePhase()` | Get current game phase | game-state.js |
| `isBankrupt()` | Check if player is bankrupt | game-state.js |
| `getAvailableChips()` | Get affordable chip denominations | game-state.js |
| `startGame(config)` | Start new game with config | game-state.js |
| `endGame()` | End current game | game-state.js |

#### bet-state.js
| Function | Purpose | Location |
|----------|---------|----------|
| `createInitialBetState()` | Create fresh bet state | bet-state.js |
| `resetBetState()` | Reset all bets | bet-state.js |
| `addBet(type, value, amount)` | Add a bet | bet-state.js |
| `removeBet(type, value, amount)` | Remove a bet | bet-state.js |
| `clearBet(type, value)` | Clear specific bet | bet-state.js |
| `clearAllBets()` | Clear all bets | bet-state.js |
| `getBetAmount(type, value)` | Get amount on a bet | bet-state.js |
| `getTotalWagered()` | Get total wagered | bet-state.js |
| `hasBets()` | Check if any bets placed | bet-state.js |
| `getAllBets()` | Get copy of all bets | bet-state.js |
| `restoreBets(savedBets, maxBankroll)` | Restore saved bets | bet-state.js |
| `getBetCounts()` | Get count by bet type | bet-state.js |
| `getStraightBetNumbers()` | Get numbers with straight bets | bet-state.js |
| `validateAllBets(min, max)` | Validate against limits | bet-state.js |

#### stats-state.js
| Function | Purpose | Location |
|----------|---------|----------|
| `createInitialStatsState()` | Create fresh stats state | stats-state.js |
| `resetStatsState()` | Reset all stats | stats-state.js |
| `recordSpin(result, wagered, won)` | Record a spin result | stats-state.js |
| `updateStreak(type, value, isValid)` | Update streak tracking | stats-state.js |
| `updateColdNumbers(hitNumber)` | Update cold numbers tracking | stats-state.js |
| `getHotNumbers(count)` | Get most frequent numbers | stats-state.js |
| `getColdNumbers(count)` | Get least frequent numbers | stats-state.js |
| `getRecentHistory(count)` | Get recent spin history | stats-state.js |
| `getFullHistory()` | Get all spin history | stats-state.js |
| `getDistributionPercentages()` | Get distribution as percentages | stats-state.js |
| `getCurrentStreaks()` | Get current streak info | stats-state.js |
| `getSessionStats()` | Get session statistics | stats-state.js |
| `getNumberHits(number)` | Get hit count for number | stats-state.js |
| `getExpectedVsActual(category, expected)` | Compare expected vs actual | stats-state.js |

### UI Functions (`/roulette/js/ui/`)

#### render-wheel.js
| Function | Purpose | Location |
|----------|---------|----------|
| `renderWheel()` | Render the roulette wheel | render-wheel.js |
| `animateWheelSpin(spinData, callback)` | Animate wheel spin | render-wheel.js |
| `positionBallAtPocket(number)` | Position ball at result | render-wheel.js |
| `highlightWinningPocket(number)` | Highlight winning pocket | render-wheel.js |
| `clearWheelWinningState()` | Clear winning highlights | render-wheel.js |
| `resetWheel()` | Reset wheel to initial state | render-wheel.js |

#### render-table.js
| Function | Purpose | Location |
|----------|---------|----------|
| `renderBettingTable()` | Render the betting table | render-table.js |
| `renderZeroSection(isAmerican)` | Render zero section | render-table.js |
| `renderNumbersGrid()` | Render numbers 1-36 | render-table.js |
| `renderColumnBets()` | Render column bet areas | render-table.js |
| `renderDozenBets()` | Render dozen bet areas | render-table.js |
| `renderEvenMoneyBets()` | Render even money bets | render-table.js |
| `initBettingTableHandlers()` | Init table click handlers | render-table.js |
| `renderPlacedChips()` | Render chips on table | render-table.js |
| `renderChipOnElement(element, amount)` | Place chip stack on cell | render-table.js |
| `getChipBreakdown(amount)` | Get chips for amount | render-table.js |
| `highlightWinningNumber(number)` | Highlight winning on table | render-table.js |
| `clearWinningHighlight()` | Clear table highlights | render-table.js |
| `placeWinningMarker(number)` | Place dolly marker on winning number | render-table.js |
| `removeWinningMarker()` | Remove dolly marker with animation | render-table.js |
| `isWinningMarkerVisible()` | Check if dolly marker is displayed | render-table.js |

#### render-chips.js
| Function | Purpose | Location |
|----------|---------|----------|
| `createChipElement(value, size, selected)` | Create chip DOM element | render-chips.js |
| `renderChipRack()` | Render chip selector | render-chips.js |
| `updateChipSelector()` | Update chip selection | render-chips.js |
| `createPlacedChipStack(amount)` | Create placed chip visual | render-chips.js |
| `positionChipStack(stack, cell, table)` | Position chip on cell | render-chips.js |
| `getChipColor(value)` | Get chip color | render-chips.js |
| `clearAllPlacedChips()` | Remove all placed chips | render-chips.js |

#### render-stats.js
| Function | Purpose | Location |
|----------|---------|----------|
| `renderAllStats()` | Render all statistics | render-stats.js |
| `renderHistoryDisplay()` | Render spin history | render-stats.js |
| `renderHotNumbers()` | Render hot numbers | render-stats.js |
| `renderColdNumbers()` | Render cold numbers | render-stats.js |
| `renderDistribution()` | Render distribution bars | render-stats.js |
| `renderStreaks()` | Render streak info | render-stats.js |
| `renderSessionStats()` | Render session stats | render-stats.js |

#### event-handlers.js
| Function | Purpose | Location |
|----------|---------|----------|
| `initEventHandlers()` | Initialize all handlers | event-handlers.js |
| `initSetupHandlers()` | Setup screen handlers | event-handlers.js |
| `handleRouletteTypeChange(e)` | Handle type radio change | event-handlers.js |
| `handleStackPresetClick(e)` | Handle stack preset click | event-handlers.js |
| `handleCustomStackInput(e)` | Handle custom stack input | event-handlers.js |
| `handleSetupSubmit(e)` | Handle form submission | event-handlers.js |
| `initGameControlHandlers()` | Game control handlers | event-handlers.js |
| `handleSpinClick()` | Handle spin button | event-handlers.js |
| `handleClearBets()` | Handle clear button | event-handlers.js |
| `handleRepeatBets()` | Handle repeat button | event-handlers.js |
| `handleNewBets()` | Handle new bets button | event-handlers.js |
| `handleSameBets()` | Handle same bets button | event-handlers.js |
| `handleNewGame()` | Handle new game button | event-handlers.js |
| `handleChipSelect(value)` | Handle chip selection | event-handlers.js |
| `handleBetPlacement(type, value, e)` | Handle bet placement | event-handlers.js |
| `handleBetRemoval(type, value, e)` | Handle bet removal | event-handlers.js |
| `updateButtonStates()` | Update button enabled states | event-handlers.js |
| `updateTotalBetDisplay()` | Update total bet display | event-handlers.js |

#### init.js
| Function | Purpose | Location |
|----------|---------|----------|
| `init()` | Initialize application | init.js |
| `loadComponents()` | Load HTML components | init.js |
| `showSetupScreen()` | Show setup, hide game | init.js |
| `showGameScreen()` | Show game, hide setup | init.js |
| `showResult(result, resolution)` | Show result overlay | init.js |
| `hideResultOverlay()` | Hide result overlay | init.js |
| `showGameOver()` | Show game over overlay | init.js |
| `hideGameOverOverlay()` | Hide game over overlay | init.js |
| `renderBankroll()` | Render bankroll display | init.js |
| `renderChipSelector()` | Render chip selector | init.js |
| `renderStats()` | Render all stats | init.js |

---

## Shared CSS Variables (`/roulette/css/variables.css`)

| Variable | Purpose |
|----------|---------|
| `--bg-primary`, `--bg-secondary`, `--bg-card` | Background colors |
| `--accent-gold`, `--accent-red`, etc. | Accent colors |
| `--text-primary`, `--text-secondary`, `--text-dim` | Text colors |
| `--roulette-red`, `--roulette-black`, `--roulette-green` | Roulette-specific colors |
| `--chip-1` through `--chip-500` | Chip colors |
| `--spacing-xs` through `--spacing-2xl` | Spacing scale |
| `--radius-sm` through `--radius-full` | Border radius scale |
| `--transition-fast`, `--transition-normal`, `--transition-slow` | Transition durations |

---

## Notes

- All core calculation functions are pure (no side effects, no DOM access)
- State is managed centrally in state modules
- UI rendering is separated from logic
- CSS uses custom properties for theming
