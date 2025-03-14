import { Transaction } from "@GBlibs/txs/txtypes";
import { Block } from "./blocktypes";
import { Level } from "level";
import crypto from "crypto";
import TransactionManager from "@GBlibs/txs/txs";

// 블록 저장용 DB
const blockDB = new Level<string, Block>("./block-db", { valueEncoding: "json" });
// Validator 목록 저장용 DB (블록체인 내부 정보)
const validatorDB = new Level<string, string[]>("./validator-db", { valueEncoding: "json" });


// -----------------------------------------------------------------------------
// BlockManager: 블록 생성, 검증, 합의, 저장 및 Validator 관리
// -----------------------------------------------------------------------------

export default class BlockManager {
  // 체인 상태를 메모리에서 유지 (최초 제네시스 블록 생성)
  private blockchain: Block[] = [];

  constructor() {
    this.blockchain.push(this.createGenesisBlock());
  }

  // 제네시스 블록 생성
  private createGenesisBlock(): Block {
    return {
      index: 0,
      previousHash: "0",
      timestamp: Date.now(),
      transactions: [],
      validator: "genesis",
      validators: [], // 제네시스 블록에는 별도 Validator 정보가 없을 수 있음
      hash: "genesis_hash",
    };
  }

  // 체인 내 마지막 블록 반환
  getLatestBlock(): Block {
    return this.blockchain[this.blockchain.length - 1];
  }

  // 블록 생성 (Validator 목록은 별도 DB 또는 정적 목록 사용)
  async createBlock(transactions: Transaction[], validator: string): Promise<Block> {
    const previousBlock = this.getLatestBlock();
    const validators = await this.getValidators();
    const newBlock: Block = {
      index: previousBlock.index + 1,
      previousHash: previousBlock.hash,
      timestamp: Date.now(),
      transactions,
      validator,
      validators,
      hash: "",
    };
    newBlock.hash = this.calculateHash(newBlock);
    return newBlock;
  }

  // 블록 해시 계산
  calculateHash(block: Block): string {
    return crypto.createHash("sha256").update(JSON.stringify(block)).digest("hex");
  }

  // PBFT 기반 합의: validators의 2/3 이상 승인 시 합의 완료
  pbftConsensus(block: Block, validators: string[]): boolean {
    let approvals = 0;
    for (const _ of validators) {
      if (Math.random() > 0.2) approvals++; // 80% 승인 확률
    }
    if (approvals >= (2 / 3) * validators.length) {
      this.blockchain.push(block);
      console.log("✅ 블록 합의 완료:", block);
      return true;
    } else {
      console.log("❌ 블록 합의 실패");
      return false;
    }
  }

  // 블록 검증: 이전 블록과의 연결, 해시값, 그리고 트랜잭션 유효성 (UTXO 존재 여부)
  async isValidBlock(newBlock: Block, previousBlock: Block, txManager: TransactionManager): Promise<boolean> {
    // 1. 이전 블록 해시 비교
    if (newBlock.previousHash !== previousBlock.hash) {
      console.error("❌ 오류: 이전 해시 불일치");
      return false;
    }
    // 2. 해시 재계산 검증
    if (newBlock.hash !== this.calculateHash(newBlock)) {
      console.error("❌ 오류: 블록 해시 불일치");
      return false;
    }
    // 3. 각 트랜잭션의 입력 UTXO 존재 여부 검증
    for (const tx of newBlock.transactions) {
      for (const input of tx.inputs) {
        const utxo = await txManager.getUTXO(input.txid, input.index);
        if (!utxo) {
          console.error(`❌ 오류: UTXO ${input.txid}:${input.index} 없음`);
          return false;
        }
      }
    }
    return true;
  }

  // 블록 저장 (LevelDB 사용)
  async saveBlock(block: Block): Promise<void> {
    await blockDB.put(block.index.toString(), block);
    console.log(`✅ 블록 저장 완료: ${block.index}`);
  }

  // 블록 조회
  async getBlock(index: number): Promise<Block | null> {
    try {
      return await blockDB.get(index.toString());
    } catch (error) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Validator 관리: Validator 목록을 DB에 저장하고 조회
  // ---------------------------------------------------------------------------
  async saveValidators(validators: string[]): Promise<void> {
    await validatorDB.put("validators", validators);
    console.log("✅ Validator 목록 저장:", validators);
  }

  async getValidators(): Promise<string[]> {
    try {
      return await validatorDB.get("validators");
    } catch (error) {
      // 초기 Validator 목록 (정적 기본값)
      const defaultValidators = ["Node1", "Node2", "Node3", "Node4"];
      await this.saveValidators(defaultValidators);
      return defaultValidators;
    }
  }

  async addValidator(newValidator: string): Promise<void> {
    const validators = await this.getValidators();
    if (!validators.includes(newValidator)) {
      validators.push(newValidator);
      await this.saveValidators(validators);
      console.log(`✅ Validator 추가: ${newValidator}`);
    }
  }

  async removeValidator(validator: string): Promise<void> {
    let validators = await this.getValidators();
    validators = validators.filter(v => v !== validator);
    await this.saveValidators(validators);
    console.log(`❌ Validator 삭제: ${validator}`);
  }

  // 체인 전체 상태 반환 (메모리상의 체인)
  getBlockchain(): Block[] {
    return this.blockchain;
  }
}
