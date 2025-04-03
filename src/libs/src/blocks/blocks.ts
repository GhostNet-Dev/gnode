import { Transaction, UTXO } from "@GBlibs/txs/txtypes";
import { Block } from "./blocktypes";
import { Level } from "level";
import crypto from "crypto";
import TransactionManager from "@GBlibs/txs/txs";
import ValidatorManager from "@GBlibs/consensus/validators";

// 블록 저장용 DB
const blockDB = new Level<string, Block>("./block-db", { valueEncoding: "json" });

export default class BlockManager {
  private blockchain: Block[] = [];

  constructor(private validatorMgr: ValidatorManager) {
    this.blockchain.push(this.createGenesisBlock());
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
  getLatestBlock(): Block {
    return this.blockchain[this.blockchain.length - 1];
  }

  // ✅ 블록 생성 (Coinbase 보상 추가)
  async createBlock(transactions: Transaction[], validator: string, txManager: TransactionManager): Promise<Block> {
    const previousBlock = this.getLatestBlock();
    const validators = await this.validatorMgr.getValidators();

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
      validators,
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
      this.blockchain.push(block);
      console.log("✅ 블록 합의 완료:", block);
      return true;
    } else {
      console.log("❌ 블록 합의 실패");
      return false;
    }
  }

  // ✅ 블록 검증 (UTXO 검증 및 Coinbase 검증 포함)
  async isValidBlock(newBlock: Block, previousBlock: Block, txManager: TransactionManager): Promise<boolean> {
    if (newBlock.previousHash !== previousBlock.hash) {
      console.error("❌ 오류: 이전 해시 불일치");
      return false;
    }
    if (newBlock.hash !== this.calculateHash(newBlock)) {
      console.error("❌ 오류: 블록 해시 불일치");
      return false;
    }

    const coinbaseTx = newBlock.transactions[0];
    if (!this.isValidCoinbase(coinbaseTx, newBlock.transactions.slice(1))) {
      console.error("❌ 오류: Coinbase 배분 검증 실패");
      return false;
    }

    for (const tx of newBlock.transactions.slice(1)) {
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

  // ✅ Coinbase 검증 (1000 코인이 적절히 분배되었는지 확인)
  private isValidCoinbase(coinbaseTx: Transaction, transactions: Transaction[]): boolean {
    const expectedRewards = this.calculateMediatorRewards(transactions);
    const totalReward = coinbaseTx.outputs.reduce((sum, output) => sum + output.amount, 0);

    if (totalReward !== 1000) {
      console.error(`❌ 오류: Coinbase 총 보상액 불일치 (기대값: 1000, 실제: ${totalReward})`);
      return false;
    }

    for (const output of coinbaseTx.outputs) {
      const expectedReward = expectedRewards.find(r => r.mediator === output.owner);
      if (!expectedReward || expectedReward.amount !== output.amount) {
        console.error(`❌ 오류: Coinbase 분배 불일치 (${output.owner}: ${output.amount})`);
        return false;
      }
    }
    return true;
  }

  // ✅ 블록 저장
  async saveBlock(block: Block): Promise<void> {
    await blockDB.put("latest", block);
    await blockDB.put(block.index.toString(), block);
    console.log(`✅ 블록 저장 완료: ${block.index}`);
  }

  async getLatestBlockIndex(): Promise<number> {
      try {
          const block = await blockDB.get("latest");
          return block.index;
      } catch {
          return 0; // 제네시스만 있을 경우
      }
  }

  // ✅ 블록 조회
  async getBlock(index: number): Promise<Block | null> {
    try {
      return await blockDB.get(index.toString());
    } catch (error) {
      return null;
    }
  }
  /**
 * ✅ 전체 블록체인 데이터 반환
 */
  async getBlockchain(): Promise<Block[]> {
    const blocks: Block[] = [];
    for await (const [, block] of blockDB.iterator()) {
      blocks.push(block);
    }
    return blocks.sort((a, b) => a.index - b.index); // 블록 번호 순으로 정렬
  }
}

