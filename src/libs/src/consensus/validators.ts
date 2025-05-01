import { IDBManager, IGenericDB } from "@GBlibs/db/dbtypes";
import { logger } from "@GBlibs/logger/logger";

export interface Validator {
    id: string;
    publicKey: string;
    stake: number;
    joinedAt: string;
}
export default class ValidatorManager {
    validatorDB: IGenericDB<Validator[]>
    voteDB: IGenericDB<string[]>
    private validators: Validator[] = [];

    constructor(
        private dbMgr: IDBManager,
        private url: string = "https://ghostwebservice.com", 
    ) { 
        this.validatorDB = this.dbMgr.getDB<Validator[]>("validator-db");
        this.voteDB = this.dbMgr.getDB<string[]>("vote-db");
        this.loadValidators();
    }

    async fetchValidators(): Promise<Validator[]> {
        const response = await fetch(this.url + '/json/validators.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch validators: ${response.statusText}`);
        }

        const data = await response.json();
        return data.validators as Validator[];
    }

    // ✅ Validator 목록 불러오기 (DB에서 로드)
    async loadValidators(): Promise<void> {
        try {
            this.validators = await this.fetchValidators()
            if (this.validators.length > 0) {
                logger.info(`✅ Validator 목록 불러오기: ${this.validators.length}`);
                await this.saveValidators();
                return
            }
        } catch (error) {
            logger.error(`Failed to fetch validators: ${error}`);
        }
        try {
            const valid = await this.validatorDB.get("validators");
            if(valid) this.validators = valid
            else throw new Error("Failed to load validators from LevelDB");
        } catch (error) {
            throw new Error("Failed to load validators from LevelDB");
        }
        await this.saveValidators();
    }

    // ✅ Validator 목록 저장
    async saveValidators(): Promise<void> {
        logger.info(`✅ Validator 목록 저장: ${this.validators.length} -> ${this.validators.map(v => v.publicKey)}`);
        await this.validatorDB.put("validators", this.validators);
    }

    // ✅ Validator 목록 조회
    getValidators(): Validator[] {
        return this.validators;
    }

    // ✅ Validator 직접 설정
    async setValidators(validators: Validator[]): Promise<void> {
        this.validators = validators;
        await this.saveValidators();
    }

    // ✅ Validator 추가
    async addValidator(newValidator: Validator): Promise<void> {
        if (!this.validators.includes(newValidator)) {
            this.validators.push(newValidator);
            await this.saveValidators();
            logger.info(`✅ Validator 추가됨: ${newValidator}`);
        }
    }

    // ✅ Validator 삭제
    async removeValidator(validator: Validator): Promise<void> {
        this.validators = this.validators.filter(v => v !== validator);
        await this.saveValidators();
        logger.info(`❌ Validator 삭제됨: ${validator}`);
    }

    // -------------------------------------------------------------------
    // ✅ PBFT 합의를 위한 Validator 투표 기능
    // -------------------------------------------------------------------

    // ✅ 특정 블록에 대해 Validator가 투표 수행
    async castVote(blockHash: string, validator: string): Promise<void> {
        const votes = await this.loadVotes(blockHash);
        if (!votes.includes(validator)) {
            votes.push(validator);
            await this.voteDB.put(blockHash, votes);
            logger.info(`✅ ${validator}가 블록(${blockHash})에 투표함.`);
        }
    }

    // ✅ 특정 블록의 투표 내역 조회
    async loadVotes(blockHash: string): Promise<string[]> {
        try {
            const votes = await this.voteDB.get(blockHash);
            if(votes) return votes;
            else return [];
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

