# Cup Drop Prototype

A Plinko-style 2D physics mini-game prototype for Cup Heroes, built with Unity.

## Requirements

- **Unity 2022.3 LTS** (or compatible 2022.x version)
- 2D Core template recommended

## Project Structure

```
unity/
├── Assets/
│   ├── Scenes/          # Scene files
│   ├── Prefabs/         # Reusable prefabs (Cup, Pin, MultiplierSlot)
│   ├── Scripts/
│   │   └── CupDrop/     # All Cup Drop gameplay scripts
│   └── Sprites/         # (Optional) Sprite assets
├── ProjectSettings/     # Unity project configuration
└── Packages/            # External packages manifest
```

## Setup Guide

### Step 1: Scene and Camera Setup

1. Create a new scene (e.g., `CupDropDemo.unity`)
2. Select the Main Camera and set:
   - **Projection**: Orthographic
   - **Orthographic Size**: 6
   - **Position**: (0, 0, -10)

### Step 2: Board Generation

1. Create a new empty GameObject named `Board`
2. Attach the `BoardLayoutGenerator` component
3. Create a Pin prefab:
   - Add `SpriteRenderer` with a small circle sprite
   - Add `CircleCollider2D` (radius ~0.15, no trigger)
   - Add `Pin` script component
   - Assign to BoardLayoutGenerator's `pinPrefab` field
4. Set BoardLayoutGenerator parameters:
   - Rows: 8
   - Columns: 7
   - Spacing X: 1.0
   - Spacing Y: 0.8
5. Right-click on BoardLayoutGenerator in Inspector → **Generate Board**

### Step 3: Cup Drop Controller

1. Create a new empty GameObject named `DropController`
2. Attach the `CupDropController` component
3. Create a Cup prefab:
   - Add `SpriteRenderer` with a small circle sprite (different color)
   - Add `Rigidbody2D`:
     - Body Type: Dynamic
     - Gravity Scale: 1.0
     - Constraints: Freeze Rotation Z
   - Add `CircleCollider2D` (radius ~0.15, **not** a trigger)
   - Add `Cup` script component
   - Assign to CupDropController's `cupPrefab` field
4. Create a child GameObject `Indicator`:
   - Add `SpriteRenderer` with an arrow sprite or small marker
   - Assign to CupDropController's `indicator` field
5. Set CupDropController parameters:
   - Drop Zone Y: 5
   - Min X: -4
   - Max X: 4
   - Move Speed: 5
   - Drops Per Round: 3

### Step 4: Multiplier Slots

1. Create 7 new empty GameObjects at the bottom of the board (Y position ~-2)
2. Space them evenly across the X axis (e.g., X: -3, -2, -1, 0, 1, 2, 3)
3. For each slot:
   - Add `BoxCollider2D`:
     - Size: (0.8, 0.5)
     - **Is Trigger**: ON
   - Add `MultiplierSlot` script component
   - Set multiplier values: [10, 5, 3, 2, 3, 5, 10]
   - Parent to a container or board for organization

### Step 5: UI Setup

1. Create a Canvas in the scene
2. Create a Button child (rename to "StartRoundButton"):
   - Set text to "Start Round"
   - Position in an appropriate UI area
3. Create two TextMeshPro Text objects:
   - `BallCountText` — displays total balls collected
   - `DropsRemainingText` — displays remaining drops
4. Create a new empty GameObject `UIController`
5. Attach `CupDropDemoUI` component:
   - Assign `CupDropController` reference
   - Assign `ballCountText` reference
   - Assign `dropsRemainingText` reference
6. In the Button's Inspector:
   - Add OnClick event
   - Drag UIController into the object slot
   - Select `CupDropDemoUI` → `OnStartRoundClicked()`

## Controls

- **Move Left/Right**: Mouse X movement or A/D keys
- **Drop Cup**: Left mouse click or Spacebar
- **Start Round**: Click "Start Round" button in UI

## Gameplay Loop

1. Click "Start Round" to reset the UI and prepare for drops
2. Move the indicator left/right to position
3. Click or press Space to drop the cup
4. The cup falls through pins and lands in a multiplier slot
5. The total is calculated and displayed
6. Repeat until all 3 drops are used
7. Round finishes and shows the total balls collected

## Physics Notes

- Pins are **not** triggers; they cause normal collisions
- Multiplier slots **are** triggers (isTrigger = true)
- Cups have gravity enabled (Gravity Scale = 1.0)
- Cup collision resolution is handled by the Cup script to avoid double-counting

## Extending the Prototype

- Add particle effects on cup collision with pins
- Implement sound effects for drops and multiplier hits
- Create an animation for the indicator movement
- Add combo multipliers for consecutive high-value drops
- Implement a persistent game state system

## Notes

- All scripts are in the `CupHero.CupDrop` namespace
- No external dependencies required
- Gizmos are drawn in editor for debugging (pins and multiplier values)
