#!/usr/bin/env node

// Script để di chuyển files từ cấu trúc cũ sang cấu trúc mới
const fs = require('fs');
const path = require('path');

const migrationMap = {
    // Core ECS
    'src/ecs/world.js': 'src/core/ECS/world.js',
    'src/ecs/EntityFactory.js': 'src/core/ECS/EntityFactory.js',
    
    // ECS Systems
    'src/ecs/systems/MovementSystem.js': 'src/core/ECS/systems/MovementSystem.js',
    'src/ecs/systems/RenderSystem.js': 'src/core/ECS/systems/RenderSystem.js',
    'src/ecs/systems/AnimationSystem.js': 'src/core/ECS/systems/AnimationSystem.js',
    'src/ecs/systems/BehaviorSystem.js': 'src/core/ECS/systems/BehaviorSystem.js',
    'src/ecs/systems/AISystem.js': 'src/core/ECS/systems/AISystem.js',
    'src/ecs/systems/CombatSystem.js': 'src/core/ECS/systems/CombatSystem.js',
    'src/ecs/systems/CombatResponseSystem.js': 'src/core/ECS/systems/CombatResponseSystem.js',
    'src/ecs/systems/CollisionSystem.js': 'src/core/ECS/systems/CollisionSystem.js',
    'src/ecs/systems/SteeringSystem.js': 'src/core/ECS/systems/SteeringSystem.js',
    'src/ecs/systems/HarvestSystem.js': 'src/core/ECS/systems/HarvestSystem.js',
    'src/ecs/systems/FactionSystem.js': 'src/core/ECS/systems/FactionSystem.js',
    
    // Managers
    'src/managers/GridManager.js': 'src/core/managers/GridManager.js',
    'src/managers/PathfindingManager.js': 'src/core/managers/PathfindingManager.js',
    'src/managers/ResourceManager.js': 'src/core/managers/ResourceManager.js',
    'src/managers/FogOfWarManager.js': 'src/core/managers/FogOfWarManager.js',
    'src/managers/FormationManager.js': 'src/core/managers/FormationManager.js',
    'src/managers/SpatialHashGrid.js': 'src/core/managers/SpatialHashGrid.js',
    'src/managers/WorldManager.js': 'src/core/managers/WorldManager.js',
    'src/managers/EventManager.js': 'src/core/managers/EventManager.js',
    'src/managers/FactionManager.js': 'src/core/managers/FactionManager.js',
    'src/managers/AnimationManager.js': 'src/animations/AnimationManager.js',
    'src/managers/SpriteSheetManager.js': 'src/animations/SpriteSheetManager.js',
    
    // Components - Common
    'src/ecs/components/Position.js': 'src/entities/components/common/Position.js',
    'src/ecs/components/Health.js': 'src/entities/components/common/Health.js',
    'src/ecs/components/Appearance.js': 'src/entities/components/common/Appearance.js',
    'src/ecs/components/Animation.js': 'src/entities/components/common/Animation.js',
    'src/ecs/components/Selectable.js': 'src/entities/components/common/Selectable.js',
    'src/ecs/components/Selected.js': 'src/entities/components/common/Selected.js',
    'src/ecs/components/PlayerUnit.js': 'src/entities/components/common/PlayerUnit.js',
    'src/ecs/components/EntityType.js': 'src/entities/components/common/EntityType.js',
    
    // Components - Units
    'src/ecs/components/CombatStats.js': 'src/entities/components/units/CombatStats.js',
    'src/ecs/components/AI.js': 'src/entities/components/units/AI.js',
    'src/ecs/components/Behavior.js': 'src/entities/components/units/Behavior.js',
    'src/ecs/components/Harvester.js': 'src/entities/components/units/Harvester.js',
    'src/ecs/components/Velocity.js': 'src/entities/components/units/Velocity.js',
    'src/ecs/components/MoveTarget.js': 'src/entities/components/units/MoveTarget.js',
    'src/ecs/components/AttackMoveTarget.js': 'src/entities/components/units/AttackMoveTarget.js',
    'src/ecs/components/ClickBehavior.js': 'src/entities/components/units/ClickBehavior.js',
    'src/ecs/components/CombatResponse.js': 'src/entities/components/units/CombatResponse.js',
    'src/ecs/components/DefencePosition.js': 'src/entities/components/units/DefencePosition.js',
    
    // Components - Buildings
    'src/ecs/components/Building.js': 'src/entities/components/buildings/Building.js',
    
    // Components - Resources
    'src/ecs/components/ResourceNode.js': 'src/entities/components/resources/ResourceNode.js',
    'src/ecs/components/ResourceStorage.js': 'src/entities/components/resources/ResourceStorage.js',
    
    // Factions
    'src/ecs/components/Faction.js': 'src/factions/Faction.js',
    
    // Data
    'src/data/AnimationConfigs.json': 'src/animations/configs/AnimationConfigs.json'
};

const importUpdates = {
    // Core ECS imports
    '../ecs/world.js': '../core/ECS/world.js',
    '../ecs/EntityFactory.js': '../core/ECS/EntityFactory.js',
    
    // System imports
    '../ecs/systems/MovementSystem.js': '../core/ECS/systems/MovementSystem.js',
    '../ecs/systems/RenderSystem.js': '../core/ECS/systems/RenderSystem.js',
    '../ecs/systems/AnimationSystem.js': '../core/ECS/systems/AnimationSystem.js',
    '../ecs/systems/BehaviorSystem.js': '../core/ECS/systems/BehaviorSystem.js',
    '../ecs/systems/AISystem.js': '../core/ECS/systems/AISystem.js',
    '../ecs/systems/CombatSystem.js': '../core/ECS/systems/CombatSystem.js',
    '../ecs/systems/CombatResponseSystem.js': '../core/ECS/systems/CombatResponseSystem.js',
    '../ecs/systems/CollisionSystem.js': '../core/ECS/systems/CollisionSystem.js',
    '../ecs/systems/SteeringSystem.js': '../core/ECS/systems/SteeringSystem.js',
    '../ecs/systems/HarvestSystem.js': '../core/ECS/systems/HarvestSystem.js',
    '../ecs/systems/FactionSystem.js': '../core/ECS/systems/FactionSystem.js',
    
    // Manager imports
    '../managers/GridManager.js': '../core/managers/GridManager.js',
    '../managers/PathfindingManager.js': '../core/managers/PathfindingManager.js',
    '../managers/ResourceManager.js': '../core/managers/ResourceManager.js',
    '../managers/FogOfWarManager.js': '../core/managers/FogOfWarManager.js',
    '../managers/FormationManager.js': '../core/managers/FormationManager.js',
    '../managers/SpatialHashGrid.js': '../core/managers/SpatialHashGrid.js',
    '../managers/WorldManager.js': '../core/managers/WorldManager.js',
    '../managers/EventManager.js': '../core/managers/EventManager.js',
    '../managers/FactionManager.js': '../core/managers/FactionManager.js',
    '../managers/AnimationManager.js': '../animations/AnimationManager.js',
    '../managers/SpriteSheetManager.js': '../animations/SpriteSheetManager.js',
    
    // Component imports
    '../ecs/components/Position.js': '../entities/components/common/Position.js',
    '../ecs/components/Health.js': '../entities/components/common/Health.js',
    '../ecs/components/Appearance.js': '../entities/components/common/Appearance.js',
    '../ecs/components/Animation.js': '../entities/components/common/Animation.js',
    '../ecs/components/Selectable.js': '../entities/components/common/Selectable.js',
    '../ecs/components/Selected.js': '../entities/components/common/Selected.js',
    '../ecs/components/PlayerUnit.js': '../entities/components/common/PlayerUnit.js',
    '../ecs/components/EntityType.js': '../entities/components/common/EntityType.js',
    '../ecs/components/CombatStats.js': '../entities/components/units/CombatStats.js',
    '../ecs/components/AI.js': '../entities/components/units/AI.js',
    '../ecs/components/Behavior.js': '../entities/components/units/Behavior.js',
    '../ecs/components/Harvester.js': '../entities/components/units/Harvester.js',
    '../ecs/components/Velocity.js': '../entities/components/units/Velocity.js',
    '../ecs/components/MoveTarget.js': '../entities/components/units/MoveTarget.js',
    '../ecs/components/AttackMoveTarget.js': '../entities/components/units/AttackMoveTarget.js',
    '../ecs/components/ClickBehavior.js': '../entities/components/units/ClickBehavior.js',
    '../ecs/components/CombatResponse.js': '../entities/components/units/CombatResponse.js',
    '../ecs/components/DefencePosition.js': '../entities/components/units/DefencePosition.js',
    '../ecs/components/Building.js': '../entities/components/buildings/Building.js',
    '../ecs/components/ResourceNode.js': '../entities/components/resources/ResourceNode.js',
    '../ecs/components/ResourceStorage.js': '../entities/components/resources/ResourceStorage.js',
    '../ecs/components/Faction.js': '../factions/Faction.js',
    
    // Data imports
    '../data/AnimationConfigs.json': '../animations/configs/AnimationConfigs.json'
};

function moveFile(sourcePath, destPath) {
    const sourceFullPath = path.join(process.cwd(), sourcePath);
    const destFullPath = path.join(process.cwd(), destPath);
    const destDir = path.dirname(destFullPath);
    
    if (!fs.existsSync(sourceFullPath)) {
        console.log(`⚠️  Source not found: ${sourcePath}`);
        return false;
    }
    
    // Tạo thư mục đích nếu chưa có
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Di chuyển file
    fs.renameSync(sourceFullPath, destFullPath);
    console.log(`✅ Moved: ${sourcePath} → ${destPath}`);
    return true;
}

function updateImportsInFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
        return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let updated = false;
    
    // Cập nhật imports
    for (const [oldImport, newImport] of Object.entries(importUpdates)) {
        const regex = new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (content.includes(oldImport)) {
            content = content.replace(regex, newImport);
            updated = true;
        }
    }
    
    if (updated) {
        fs.writeFileSync(fullPath, content);
        console.log(`📝 Updated imports in: ${filePath}`);
        return true;
    }
    
    return false;
}

function migrateFiles() {
    console.log('🔄 Starting file migration...\n');
    
    let movedCount = 0;
    let skippedCount = 0;
    
    for (const [sourcePath, destPath] of Object.entries(migrationMap)) {
        if (moveFile(sourcePath, destPath)) {
            movedCount++;
        } else {
            skippedCount++;
        }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Moved: ${movedCount} files`);
    console.log(`   Skipped: ${skippedCount} files`);
    console.log(`   Total: ${movedCount + skippedCount} files`);
    
    return { movedCount, skippedCount };
}

function updateAllImports() {
    console.log('\n📝 Updating import paths...\n');
    
    const filesToUpdate = [
        'src/scenes/DemoScene.js',
        'src/core/ECS/EntityFactory.js',
        'src/core/ECS/systems/RenderSystem.js',
        'src/core/ECS/systems/AnimationSystem.js',
        'src/animations/AnimationManager.js',
        'src/animations/SpriteSheetManager.js'
    ];
    
    let updatedCount = 0;
    
    for (const filePath of filesToUpdate) {
        if (updateImportsInFile(filePath)) {
            updatedCount++;
        }
    }
    
    console.log(`\n📊 Import Update Summary:`);
    console.log(`   Updated: ${updatedCount} files`);
    
    return updatedCount;
}

function createBackup() {
    console.log('💾 Creating backup...\n');
    
    const backupDir = path.join(process.cwd(), 'backup_' + new Date().toISOString().slice(0, 10));
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    
    // Backup các thư mục quan trọng
    const dirsToBackup = ['src/ecs', 'src/managers', 'src/data'];
    
    for (const dir of dirsToBackup) {
        const sourceDir = path.join(process.cwd(), dir);
        const destDir = path.join(backupDir, dir);
        
        if (fs.existsSync(sourceDir)) {
            // Copy recursive
            copyDir(sourceDir, destDir);
            console.log(`✅ Backed up: ${dir}`);
        }
    }
    
    console.log(`\n💾 Backup created at: ${backupDir}`);
}

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function main() {
    console.log('🚀 Starting file migration...\n');
    
    try {
        // Tạo backup trước
        createBackup();
        
        // Di chuyển files
        const migrationResult = migrateFiles();
        
        // Cập nhật imports
        const updateResult = updateAllImports();
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Test the migrated files');
        console.log('   2. Fix any remaining import issues');
        console.log('   3. Update any hardcoded paths');
        console.log('   4. Create new entity classes');
        console.log('\n💡 See PROJECT_RESTRUCTURE_GUIDE.md for detailed instructions');
        
    } catch (error) {
        console.error('❌ Error during migration:', error.message);
        console.log('\n🔄 You can restore from backup if needed');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { migrateFiles, updateAllImports, createBackup };

