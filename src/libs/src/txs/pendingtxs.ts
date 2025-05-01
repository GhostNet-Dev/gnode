import { Transaction } from "./txtypes";
import { logger } from "@GBlibs/logger/logger";
import { IDBManager, IGenericDB } from "@GBlibs/db/dbtypes";

/**
 * ✅ Pending 트랜잭션을 관리하는 Pool
 */
export default class PendingTransactionPool {
  private pendingDB: IGenericDB<Transaction>;

  constructor(
    private dbMgr: IDBManager
  ) {
    this.pendingDB = this.dbMgr.getDB<Transaction>("pending-tx-db");
  }

  /**
   * ✅ 새로운 트랜잭션 추가
   */
  async addTransaction(transaction: Transaction): Promise<void> {
    await this.pendingDB.put(transaction.txid, transaction);
    logger.info(`📥 [PendingTransactionPool] 트랜잭션 추가: ${transaction.txid}`);
  }

  /**
   * ✅ 모든 Pending 트랜잭션 가져오기
   */
  async getAllTransactions(): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    for await (const [, tx] of this.pendingDB.iterator()) {
      transactions.push(tx);
    }
    return transactions;
  }

  /**
   * ✅ 특정 트랜잭션 제거 (블록 생성 시 사용)
   */
  async removeTransaction(txid: string): Promise<void> {
    try {
      await this.pendingDB.del(txid);
      logger.info(`🗑️ [PendingTransactionPool] 트랜잭션 제거: ${txid}`);
    } catch (error) {
      logger.warn(`⚠️ [PendingTransactionPool] 트랜잭션 삭제 실패: ${txid}`);
    }
  }

  /**
   * ✅ 블록에 포함된 트랜잭션을 모두 제거
   */
  async clearTransactions(txids: string[]): Promise<void> {
    for (const txid of txids) {
      await this.removeTransaction(txid);
    }
  }
}

