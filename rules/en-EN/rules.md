# Game rules

## Components

- 1 game board of 8×8 squares (chessboard)
- Customizable units, miniatures or tokens (1 to 6 per player)
- Descriptive cards (1 per unit)
- 2 obstacle markers (1 per player)
- Damage, status and control markers
- 1 die to determine the first player

## Squad building

Each player assembles their squad while respecting the following constraints:

- **1 to 6 units** maximum
- **100 points** of cumulative cost maximum

Each unit's cost is shown on its descriptive card. It is the game's only
currency: every point spent buys the same value, whatever the unit.

Each unit also bears a **title** (Trooper, Veteran, Elite, Champion, Paragon)
according to its cost band. This title is purely narrative: it dresses the
card and tells the unit's power, but enters no calculation.

| Title        | Unit cost       |
| ------------ | --------------- |
| **Trooper**  | 10 points or less |
| **Veteran**  | 11 to 16 points |
| **Elite**    | 17 to 22 points |
| **Champion** | 23 to 27 points |
| **Paragon**  | 28 points and more |

To make creating and assembling your squads easier, an online application is
available, [**the Barracks**](https://bornholm.github.io/escarmouche/barracks/).

## Unit characteristics

Each unit has 4 main characteristics:

| Characteristic | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| **Health**     | Maximum hit points (when reduced to 0, the unit is eliminated) |
| **Range**      | Maximum attack distance (in squares)                          |
| **Power**      | Damage dealt per attack                                       |
| **Move**       | Number of squares traveled per movement action                |

_Note: distances are counted in squares, **diagonals included** — a diagonal
step counts as one square, for movement as well as for range._

## The central zone

The **4 central squares** of the board (the 2×2 square at the crossing of
columns D-E and rows 4-5) form the **objective zone**. Controlling it is the
main path to victory (see Victory conditions).

## Setup

1. Place the board between the two players
2. **Obstacles**: each player places 1 obstacle marker on a free square of
   their choice, **outside the central zone and outside the deployment zones**
   (that is, on rows 3 to 6). The player who rolled the lowest die places
   theirs first
3. Each player positions their units on **their two first rows**
   (rows 1-2 for one player, rows 7-8 for the other)
4. Units can be placed freely on these starting rows
5. Roll a die to determine who goes first

### Obstacles

- An obstacle square is **impassable**: no unit may stop on it or move
  through it
- An obstacle **blocks line of sight** (full cover)

## Turn sequence

On their turn, the active player performs **exactly 2 actions** among:

### Available actions

- **Movement**: Move a unit up to its Move value
- **Attack**: Attack an enemy unit within range and line of sight
- **Ability**: Activate a special ability (if available)

### Action rules

- The 2 actions can be performed by the **same unit** or **split** between 2 different units
- The same unit can perform several actions in the turn
- **Restriction**: A unit can only perform **1 attack per turn** and activate only **1 ability per turn**
- A unit can therefore **attack and use an ability** in the same turn (if each is performed as a separate action)

### End of turn: zone control

At the **end of their turn**, the active player checks whether they **control
the central zone**: at least one of their units is inside it and **no** enemy
unit is. If so, they gain **1 control marker**.

## Combat

### Attack

1. **Declaration**: Choose a target within range and line of sight
2. **Resolution**: The attack automatically succeeds (unless an ability says otherwise)
3. **Damage**: The target loses a number of Health points equal to the attacker's Power
4. **Elimination**: If Health drops to 0 or below, remove the unit from the board

### Line of sight and cover

- A unit can attack if an **uninterrupted straight line** can be drawn between it and its target
- This line can start from **any corner** of the attacker's square
- **Other units** (allied or enemy) and **obstacles** block line of sight
- **Obstacle = Full cover** (attack impossible)

## Victory conditions

The game is won in either of the following ways:

### Victory by capture

The first player to accumulate **3 control markers** of the central zone
immediately wins the game.

### Victory by elimination

A player who eliminates **all enemy units** immediately wins the game.

> Tip: the central zone forces engagement. Camping in your corner means
> letting your opponent quietly stack up control markers.

## Important rule points

### Movement

- Diagonal movement is allowed
- A unit can stop at any time before using all of its Move
- It is impossible to move through a square occupied by another unit or an obstacle

### Special abilities

- Abilities are a **third type of action**, distinct from Movement and Attack
- Refer to each ability card's specific text for its effects
- Some abilities can modify standard rules or apply status effects

### Status effects

Some abilities apply persistent effects on units. Durations are always read
**from the point of view of the affected unit's owner**:

| Effect | Source | Consequence |
| ------ | ------ | ----------- |
| **Suppression** | Suppressing Fire | The targeted unit can only perform **one single action** on its next turn |
| **Untargetable** | Tactical Retreat | The unit cannot be targeted by attacks until the start of its next turn |
| **Overcharge** | Overcharge | The unit cannot attack on its next turn |
| **Defensive Stance** | Defensive Stance | The next point of damage dealt to the unit is canceled (not stackable) |
| **Protection** | Guardian | Damage received by an adjacent allied unit is redirected to the guardian unit until the start of its next turn |
