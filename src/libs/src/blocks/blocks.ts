import { Transaction } from "@GBlibs/txs/txtypes";
import { Block } from "./blocktypes";
import crypto from "crypto";
import TransactionManager from "@GBlibs/txs/txs";
import ValidatorManager from "@GBlibs/consensus/validators";
import { logger } from "@GBlibs/logger/logger";
import { IDBManager, IGenericDB } from "@GBlibs/db/dbtypes";

export default class BlockManager {
  private blockDB: IGenericDB<Block>;

  constructor(
    private validatorMgr: ValidatorManager,
    private dbMgr: IDBManager
  ) {
    this.blockDB = this.dbMgr.getDB<Block>("block-db");
    this.initialize();
  }
  async initialize() {

    if (this.blockDB.getStatus() !== "open") {
      this.blockDB.open();
    }
    const blk = await this.getLatestBlock()
    if (!blk) {
      this.saveBlock(this.createGenesisBlock())
    }
  }

  // ✅ 제네시스 블록 생성
  private createGenesisBlock(): Block {
    return {
      index: 0,
      previousHash: "0",
      timestamp: Date.now(),
      transactions: [],
      validator: "genesis",
      validators: [],
      hash: "genesis_hash",
    };
  }

  // ✅ 체인 내 마지막 블록 반환
  async getLatestBlock() {
    try {
      const block = await this.blockDB.get("latest");
      return block;
    } catch {
      return undefined
    }
  }

  // ✅ 블록 생성 (Coinbase 보상 추가)
  async createBlock(transactions: Transaction[], validator: string, txManager: TransactionManager): Promise<Block> {
    const previousBlock = await this.getLatestBlock();
    const validators = await this.validatorMgr.getValidators();

    if (!previousBlock) throw new Error("there is no block")

    // 🔄 중계자(Mediator) 목록 추출 및 보상 분배
    const mediatorRewards = this.calculateMediatorRewards(transactions);

    // ✅ Coinbase 트랜잭션 생성
    const coinbaseTransaction = this.createCoinbaseTransaction(mediatorRewards);

    // 블록 내 트랜잭션 리스트 업데이트
    transactions.unshift(coinbaseTransaction);

    // ✅ 새로운 블록 생성
    const newBlock: Block = {
      index: previousBlock.index + 1,
      previousHash: previousBlock.hash,
      timestamp: Date.now(),
      transactions,
      validator,
      validators: validators.map(v => v.publicKey),
      hash: "",
    };

    newBlock.hash = this.calculateHash(newBlock);
    return newBlock;
  }

  // ✅ 블록 해시 계산
  calculateHash(block: Block): string {
    return crypto.createHash("sha256").update(JSON.stringify(block)).digest("hex");
  }

  // ✅ 중계자의 거래 기여도에 따른 1000 코인 분배
  private calculateMediatorRewards(transactions: Transaction[]): { mediator: string; amount: number }[] {
    const mediatorCount: Record<string, number> = {};

    for (const tx of transactions) {
      if (tx.mediator) {
        mediatorCount[tx.mediator] = (mediatorCount[tx.mediator] || 0) + 1;
      }
    }

    const totalMediatedTransactions = Object.values(mediatorCount).reduce((sum, count) => sum + count, 0);
    if (totalMediatedTransactions === 0) return [];

    return Object.entries(mediatorCount).map(([mediator, count]) => ({
      mediator,
      amount: Math.floor((count / totalMediatedTransactions) * 1000),
    }));
  }

  // ✅ Coinbase 트랜잭션 생성
  private createCoinbaseTransaction(mediatorRewards: { mediator: string; amount: number }[]): Transaction {
    // Coinbase 트랜잭션 데이터
    const transactionData: Omit<Transaction, "signature" | "txid"> = {
      inputs: [],
      outputs: mediatorRewards.map(({ mediator, amount }, index) => ({
        txid: "coinbase",
        index,
        amount,
        owner: mediator,
      })),
      senderPublicKey: "coinbase",
      mediator: "network_reward",
    };

    // ✅ Coinbase 트랜잭션 해시 생성 (블록 데이터 기반)
    const txid = crypto.createHash("sha256").update(JSON.stringify(transactionData)).digest("hex");

    return {
      ...transactionData,
      txid,
      signature: "coinbase_signature",
    };
  }

  // ✅ PBFT 기반 합의
  pbftConsensus(block: Block, validators: string[]): boolean {
    let approvals = 0;
    for (const _ of validators) {
      if (Math.random() > 0.2) approvals++; // 80% 승인 확률
    }
    if (approvals >= (2 / 3) * validators.length) {
      this.saveBlock(block);
      logger.info("✅ 블록 합의 완료:", block);
      return true;
    } else {
      logger.info("❌ 블록 합의 실패");
      return false;
    }
  }

  // ✅ 블록 검증 (UTXO 검증 및 Coinbase 검증 포함)
  async isValidBlock(newBlock: Block, previousBlock: Block, txManager: TransactionManager): Promise<boolean> {
    if (newBlock.previousHash !== previousBlock.hash) {
      logger.error("❌ 오류: 이전 해시 불일치");
      return false;
    }
    if (newBlock.hash !== this.calculateHash(newBlock)) {
      logger.error("❌ 오류: 블록 해시 불일치");
      return false;
    }

    const coinbaseTx = newBlock.transactions[0];
    if (!this.isValidCoinbase(coinbaseTx, newBlock.transactions.slice(1))) {
      logger.error("❌ 오류: Coinbase 배분 검증 실패");
      return false;
    }

    for (const tx of newBlock.transactions.slice(1)) {
      for (const input of tx.inputs) {
        const utxo = await txManager.getUTXO(input.txid, input.index);
        if (!utxo) {
          logger.error(`❌ 오류: UTXO ${input.txid}:${input.index} 없음`);
          return false;
        }
      }
    }
    return true;
  }

  // ✅ Coinbase 검증 (1000 코인이 적절히 분배되었는지 확인)
  private isValidCoinbase(coinbaseTx: Transaction, transactions: Transaction[]): boolean {
    const expectedRewards = this.calculateMediatorRewards(transactions);
    const totalReward = coinbaseTx.outputs.reduce((sum, output) => sum + output.amount, 0);

    if (totalReward !== 1000) {
      logger.error(`❌ 오류: Coinbase 총 보상액 불일치 (기대값: 1000, 실제: ${totalReward})`);
      return false;
    }

    for (const output of coinbaseTx.outputs) {
      const expectedReward = expectedRewards.find(r => r.mediator === output.owner);
      if (!expectedReward || expectedReward.amount !== output.amount) {
        logger.error(`❌ 오류: Coinbase 분배 불일치 (${output.owner}: ${output.amount})`);
        return false;
      }
    }
    return true;
  }

  // ✅ 블록 저장
  async saveBlock(block: Block): Promise<void> {
    await this.blockDB.put("latest", block);
    await this.blockDB.put(block.index.toString(), block);
    logger.info(`✅ 블록 저장 완료: ${block.index}`);
  }

  async getLatestBlockIndex(): Promise<number> {
    try {
      const block = await this.blockDB.get("latest");
      if(block === undefined) throw new Error("there is no block")
      return block.index;
    } catch {
      return 0; // 제네시스만 있을 경우
    }
  }

  // ✅ 블록 조회
  async getBlock(index: number): Promise<Block | null> {
    try {
      const block = await this.blockDB.get(index.toString());
      if(!block) return null
      return block;
    } catch (error) {
      return null;
    }
  }
  /**
 * ✅ 전체 블록체인 데이터 반환
 */
  async getBlockchain(): Promise<Block[]> {
    const blocks: Block[] = [];
    for await (const [, block] of this.blockDB.iterator()) {
      blocks.push(block);
    }
    return blocks.sort((a, b) => a.index - b.index); // 블록 번호 순으로 정렬
  }
}

