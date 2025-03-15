import { Level } from "level";

// ✅ Validator 저장용 LevelDB
const validatorDB = new Level<string, string[]>("./validator-db", { valueEncoding: "json" });
const voteDB = new Level<string, string[]>("./vote-db", { valueEncoding: "json" });

export default class ValidatorManager {
    private validators: string[] = [];

    constructor() {
        this.loadValidators();
    }

    // ✅ Validator 목록 불러오기 (DB에서 로드)
    async loadValidators(): Promise<void> {
        try {
            this.validators = await validatorDB.get("validators");
        } catch (error) {
            this.validators = ["Node1", "Node2", "Node3", "Node4"]; // 기본 Validator 목록
            await this.saveValidators();
        }
    }

    // ✅ Validator 목록 저장
    async saveValidators(): Promise<void> {
        await validatorDB.put("validators", this.validators);
    }

    // ✅ Validator 목록 조회
    getValidators(): string[] {
        return this.validators;
    }

    // ✅ Validator 직접 설정
    async setValidators(validators: string[]): Promise<void> {
        this.validators = validators;
        await this.saveValidators();
    }

    // ✅ Validator 추가
    async addValidator(newValidator: string): Promise<void> {
        if (!this.validators.includes(newValidator)) {
            this.validators.push(newValidator);
            await this.saveValidators();
            console.log(`✅ Validator 추가됨: ${newValidator}`);
        }
    }

    // ✅ Validator 삭제
    async removeValidator(validator: string): Promise<void> {
        this.validators = this.validators.filter(v => v !== validator);
        await this.saveValidators();
        console.log(`❌ Validator 삭제됨: ${validator}`);
    }

    // -------------------------------------------------------------------
    // ✅ PBFT 합의를 위한 Validator 투표 기능
    // -------------------------------------------------------------------

    // ✅ 특정 블록에 대해 Validator가 투표 수행
    async castVote(blockHash: string, validator: string): Promise<void> {
        const votes = await this.loadVotes(blockHash);
        if (!votes.includes(validator)) {
            votes.push(validator);
            await voteDB.put(blockHash, votes);
            console.log(`✅ ${validator}가 블록(${blockHash})에 투표함.`);
        }
    }

    // ✅ 특정 블록의 투표 내역 조회
    async loadVotes(blockHash: string): Promise<string[]> {
        try {
            return await voteDB.get(blockHash);
        } catch (error) {
            return [];
        }
    }

    // ✅ 특정 블록에 대한 Validator 투표 개수 확인
    async countVotes(blockHash: string): Promise<number> {
        const votes = await this.loadVotes(blockHash);
        return votes.length;
    }

    // ✅ 특정 블록이 PBFT 합의를 충족했는지 확인 (2/3 이상 Validator 투표)
    async hasConsensus(blockHash: string): Promise<boolean> {
        const votes = await this.loadVotes(blockHash);
        const totalValidators = this.validators.length;
        return votes.length >= Math.ceil((2 / 3) * totalValidators);
    }
}

