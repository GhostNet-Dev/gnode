import BlockManager from "@GBlibs/blocks/blocks";
import { Block } from "@GBlibs/blocks/blocktypes";
import PBFTConsensus from "@GBlibs/consensus/pbftconsensus";
import ValidatorManager from "@GBlibs/consensus/validators";
import KeyManager from "@GBlibs/key/keys";
import { logger } from "@GBlibs/logger/logger";
import { NetworkInterface } from "@GBlibs/network/inetwork";
import PendingTransactionPool from "@GBlibs/txs/pendingtxs";
import TransactionManager from "@GBlibs/txs/txs";
import { Transaction } from "@GBlibs/txs/txtypes";

/**
 * ✅ PBFT 기반 블록체인 시스템 (모든 기능 포함)
 */
export default class Blockchain {
  private pbft: PBFTConsensus;
  private blockManager: BlockManager;
  private txManager: TransactionManager;
  private pendingPool: PendingTransactionPool;
  private keyManager: KeyManager;
  private network: NetworkInterface;
  private minTxPerBlock: number = 1;

  constructor(
    blockManager: BlockManager,
    txManager: TransactionManager,
    pbft: PBFTConsensus,
    network: NetworkInterface,
    pendingPool: PendingTransactionPool,
    keyManager: KeyManager
  ) {
    this.blockManager = blockManager;
    this.txManager = txManager;
    this.pbft = pbft;
    this.network = network;
    this.pendingPool = pendingPool;
    this.keyManager = keyManager;

    logger.info("✅ Blockchain 시스템 초기화 완료");

    // 블록체인 네트워크 이벤트 리스너 설정
    this.setupNetworkListeners();
  }

  /**
   * ✅ 네트워크 이벤트 리스너 설정
   */
  private setupNetworkListeners() {
    this.network.on("transaction", (transaction) => {
      logger.info(`📥 [Blockchain] 트랜잭션 수신: ${JSON.stringify(transaction)}`);
      this.processTransaction(transaction);
    });

    this.network.on("block", (block) => {
      logger.info(`📥 [Blockchain] 블록 수신: ${block.index}`);
      this.processBlock(block);
    });
  }

  /**
   * ✅ 트랜잭션 생성 및 네트워크 전파
   */
  async createTransaction(senderPrivateKey:string, senderPubKey: string, sender: string, recipient: string, amount: number, mediator: string) {
    logger.info(`📝 [Blockchain] 트랜잭션 생성: ${sender} → ${recipient} (${amount} 코인)`);
    
    const transaction = await this.txManager.createTransaction(senderPrivateKey, senderPubKey, sender, recipient, amount, mediator);
    await this.pendingPool.addTransaction(transaction);
    this.network.sendMessage("transaction", transaction);
  }

  /**
   * ✅ 네트워크에서 받은 트랜잭션 처리 (검증 후 Pending Pool에 추가)
   */
  private async processTransaction(transaction: Transaction) {
    logger.info(`🔍 [Blockchain] 트랜잭션 검증 중: ${transaction.txid}`);

    const isValid = await this.keyManager.verifySignature(transaction.senderPublicKey, transaction.txid, transaction.signature);
    if (!isValid) {
      logger.info(`❌ [Blockchain] 트랜잭션 무효 (서명 검증 실패): ${transaction.txid}`);
      return;
    }

    await this.pendingPool.addTransaction(transaction);
    logger.info(`✅ [Blockchain] 트랜잭션 저장 완료: ${transaction.txid}`);
  }

  /**
   * ✅ 블록 생성 속도를 분석하여 최소 트랜잭션 개수를 조절
   */
  private async adjustMinTxPerBlock() {
    const blocks = await this.blockManager.getBlockchain();
    if (blocks.length < 600) return; // 600개 이상 블록이 누적되지 않으면 조절하지 않음

    const firstBlock = blocks[blocks.length - 600];
    const lastBlock = blocks[blocks.length - 1];

    const timeElapsed = lastBlock.timestamp - firstBlock.timestamp;
    const expectedTime = 600 * 10; // 10분 (600초)

    // 🔢 속도 비율 계산 (1보다 작으면 너무 빠름, 크면 느림)
    const speedRatio = expectedTime / timeElapsed;

    // 🔄 최소 트랜잭션 개수 조정 (비율 기반)
    const adjustmentFactor = Math.max(0.1, Math.min(2, speedRatio)); // 조정값을 0.1 ~ 2 사이로 제한
    this.minTxPerBlock = Math.max(1, Math.floor(this.minTxPerBlock * adjustmentFactor));

    logger.info(`🔄 [Blockchain] 블록 생성 속도 조정 완료: 최소 트랜잭션 개수 = ${this.minTxPerBlock}`);
  }


  /**
   * ✅ 블록 생성 및 PBFT 합의 요청
   */
  async createBlock() {
    logger.info("🔵 [Blockchain] 새로운 블록 생성 요청");
    
    const transactions = await this.pendingPool.getAllTransactions();
    if (transactions.length < this.minTxPerBlock) {
      logger.info(`⚠️ [Blockchain] 트랜잭션 부족 (최소 필요: ${this.minTxPerBlock})`);
      return;
    }

    await this.pbft.proposeBlock(transactions);
    this.adjustMinTxPerBlock();
  }

  /**
   * ✅ 네트워크에서 받은 블록 처리 및 체인 리오그 실행
   */
  private async processBlock(newBlock: Block) {
    logger.info(`✅ [Blockchain] 블록 검증 중: ${newBlock.index}`);

    const latestBlock = await this.blockManager.getLatestBlock();
    if (latestBlock != null && !(await this.blockManager.isValidBlock(newBlock, latestBlock, this.txManager))) {
      logger.info(`❌ [Blockchain] 블록 검증 실패: ${newBlock.index}`);
      return;
    }

    if (newBlock.transactions.length < this.minTxPerBlock) {
      logger.info(`❌ [Blockchain] 블록 무효: 트랜잭션 개수 부족 (${newBlock.transactions.length} < ${this.minTxPerBlock})`);
      return;
    }

    await this.blockManager.saveBlock(newBlock);
    await this.pendingPool.clearTransactions(newBlock.transactions.map(tx => tx.txid));
    logger.info(`✅ [Blockchain] 블록 저장 완료: ${newBlock.index}`);

    this.adjustMinTxPerBlock();
  }

  /**
   * ✅ 블록체인 상태 출력
   */
  printBlockchain() {
    logger.info("📜 [Blockchain] 현재 블록체인 상태:");
    console.table(this.blockManager.getBlockchain());
  }
}

