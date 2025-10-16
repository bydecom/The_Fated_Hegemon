// Component xác định chủng tộc và bộ lạc của entity

export class Faction {
    constructor(raceId, tribeId) {
        this.raceId = raceId;     // ID của chủng tộc (e.g., 'human', 'orc', 'elf')
        this.tribeId = tribeId;   // ID của bộ lạc (e.g., 'stormwind', 'ironforge')
    }
    
    // Kiểm tra xem có cùng chủng tộc không
    isSameRace(otherFaction) {
        return this.raceId === otherFaction.raceId;
    }
    
    // Kiểm tra xem có cùng bộ lạc không
    isSameTribe(otherFaction) {
        return this.tribeId === otherFaction.tribeId;
    }
    
    // Kiểm tra xem có hoàn toàn giống nhau không
    isIdentical(otherFaction) {
        return this.isSameRace(otherFaction) && this.isSameTribe(otherFaction);
    }
}

