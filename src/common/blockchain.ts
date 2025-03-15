import BlockManager from "@GBlibs/blocks/blocks";
import { Block } from "@GBlibs/blocks/blocktypes";
import PBFTConsensus from "@GBlibs/consensus/pbftconsensus";
import ValidatorManager from "@GBlibs/consensus/validators";
import KeyManager from "@GBlibs/key/keys";
import { NetworkInterface } from "@GBlibs/network/inetwork";
import PendingTransactionPool from "@GBlibs/txs/pendingtxs";
import TransactionManager from "@GBlibs/txs/txs";
import { Transaction } from "@GBlibs/txs/txtypes";

/**
 * ✅ PBFT 기반 블록체인 시스템 (모든 기능 포함)
 */
export default class Blockchain {
  private pbft: PBFTConsensus;
  private validatorManager: ValidatorManager;
  private blockManager: BlockManager;
  private txManager: TransactionManager;
  private pendingPool: PendingTransactionPool;
  private keyManager: KeyManager;
  private network: NetworkInterface;
  private minTxPerBlock: number = 1;

  constructor(
    validatorManager: ValidatorManager,
    blockManager: BlockManager,
    txManager: TransactionManager,
    pbft: PBFTConsensus,
    network: NetworkInterface,
    pendingPool: PendingTransactionPool,
    keyManager: KeyManager
  ) {
    this.validatorManager = validatorManager;
    this.blockManager = blockManager;
    this.txManager = txManager;
    this.pbft = pbft;
    this.network = network;
    this.pendingPool = pendingPool;
    this.keyManager = keyManager;

    console.log("✅ Blockchain 시스템 초기화 완료");

    // 블록체인 네트워크 이벤트 리스너 설정
    this.setupNetworkListeners();
  }

  /**
   * ✅ 네트워크 이벤트 리스너 설정
   */
  private setupNetworkListeners() {
    this.network.on("transaction", (transaction) => {
      console.log(`📥 [Blockchain] 트랜잭션 수신: ${JSON.stringify(transaction)}`);
      this.processTransaction(transaction);
    });

    this.network.on("block", (block) => {
      console.log(`📥 [Blockchain] 블록 수신: ${block.index}`);
      this.processBlock(block);
    });
  }

  /**
   * ✅ 트랜잭션 생성 및 네트워크 전파
   */
  async createTransaction(senderPrivateKey:string, senderPubKey: string, sender: string, recipient: string, amount: number, mediator: string) {
    console.log(`📝 [Blockchain] 트랜잭션 생성: ${sender} → ${recipient} (${amount} 코인)`);
    
    const transaction = await this.txManager.createTransaction(senderPrivateKey, senderPubKey, sender, recipient, amount, mediator);
    await this.pendingPool.addTransaction(transaction);
    this.network.sendMessage("transaction", transaction);
  }

  /**
   * ✅ 네트워크에서 받은 트랜잭션 처리 (검증 후 Pending Pool에 추가)
   */
  private async processTransaction(transaction: Transaction) {
    console.log(`🔍 [Blockchain] 트랜잭션 검증 중: ${transaction.txid}`);

    const isValid = await this.keyManager.verifySignature(transaction.senderPublicKey, transaction.txid, transaction.signature);
    if (!isValid) {
      console.log(`❌ [Blockchain] 트랜잭션 무효 (서명 검증 실패): ${transaction.txid}`);
      return;
    }

    await this.pendingPool.addTransaction(transaction);
    console.log(`✅ [Blockchain] 트랜잭션 저장 완료: ${transaction.txid}`);
  }

  /**
   * ✅ 블록 생성 속도를 분석하여 최소 트랜잭션 개수를 조절
   */
  private async adjustMinTxPerBlock() {
    const blocks = await this.blockManager.getBlockchain();
    if (blocks.length < 600) return;

    const firstBlock = blocks[blocks.length - 600];
    const lastBlock = blocks[blocks.length - 1];

    const timeElapsed = lastBlock.timestamp - firstBlock.timestamp;
    const expectedTime = 600 * 10;

    if (timeElapsed < expectedTime) {
      this.minTxPerBlock += 1;
    } else if (timeElapsed > expectedTime) {
      this.minTxPerBlock = Math.max(1, this.minTxPerBlock - 1);
    }

    console.log(`🔄 [Blockchain] 블록 생성 속도 조정 완료: 최소 트랜잭션 개수 = ${this.minTxPerBlock}`);
  }

  /**
   * ✅ 블록 생성 및 PBFT 합의 요청
   */
  async createBlock() {
    console.log("🔵 [Blockchain] 새로운 블록 생성 요청");
    
    const transactions = await this.pendingPool.getAllTransactions();
    if (transactions.length < this.minTxPerBlock) {
      console.log(`⚠️ [Blockchain] 트랜잭션 부족 (최소 필요: ${this.minTxPerBlock})`);
      return;
    }

    await this.pbft.proposeBlock(transactions);
    this.adjustMinTxPerBlock();
  }

  /**
   * ✅ 네트워크에서 받은 블록 처리 및 체인 리오그 실행
   */
  private async processBlock(newBlock: Block) {
    console.log(`✅ [Blockchain] 블록 검증 중: ${newBlock.index}`);

    const latestBlock = this.blockManager.getLatestBlock();
    if (!(await this.blockManager.isValidBlock(newBlock, latestBlock, this.txManager))) {
      console.log(`❌ [Blockchain] 블록 검증 실패: ${newBlock.index}`);
      return;
    }

    if (newBlock.transactions.length < this.minTxPerBlock) {
      console.log(`❌ [Blockchain] 블록 무효: 트랜잭션 개수 부족 (${newBlock.transactions.length} < ${this.minTxPerBlock})`);
      return;
    }

    await this.blockManager.saveBlock(newBlock);
    await this.pendingPool.clearTransactions(newBlock.transactions.map(tx => tx.txid));
    console.log(`✅ [Blockchain] 블록 저장 완료: ${newBlock.index}`);

    this.adjustMinTxPerBlock();
  }

  /**
   * ✅ 블록체인 상태 출력
   */
  printBlockchain() {
    console.log("📜 [Blockchain] 현재 블록체인 상태:");
    console.table(this.blockManager.getBlockchain());
  }
}

