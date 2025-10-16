// Manager quản lý chủng tộc, bộ lạc và quan hệ giữa các phe

export const RELATION_TYPE = {
    ALLY: 'ally',       // Đồng minh
    ENEMY: 'enemy',     // Kẻ thù
    NEUTRAL: 'neutral'  // Trung lập
};

export class FactionManager {
    constructor() {
        // Định nghĩa các chủng tộc
        this.races = new Map();
        
        // Định nghĩa các bộ lạc
        this.tribes = new Map();
        
        // Quan hệ giữa các bộ lạc (Map<tribeId1_tribeId2, RELATION_TYPE>)
        this.tribeRelations = new Map();
        
        this.initializeDefaultRacesAndTribes();
    }
    
    // ============================================
    // RACE MANAGEMENT
    // ============================================
    
    registerRace(raceId, raceData) {
        this.races.set(raceId, {
            id: raceId,
            name: raceData.name,
            description: raceData.description || '',
            // Modifiers cho stats
            statsModifiers: {
                healthMultiplier: raceData.healthMultiplier || 1.0,
                damageMultiplier: raceData.damageMultiplier || 1.0,
                speedMultiplier: raceData.speedMultiplier || 1.0,
                attackRateMultiplier: raceData.attackRateMultiplier || 1.0
            },
            // Appearance mặc định
            defaultAppearance: raceData.defaultAppearance || {},
            // Custom data
            customData: raceData.customData || {}
        });
    }
    
    getRace(raceId) {
        return this.races.get(raceId);
    }
    
    getAllRaces() {
        return Array.from(this.races.values());
    }
    
    // ============================================
    // TRIBE MANAGEMENT
    // ============================================
    
    registerTribe(tribeId, tribeData) {
        if (!this.races.has(tribeData.raceId)) {
            console.error(`Cannot register tribe ${tribeId}: Race ${tribeData.raceId} does not exist!`);
            return;
        }
        
        this.tribes.set(tribeId, {
            id: tribeId,
            raceId: tribeData.raceId,
            name: tribeData.name,
            description: tribeData.description || '',
            // Màu sắc đặc trưng của bộ lạc
            color: tribeData.color || 0xffffff,
            // Banner/Flag
            banner: tribeData.banner || null,
            // Bonus stats riêng của bộ lạc
            bonusStats: {
                health: tribeData.bonusHealth || 0,
                damage: tribeData.bonusDamage || 0,
                speed: tribeData.bonusSpeed || 0,
                attackRange: tribeData.bonusAttackRange || 0
            },
            // Custom data
            customData: tribeData.customData || {}
        });
    }
    
    getTribe(tribeId) {
        return this.tribes.get(tribeId);
    }
    
    getAllTribes() {
        return Array.from(this.tribes.values());
    }
    
    // Lấy tất cả bộ lạc của một chủng tộc
    getTribesOfRace(raceId) {
        return this.getAllTribes().filter(tribe => tribe.raceId === raceId);
    }
    
    // ============================================
    // RELATION MANAGEMENT
    // ============================================
    
    setRelation(tribeId1, tribeId2, relationType) {
        if (!Object.values(RELATION_TYPE).includes(relationType)) {
            console.error(`Invalid relation type: ${relationType}`);
            return;
        }
        
        const key1 = `${tribeId1}_${tribeId2}`;
        const key2 = `${tribeId2}_${tribeId1}`;
        
        this.tribeRelations.set(key1, relationType);
        this.tribeRelations.set(key2, relationType);
    }
    
    getRelation(tribeId1, tribeId2) {
        // Cùng bộ lạc → đồng minh
        if (tribeId1 === tribeId2) {
            return RELATION_TYPE.ALLY;
        }
        
        const key = `${tribeId1}_${tribeId2}`;
        return this.tribeRelations.get(key) || RELATION_TYPE.NEUTRAL;
    }
    
    areAllies(tribeId1, tribeId2) {
        return this.getRelation(tribeId1, tribeId2) === RELATION_TYPE.ALLY;
    }
    
    areEnemies(tribeId1, tribeId2) {
        return this.getRelation(tribeId1, tribeId2) === RELATION_TYPE.ENEMY;
    }
    
    // ============================================
    // STATS CALCULATION (Race + Tribe modifiers)
    // ============================================
    
    calculateFinalStats(baseStats, raceId, tribeId) {
        const race = this.getRace(raceId);
        const tribe = this.getTribe(tribeId);
        
        if (!race || !tribe) {
            console.warn(`Race or Tribe not found: ${raceId}, ${tribeId}`);
            return baseStats;
        }
        
        return {
            health: Math.round(baseStats.health * race.statsModifiers.healthMultiplier) + tribe.bonusStats.health,
            damage: Math.round(baseStats.damage * race.statsModifiers.damageMultiplier) + tribe.bonusStats.damage,
            speed: Math.round(baseStats.speed * race.statsModifiers.speedMultiplier) + tribe.bonusStats.speed,
            attackRange: baseStats.attackRange + tribe.bonusStats.attackRange,
            attackRate: Math.round(baseStats.attackRate * race.statsModifiers.attackRateMultiplier)
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    initializeDefaultRacesAndTribes() {
        // ===== CHỦNG TỘC: HUMAN =====
        this.registerRace('human', {
            name: 'Human',
            description: 'Chủng tộc con người - cân bằng về mọi mặt',
            healthMultiplier: 1.0,
            damageMultiplier: 1.0,
            speedMultiplier: 1.0,
            attackRateMultiplier: 1.0,
            defaultAppearance: {
                shape: 'circle',
                size: 12
            }
        });
        
        // Bộ lạc: Kingdom of Stormwind
        this.registerTribe('stormwind', {
            raceId: 'human',
            name: 'Kingdom of Stormwind',
            description: 'Vương quốc hùng mạnh của loài người',
            color: 0x0066ff, // Xanh dương
            bonusHealth: 10,
            bonusDamage: 2
        });
        
        // Bộ lạc: Lordaeron
        this.registerTribe('lordaeron', {
            raceId: 'human',
            name: 'Lordaeron',
            description: 'Vương quốc phía bắc',
            color: 0x00ffff, // Xanh cyan
            bonusHealth: 5,
            bonusSpeed: 10
        });
        
        // ===== CHỦNG TỘC: ORC =====
        this.registerRace('orc', {
            name: 'Orc',
            description: 'Chủng tộc Orc - mạnh mẽ và hung dữ',
            healthMultiplier: 1.2,
            damageMultiplier: 1.3,
            speedMultiplier: 0.9,
            attackRateMultiplier: 1.1,
            defaultAppearance: {
                shape: 'circle',
                size: 14
            }
        });
        
        // Bộ lạc: Frostwolf Clan
        this.registerTribe('frostwolf', {
            raceId: 'orc',
            name: 'Frostwolf Clan',
            description: 'Bộ lạc sói băng giá',
            color: 0x00ff00, // Xanh lá
            bonusHealth: 20,
            bonusDamage: 5
        });
        
        // Bộ lạc: Warsong Clan
        this.registerTribe('warsong', {
            raceId: 'orc',
            name: 'Warsong Clan',
            description: 'Bộ lạc chiến ca',
            color: 0xff6600, // Cam đỏ
            bonusDamage: 8,
            bonusSpeed: 5
        });
        
        // ===== CHỦNG TỘC: ELF =====
        this.registerRace('elf', {
            name: 'Elf',
            description: 'Chủng tộc Elf - nhanh nhẹn và khéo léo',
            healthMultiplier: 0.8,
            damageMultiplier: 0.9,
            speedMultiplier: 1.3,
            attackRateMultiplier: 0.8,
            defaultAppearance: {
                shape: 'triangle',
                size: 10
            }
        });
        
        // Bộ lạc: Night Elves
        this.registerTribe('nightelf', {
            raceId: 'elf',
            name: 'Night Elves',
            description: 'Tinh linh đêm',
            color: 0x9900ff, // Tím
            bonusSpeed: 20,
            bonusAttackRange: 10
        });
        
        // Bộ lạc: High Elves
        this.registerTribe('highelf', {
            raceId: 'elf',
            name: 'High Elves',
            description: 'Tinh linh cao quý',
            color: 0xffff00, // Vàng
            bonusHealth: 15,
            bonusAttackRange: 15
        });
        
        // ===== THIẾT LẬP QUAN HỆ MẶC ĐỊNH =====
        // Human tribes là đồng minh với nhau
        this.setRelation('stormwind', 'lordaeron', RELATION_TYPE.ALLY);
        
        // Orc tribes là đồng minh với nhau
        this.setRelation('frostwolf', 'warsong', RELATION_TYPE.ALLY);
        
        // Elf tribes là đồng minh với nhau
        this.setRelation('nightelf', 'highelf', RELATION_TYPE.ALLY);
        
        // Human vs Orc = Enemy
        this.setRelation('stormwind', 'frostwolf', RELATION_TYPE.ENEMY);
        this.setRelation('stormwind', 'warsong', RELATION_TYPE.ENEMY);
        this.setRelation('lordaeron', 'frostwolf', RELATION_TYPE.ENEMY);
        this.setRelation('lordaeron', 'warsong', RELATION_TYPE.ENEMY);
        
        // Human & Elf = Ally
        this.setRelation('stormwind', 'nightelf', RELATION_TYPE.ALLY);
        this.setRelation('stormwind', 'highelf', RELATION_TYPE.ALLY);
        this.setRelation('lordaeron', 'nightelf', RELATION_TYPE.ALLY);
        this.setRelation('lordaeron', 'highelf', RELATION_TYPE.ALLY);
        
        // Orc vs Elf = Enemy
        this.setRelation('frostwolf', 'nightelf', RELATION_TYPE.ENEMY);
        this.setRelation('frostwolf', 'highelf', RELATION_TYPE.ENEMY);
        this.setRelation('warsong', 'nightelf', RELATION_TYPE.ENEMY);
        this.setRelation('warsong', 'highelf', RELATION_TYPE.ENEMY);
        
        console.log('📜 FactionManager initialized with 3 races and 6 tribes');
    }
}

