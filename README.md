# Stock Surfer 🚀📈

A cyberpunk-themed 3D space flight game where you navigate through procedurally generated terrain influenced by real-time cryptocurrency market data. Built with React Three Fiber and powered by live market feeds.

<p>
  <img src="https://img.shields.io/badge/React-19.0.0-blue?style=flat&colorA=18181B&colorB=28CF8D" alt="React Version">
  <img src="https://img.shields.io/badge/Three.js-0.173.0-green?style=flat&colorA=18181B&colorB=28CF8D" alt="Three.js Version">
  <img src="https://img.shields.io/badge/R3F-9.0.4-orange?style=flat&colorA=18181B&colorB=28CF8D" alt="React Three Fiber Version">
  <img src="https://img.shields.io/badge/Vite-6.2.0-purple?style=flat&colorA=18181B&colorB=28CF8D" alt="Vite Version">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat&colorA=18181B&colorB=28CF8D" alt="License">
</p>

## 🎮 Game Overview

Stock Surfer combines the thrill of 3D space flight with the unpredictability of cryptocurrency markets. Your spaceship navigates through an endless cyberpunk landscape where terrain difficulty, obstacles, and game speed are dynamically generated based on real-time market volatility.

### 🎯 Core Concept

- **Market-Driven Gameplay**: Real-time crypto price data from the Pyth Network influences terrain generation
- **Dynamic Difficulty**: Higher market volatility creates more challenging obstacles and terrain
- **Survival Challenge**: Navigate your ship through an endless procedurally generated world
- **Score System**: Survive longer to achieve higher scores, with bonus multipliers for risky flying

## 🌟 Key Features

### 🎪 Market Integration

- **Real-Time Data**: Live cryptocurrency price feeds (BTC, SOL, ETH)
- **Volatility-Based Terrain**: Market volatility directly affects obstacle height and density
- **Price-Responsive Speed**: Terrain moves faster when prices drop, slower when they rise
- **Dynamic Difficulty**: Automatic difficulty scaling based on market conditions

### 🚀 Gameplay Features

- **3D Space Flight**: Full 6-DOF movement with realistic physics
- **Dual Camera Modes**: First-person cockpit view and third-person chase cam
- **Laser Sight System**: Visual targeting aid for navigation
- **Floor Proximity Bonus**: Risk/reward system for flying dangerously low
- **Explosive Collisions**: Spectacular particle effects when you crash
- **Thruster Effects**: Visual feedback for ship movement

### 🎨 Visual & Audio

- **Cyberpunk Aesthetic**: Neon colors, glowing materials, and futuristic design
- **Dynamic Background**: Psychedelic sphere that responds to price trends
- **Adaptive Audio**: Music tempo changes based on game speed
- **Post-Processing Effects**: Bloom, chromatic aberration, and noise effects
- **Particle Systems**: Explosions, thrusters, and environmental effects

## 🎮 How to Play

### 🛸 Controls

- **Movement**: `WASD` or `Arrow Keys`
  - `W/↑`: Move up
  - `S/↓`: Move down
  - `A/←`: Move left (with banking)
  - `D/→`: Move right (with banking)
- **Thrust**: `Space` - Vertical boost
- **Camera**: `F` - Toggle first-person/third-person view
- **Debug**: `O` - Toggle orbit controls (development mode)

### 🎯 Objective

1. **Survive**: Avoid colliding with the procedurally generated obstacles
2. **Score Points**: Stay alive as long as possible to increase your score
3. **Take Risks**: Fly close to the ground for bonus score multipliers
4. **Adapt**: Adjust your strategy based on changing market conditions

### 📊 Scoring System

- **Base Score**: Increases over time based on survival duration
- **Speed Multiplier**: Higher terrain speed = higher score potential
- **Floor Proximity Bonus**: Up to 300% bonus for flying dangerously low
- **Difficulty Multiplier**: More volatile markets = higher score potential

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/stock-surfer.git
cd stock-surfer

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

Visit `http://localhost:5173` to start playing!

## 🛠️ Technical Stack

### Core Technologies

- **React 19**: Latest React features and concurrent rendering
- **React Three Fiber**: Declarative 3D graphics with Three.js
- **Three.js**: WebGL-based 3D rendering engine
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server

### 3D & Physics

- **@react-three/drei**: Useful helpers and abstractions for R3F
- **@react-three/rapier**: Physics simulation and collision detection
- **Custom Shaders**: GLSL shaders for visual effects

### Market Data

- **Pyth Network**: Real-time cryptocurrency price feeds
- **WebSocket Streams**: Live market data integration
- **Volatility Calculation**: Custom algorithms for difficulty scaling

### Audio & Effects

- **Web Audio API**: Dynamic music and sound effects
- **Post-Processing**: Custom shader-based visual effects
- **Particle Systems**: Explosions and environmental effects

## 📁 Project Structure

```
stock-surfer/
├── public/                 # Static assets
│   ├── models/            # 3D models (ship.gltf)
│   ├── fonts/             # Custom fonts (Orbitron family)
│   ├── sounds/            # Audio files
│   └── textures/          # Image textures
├── src/
│   ├── components/        # React Three Fiber components
│   │   ├── SpaceFighter.tsx      # Player ship with physics
│   │   ├── EndlessTerrain.tsx    # Procedural terrain generation
│   │   ├── GameUI.tsx            # In-game user interface
│   │   ├── PriceFeed.tsx         # Market data integration
│   │   ├── AssetSelector.tsx     # Cryptocurrency selection
│   │   ├── Explosion.tsx         # Particle explosion effects
│   │   └── CyberpunkEffects.tsx  # Post-processing pipeline
│   ├── shaders/           # Custom GLSL shaders
│   ├── utils/             # Utility functions
│   │   ├── priceUtils.ts         # Market data processing
│   │   └── audioUtils.ts         # Audio management
│   ├── Game.tsx           # Main game orchestration
│   └── index.tsx          # Application entry point
└── docs/                  # Documentation
```

## 🎨 Game Mechanics Deep Dive

### Market Data Integration

The game connects to the Pyth Network to fetch real-time cryptocurrency prices. Market volatility is calculated using a rolling window of price changes, which directly influences:

- **Terrain Height**: More volatile markets create taller obstacles
- **Obstacle Density**: Higher volatility increases the number of barriers
- **Game Speed**: Price movements affect terrain scrolling speed
- **Difficulty Multiplier**: Volatile conditions increase score potential

### Physics & Movement

The spaceship uses realistic physics simulation with:

- **Momentum Conservation**: Smooth, inertial movement
- **Banking Mechanics**: Ship rolls when turning left/right
- **Gravity Effects**: Constant downward force requiring thrust to counter
- **Collision Detection**: Hull-based collision with terrain objects

### Visual Effects Pipeline

- **Cyberpunk Shaders**: Custom GLSL for neon glow effects
- **Dynamic Lighting**: Responsive to market trends
- **Particle Systems**: Real-time explosion and thruster effects
- **Post-Processing**: Bloom, noise, and chromatic aberration

## 🏆 Tips for High Scores

1. **Master the Controls**: Practice smooth movement and banking
2. **Watch the Markets**: Anticipate difficulty changes from volatility
3. **Risk vs. Reward**: Fly low for bonus points, but stay safe
4. **Use Both Camera Modes**: Switch between views for different advantages
5. **Study the Patterns**: Learn how different assets affect terrain generation

## 🤝 Contributing

We welcome contributions! Here are ways you can help:

- **Bug Reports**: Found an issue? Open a GitHub issue
- **Feature Requests**: Have ideas? We'd love to hear them
- **Code Contributions**: Submit pull requests for improvements
- **Asset Creation**: Help with 3D models, textures, or audio

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Pyth Network** for real-time market data
- **React Three Fiber** community for excellent 3D tools
- **Three.js** for powerful WebGL rendering
- **@jay_wooow** for game concept and development

---

**Ready to surf the market waves in style? 🏄‍♂️📈**

Built with ❤️ for the intersection of gaming and DeFi.
