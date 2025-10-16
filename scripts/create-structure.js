#!/usr/bin/env node

// Script để tạo cấu trúc thư mục mới cho dự án
const fs = require('fs');
const path = require('path');

const projectStructure = {
    'src/core/ECS/systems': [],
    'src/core/managers': [],
    'src/entities/components/common': [],
    'src/entities/components/units': [],
    'src/entities/components/buildings': [],
    'src/entities/components/resources': [],
    'src/entities/units/player': [],
    'src/entities/units/enemy': [],
    'src/entities/units/neutral': [],
    'src/entities/buildings/military': [],
    'src/entities/buildings/economic': [],
    'src/entities/buildings/special': [],
    'src/entities/resources/natural': [],
    'src/entities/resources/animals': [],
    'src/factions/races': [],
    'src/factions/tribes': [],
    'src/animations/configs/units': [],
    'src/animations/configs/buildings': [],
    'src/animations/configs/animals': [],
    'src/animations/sprites/units': [],
    'src/animations/sprites/buildings': [],
    'src/animations/sprites/animals': [],
    'src/commands/types': [],
    'src/commands/behaviors': [],
    'src/ui/components': [],
    'src/ui/styles': [],
    'src/data/units': [],
    'src/data/buildings': [],
    'src/data/factions': [],
    'src/data/game': [],
    'src/utils': []
};

function createDirectoryStructure() {
    console.log('🏗️ Creating new project structure...');
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const dirPath of Object.keys(projectStructure)) {
        const fullPath = path.join(process.cwd(), dirPath);
        
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`✅ Created: ${dirPath}`);
            createdCount++;
        } else {
            console.log(`⚠️  Already exists: ${dirPath}`);
            existingCount++;
        }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${createdCount} directories`);
    console.log(`   Already existed: ${existingCount} directories`);
    console.log(`   Total: ${createdCount + existingCount} directories`);
}

function createReadmeFiles() {
    console.log('\n📝 Creating README files...');
    
    const readmeFiles = {
        'src/entities/README.md': `# 🎭 Entities

Thư mục chứa tất cả các entities trong game.

## 📁 Cấu trúc:
- \`components/\` - Các components ECS
- \`units/\` - Các loại đơn vị
- \`buildings/\` - Các loại công trình
- \`resources/\` - Các loại tài nguyên

## 🚀 Cách sử dụng:
\`\`\`javascript
import { Soldier } from './units/player/Soldier.js';
const soldierId = Soldier.create(ecsWorld, 100, 100);
\`\`\`
`,

        'src/entities/units/README.md': `# 🪖 Units

Thư mục chứa các loại đơn vị trong game.

## 📁 Cấu trúc:
- \`player/\` - Units của player
- \`enemy/\` - Units của enemy  
- \`neutral/\` - Units trung lập

## 🎯 Ví dụ:
\`\`\`javascript
// Tạo soldier
const soldierId = Soldier.create(ecsWorld, x, y, 'human');

// Tạo archer
const archerId = Archer.create(ecsWorld, x, y, 'elf');
\`\`\`
`,

        'src/entities/buildings/README.md': `# 🏰 Buildings

Thư mục chứa các loại công trình trong game.

## 📁 Cấu trúc:
- \`military/\` - Công trình quân sự
- \`economic/\` - Công trình kinh tế
- \`special/\` - Công trình đặc biệt

## 🎯 Ví dụ:
\`\`\`javascript
// Tạo barracks
const barracksId = Barracks.create(ecsWorld, gridX, gridY, 'human');

// Tạo tower
const towerId = Tower.create(ecsWorld, gridX, gridY, 'elf');
\`\`\`
`,

        'src/animations/README.md': `# 🎬 Animations

Thư mục chứa hệ thống animation và sprite sheets.

## 📁 Cấu trúc:
- \`configs/\` - Animation configs (JSON)
- \`sprites/\` - Sprite sheets (PNG)
- \`AnimationManager.js\` - Quản lý animations
- \`SpriteSheetManager.js\` - Quản lý sprite sheets

## 🎯 Ví dụ:
\`\`\`javascript
// Load sprite sheet
animationManager.loadSpriteSheet('soldier', 'assets/sprites/soldier.png');

// Play animation
animationManager.playAnimation(entityId, 'soldier_move_right');
\`\`\`
`,

        'src/data/README.md': `# 📊 Data & Configs

Thư mục chứa các file config và data cho game.

## 📁 Cấu trúc:
- \`units/\` - Config cho units
- \`buildings/\` - Config cho buildings
- \`factions/\` - Config cho factions
- \`game/\` - Config cho game

## 🎯 Ví dụ:
\`\`\`javascript
// Load unit config
const soldierConfig = await import('./units/soldier.json');

// Load faction config
const humanConfig = await import('./factions/human.json');
\`\`\`
`
    };
    
    for (const [filePath, content] of Object.entries(readmeFiles)) {
        const fullPath = path.join(process.cwd(), filePath);
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Created: ${filePath}`);
    }
}

function createTemplateFiles() {
    console.log('\n📄 Creating template files...');
    
    const templates = {
        'src/entities/units/player/Soldier.js': `// Soldier Unit - Player
import { Position } from '../../components/common/Position.js';
import { Health } from '../../components/common/Health.js';
import { Appearance } from '../../components/common/Appearance.js';
import { Animation } from '../../components/common/Animation.js';
import { CombatStats } from '../../components/units/CombatStats.js';
import { AI } from '../../components/units/AI.js';
import { Behavior } from '../../components/units/Behavior.js';
import { Faction } from '../../../factions/Faction.js';

export class Soldier {
    static create(ecsWorld, x, y, faction = 'human') {
        const entityId = ecsWorld.createEntity();
        
        // Base components
        ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x00ff00, 12, 'circle'));
        
        // Unit-specific components
        ecsWorld.addComponent(entityId, 'combatStats', new CombatStats(20, 50, 1000));
        ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 150 }));
        ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        
        // Faction
        ecsWorld.addComponent(entityId, 'faction', new Faction(faction, 'kingdom'));
        
        // Animation
        ecsWorld.addComponent(entityId, 'animation', new Animation('soldier', 'idle', 'down'));
        
        console.log(\`🪖 Created soldier at (\${x}, \${y})\`);
        return entityId;
    }
}
`,

        'src/entities/buildings/military/Barracks.js': `// Barracks Building - Military
import { Position } from '../../components/common/Position.js';
import { Health } from '../../components/common/Health.js';
import { Appearance } from '../../components/common/Appearance.js';
import { Building } from '../../components/buildings/Building.js';
import { Production } from '../../components/buildings/Production.js';
import { Faction } from '../../../factions/Faction.js';

export class Barracks {
    static create(ecsWorld, gridX, gridY, faction = 'human') {
        const entityId = ecsWorld.createEntity();
        
        // Calculate world position
        const tileSize = ecsWorld.scene.gridManager.tileSize;
        const buildingSize = 3; // 3x3 tiles
        const worldX = gridX * tileSize + (buildingSize * tileSize) / 2;
        const worldY = gridY * tileSize + (buildingSize * tileSize) / 2;
        
        // Base components
        ecsWorld.addComponent(entityId, 'position', new Position(worldX, worldY));
        ecsWorld.addComponent(entityId, 'health', new Health(800, 800));
        ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x228B22, 32, 'rectangle'));
        
        // Building-specific components
        ecsWorld.addComponent(entityId, 'building', new Building());
        ecsWorld.addComponent(entityId, 'production', new Production(['soldier', 'archer']));
        
        // Faction
        ecsWorld.addComponent(entityId, 'faction', new Faction(faction, 'kingdom'));
        
        // Mark grid as occupied
        for (let x = gridX; x < gridX + buildingSize; x++) {
            for (let y = gridY; y < gridY + buildingSize; y++) {
                ecsWorld.scene.gridManager.setTileOccupied(x, y, entityId);
            }
        }
        
        console.log(\`🏰 Created barracks at (\${worldX}, \${worldY})\`);
        return entityId;
    }
}
`,

        'src/data/units/soldier.json': `{
  "name": "Soldier",
  "type": "unit",
  "faction": "human",
  "stats": {
    "health": 100,
    "damage": 20,
    "speed": 150,
    "attackRange": 50,
    "attackRate": 1000
  },
  "cost": {
    "gold": 50,
    "wood": 25
  },
  "production": {
    "time": 30000,
    "building": "barracks"
  },
  "animation": {
    "idle": {
      "frames": 4,
      "frameRate": 8,
      "repeat": -1
    },
    "move": {
      "frames": 8,
      "frameRate": 12,
      "repeat": -1,
      "directions": ["up", "down", "left", "right"]
    },
    "attack": {
      "frames": 6,
      "frameRate": 15,
      "repeat": 0,
      "directions": ["up", "down", "left", "right"]
    }
  }
}`,

        'src/data/buildings/barracks.json': `{
  "name": "Barracks",
  "type": "building",
  "faction": "human",
  "stats": {
    "health": 800,
    "size": [3, 3]
  },
  "cost": {
    "gold": 200,
    "wood": 150,
    "stone": 100
  },
  "production": {
    "units": ["soldier", "archer", "knight"]
  },
  "requirements": {
    "level": 1,
    "buildings": []
  }
}`
    };
    
    for (const [filePath, content] of Object.entries(templates)) {
        const fullPath = path.join(process.cwd(), filePath);
        const dir = path.dirname(fullPath);
        
        // Tạo thư mục nếu chưa có
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Created: ${filePath}`);
    }
}

function main() {
    console.log('🚀 Starting project restructure...\n');
    
    try {
        createDirectoryStructure();
        createReadmeFiles();
        createTemplateFiles();
        
        console.log('\n🎉 Project restructure completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Review the new structure');
        console.log('   2. Move existing files to new locations');
        console.log('   3. Update import paths');
        console.log('   4. Test the new structure');
        console.log('\n💡 See PROJECT_RESTRUCTURE_GUIDE.md for detailed instructions');
        
    } catch (error) {
        console.error('❌ Error during restructure:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createDirectoryStructure, createReadmeFiles, createTemplateFiles };
