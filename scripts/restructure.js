#!/usr/bin/env node

// Script chính để tái cấu trúc dự án
const { createDirectoryStructure, createReadmeFiles, createTemplateFiles } = require('./create-structure.js');
const { migrateFiles, updateAllImports, createBackup } = require('./migrate-files.js');

function main() {
    console.log('🏗️ PROJECT RESTRUCTURE TOOL');
    console.log('============================\n');
    
    console.log('This tool will:');
    console.log('1. Create new directory structure');
    console.log('2. Create backup of current files');
    console.log('3. Migrate existing files to new structure');
    console.log('4. Update import paths');
    console.log('5. Create template files\n');
    
    // Hỏi xác nhận
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('Do you want to continue? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            runRestructure();
        } else {
            console.log('❌ Restructure cancelled');
            rl.close();
        }
    });
}

function runRestructure() {
    console.log('\n🚀 Starting restructure process...\n');
    
    try {
        // Step 1: Tạo cấu trúc thư mục
        console.log('Step 1: Creating directory structure...');
        createDirectoryStructure();
        createReadmeFiles();
        createTemplateFiles();
        
        // Step 2: Tạo backup
        console.log('\nStep 2: Creating backup...');
        createBackup();
        
        // Step 3: Di chuyển files
        console.log('\nStep 3: Migrating files...');
        const migrationResult = migrateFiles();
        
        // Step 4: Cập nhật imports
        console.log('\nStep 4: Updating imports...');
        const updateResult = updateAllImports();
        
        // Summary
        console.log('\n🎉 RESTRUCTURE COMPLETED SUCCESSFULLY!');
        console.log('=====================================');
        console.log(`📁 Directories created: Multiple`);
        console.log(`📄 Files moved: ${migrationResult.movedCount}`);
        console.log(`📝 Files updated: ${updateResult}`);
        console.log(`💾 Backup created: Yes`);
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Test the new structure by running the game');
        console.log('2. Check for any remaining import errors');
        console.log('3. Create new entity classes using templates');
        console.log('4. Update any hardcoded paths in your code');
        console.log('5. Review the new structure and customize as needed');
        
        console.log('\n📚 DOCUMENTATION:');
        console.log('- PROJECT_RESTRUCTURE_GUIDE.md - Detailed guide');
        console.log('- src/entities/README.md - Entity structure');
        console.log('- src/animations/README.md - Animation system');
        console.log('- src/data/README.md - Data management');
        
        console.log('\n💡 TIPS:');
        console.log('- Use the template files as starting points');
        console.log('- Follow the naming conventions in the guide');
        console.log('- Test each module as you create it');
        console.log('- Keep the backup until you\'re sure everything works');
        
    } catch (error) {
        console.error('\n❌ ERROR during restructure:', error.message);
        console.log('\n🔄 You can restore from backup if needed');
        console.log('💡 Check the error and try again');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
