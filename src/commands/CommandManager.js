// src/commands/CommandManager.js

import { 
    AttackCommand, 
    StopCommand, 
    DefenceCommand, 
    PatrolCommand, 
    HarvestCommand, 
    MoveCommand, 
    FixCommand 
} from './behaviors/index.js';

export class CommandManager {
    constructor(scene) {
        this.scene = scene;
        
        // Initialize all command instances
        this.commands = {
            attack: new AttackCommand(scene),
            stop: new StopCommand(scene),
            defence: new DefenceCommand(scene),
            patrol: new PatrolCommand(scene),
            harvest: new HarvestCommand(scene),
            move: new MoveCommand(scene),
            fix: new FixCommand(scene)
        };
    }

    // Execute command by name
    executeCommand(commandName, ...args) {
        const command = this.commands[commandName];
        if (!command) {
            console.error(`❌ Unknown command: ${commandName}`);
            return;
        }

        if (typeof command.execute === 'function') {
            command.execute(...args);
        } else {
            console.error(`❌ Command ${commandName} does not have execute method`);
        }
    }

    // Execute attack command with target
    executeAttack(targetId, worldPoint) {
        this.commands.attack.execute(targetId, worldPoint);
    }

    // Execute attack-move command
    executeAttackMove(worldPoint) {
        this.commands.attack.executeAttackMove(worldPoint);
    }

    // Execute harvest command
    executeHarvest(worldPoint) {
        this.commands.harvest.execute(worldPoint);
    }

    // Execute harvest resource command
    executeHarvestResource(resourceId, worldPoint) {
        this.commands.harvest.executeHarvestResource(resourceId, worldPoint);
    }

    // Execute move command
    executeMove(worldPoint) {
        this.commands.move.execute(worldPoint);
    }

    // Execute fix command
    executeFix(targetId, worldPoint) {
        this.commands.fix.execute(targetId, worldPoint);
    }

    // Execute stop command
    executeStop() {
        this.commands.stop.execute();
    }

    // Execute defence command
    executeDefence(worldPoint) {
        this.commands.defence.execute(worldPoint);
    }

    // Execute patrol command
    executePatrol(worldPoint) {
        this.commands.patrol.execute(worldPoint);
    }
}
