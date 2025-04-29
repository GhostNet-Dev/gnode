import { Level } from "level";
import { createHash, createSign, createVerify } from "crypto";
import { Transaction, UTXO } from "./txtypes";
import { logger } from "@GBlibs/logger/logger";
import { IDBManager, IGenericDB } from "@GBlibs/db/dbtypes";

// UTXO 저장용 DB
// 트랜잭션 저장용 DB
export default class TransactionManager {
  private utxoDB: IGenericDB<UTXO>;
  private txDB: IGenericDB<Transaction>;
  private dataTxDB: IGenericDB<Transaction>;

  constructor(
    private dbMgr: IDBManager
  ) {
    this.utxoDB = this.dbMgr.getDB<UTXO>("utxo-db");
    this.txDB = this.dbMgr.getDB<Transaction>("tx-db");
    this.dataTxDB = this.dbMgr.getDB<Transaction>("data-tx-db");
  }
  // ✅ UTXO 저장
  async saveUTXO(utxo: UTXO): Promise<void> {
    const key = `${utxo.txid}:${utxo.index}`;
    await this.utxoDB.put(key, utxo);
    logger.info(`✅ UTXO 저장 완료: ${key}`);
  }

  // ✅ UTXO 조회
  async getUTXO(txid: string, index: number): Promise<UTXO | null> {
    const key = `${txid}:${index}`;
    try {
      const utxo = await this.utxoDB.get(key);
      if(!utxo) return null;
      return utxo
    } catch (error) {
      return null;
    }
  }

  // ✅ UTXO 삭제
  async removeUTXO(txid: string, index: number): Promise<void> {
    const key = `${txid}:${index}`;
    try {
      await this.utxoDB.del(key);
      logger.info(`🗑️ UTXO 삭제 완료: ${key}`);
    } catch (error) {
      logger.warn(`⚠️ UTXO 삭제 실패: ${key} - ${error}`);
    }
  }

  // ✅ 트랜잭션 해시 생성 (중계자 포함)
  generateTransactionHash(transaction: Omit<Transaction, "signature">): string {
    const hash = createHash("sha256");
    hash.update(
      JSON.stringify(transaction.inputs) +
      JSON.stringify(transaction.outputs) +
      transaction.senderPublicKey +
      (transaction.mediator || "")
    );
    return hash.digest("hex");
  }

  // ✅ 트랜잭션 서명 (전체 데이터 기반)
  signTransaction(transactionData: Omit<Transaction, "signature">, privateKey: string): string {
    const sign = createSign("SHA256");
    sign.update(JSON.stringify(transactionData)); // 트랜잭션 전체 데이터를 서명에 포함
    sign.end();
    return sign.sign(privateKey, "hex");
  }

  // ✅ 트랜잭션 검증 (서명 확인)
  verifyTransaction(transaction: Transaction): boolean {
    const verify = createVerify("SHA256");
    const transactionData: Omit<Transaction, "signature"> = {
      txid: transaction.txid,
      inputs: transaction.inputs,
      outputs: transaction.outputs,
      senderPublicKey: transaction.senderPublicKey,
      mediator: transaction.mediator,
    };
    verify.update(JSON.stringify(transactionData));
    verify.end();
    return verify.verify(transaction.senderPublicKey, transaction.signature, "hex");
  }

  // ✅ 트랜잭션 생성 (송신자, 수신자, 중계자 포함)
  async createTransaction(
    senderPrivateKey: string,
    senderPublicKey: string,
    sender: string,
    recipient: string,
    amount: number,
    mediator: string
  ): Promise<Transaction> {
    let totalInput = 0;
    const inputs: UTXO[] = [];

    // 🔍 UTXO 조회 (보유한 금액 확인)
    for await (const [_, utxo] of this.utxoDB.iterator()) {
      if (utxo.owner === sender && utxo.amount > 0) {
        inputs.push(utxo);
        totalInput += utxo.amount;
        if (totalInput >= amount) break;
      }
    }

    if (totalInput < amount) throw new Error("잔액 부족!");

    // 🔄 사용한 UTXO 삭제
    for (const utxo of inputs) {
      await this.removeUTXO(utxo.txid, utxo.index);
    }

    const outputs: UTXO[] = [
      { txid: "", index: 0, amount, owner: recipient }
    ];
    if (totalInput > amount) {
      outputs.push({ txid: "", index: 1, amount: totalInput - amount, owner: sender });
    }
    if (mediator) {
      outputs.push({ txid: "", index: outputs.length, amount: 1, owner: mediator });
    }

    // ✅ 트랜잭션 객체 생성 (txid 제외)
    const txData: Omit<Transaction, "signature"> = {
      txid: "",
      inputs,
      outputs,
      senderPublicKey,
      mediator
    };

    // ✅ 트랜잭션 해시 생성
    txData.txid = this.generateTransactionHash(txData);

    // ✅ 서명 추가 (트랜잭션 전체 데이터 기반)
    const signedTx: Transaction = { ...txData, signature: this.signTransaction(txData, senderPrivateKey) };

    // ✅ 트랜잭션 저장
    await this.saveTransaction(signedTx);
    for (let i = 0; i < outputs.length; i++) {
      await this.saveUTXO({ ...outputs[i], txid: txData.txid, index: i });
    }

    return signedTx;
  }

  // 데이터 저장용 트랜잭션 생성
  async createHashedDataTransaction(
    senderPrivateKey: string,
    senderPublicKey: string,
    sender: string,
    key: string,
    dataHash: string,
    prevTxid?: string,
    prevIndex?: number,
    mediator: string = ""
  ): Promise<Transaction> {
    const inputs: UTXO[] = [];
    if (prevTxid && prevIndex !== undefined) {
      const prev = await this.getUTXO(prevTxid, prevIndex);
      if (!prev || prev.owner !== sender) throw new Error("이전 데이터 없음 또는 권한 부족");
      inputs.push(prev);
      await this.removeUTXO(prevTxid, prevIndex);
    }

    const output: UTXO = {
      txid: "new_data_tx",
      index: 0,
      amount: 0,
      owner: sender,
      key,
      hash: dataHash
    };

    const txData: Omit<Transaction, "signature"> = {
      txid: "",
      inputs,
      outputs: [output],
      senderPublicKey,
      mediator
    };

    txData.txid = this.generateTransactionHash(txData);
    const signedTx: Transaction = { ...txData, signature: this.signTransaction(txData, senderPrivateKey) };

    await this.saveTransaction(signedTx);
    await this.saveUTXO({ ...output, txid: txData.txid });
    return signedTx;
  }



  // 최신 데이터 해시 조회
  async getLatestDataHash(key: string): Promise<string | null> {
    let latest: UTXO | null = null;
    for await (const [_, tx] of this.dataTxDB.iterator()) {
      for (const utxo of tx.outputs) {
        if (utxo.key === key && utxo.hash && utxo.hash !== "__deleted__") {
          if (!latest || tx.txid > latest.txid) {
            latest = utxo;
          }
        }
      }
    }
    return latest?.hash ?? null;
  }

  // 데이터 삭제 트랜잭션
  async deleteData(
    senderPrivateKey: string,
    senderPublicKey: string,
    sender: string,
    key: string,
    mediator: string = ""
  ): Promise<Transaction> {
    const prevUTXO = await this.getLatestDataUTXO(key);
    if (!prevUTXO || prevUTXO.owner !== sender) throw new Error("삭제 권한 없음 또는 데이터 없음");
    await this.removeUTXO(prevUTXO.txid, prevUTXO.index);

    const deletedUTXO: UTXO = {
      txid: "deleted_tx",
      index: 0,
      amount: 0,
      owner: sender,
      key,
      hash: "__deleted__"
    };

    const txData: Omit<Transaction, "signature"> = {
      txid: "",
      inputs: [prevUTXO],
      outputs: [deletedUTXO],
      senderPublicKey,
      mediator
    };

    txData.txid = this.generateTransactionHash(txData);
    const signedTx: Transaction = { ...txData, signature: this.signTransaction(txData, senderPrivateKey) };

    await this.saveTransaction(signedTx);
    await this.saveUTXO({ ...deletedUTXO, txid: txData.txid });
    return signedTx;
  }

  // 최신 UTXO 가져오기
  async getLatestDataUTXO(key: string): Promise<UTXO | null> {
    let latest: UTXO | null = null;
    for await (const [_, tx] of this.dataTxDB.iterator()) {
      for (const utxo of tx.outputs) {
        if (utxo.key === key) {
          if (!latest || tx.txid > latest.txid) {
            latest = utxo;
          }
        }
      }
    }
    return latest;
  }

  // 해시 생성 유틸리티
  generateDataHash(content: string): string {
    const hash = createHash("sha256");
    hash.update(content);
    return hash.digest("hex");
  }
  // ✅ 트랜잭션 저장
  async saveTransaction(tx: Transaction): Promise<void> {
    await this.txDB.put(tx.txid, tx);
    const hasData = tx.outputs.some(o => o.hash);
    if (hasData) await this.dataTxDB.put(tx.txid, tx);
    logger.info(`✅ 트랜잭션 저장 완료: ${tx.txid}`);
  }

  // ✅ 트랜잭션 조회 및 검증
  async getTransaction(txid: string): Promise<Transaction | null> {
    try {
      const transaction = await this.txDB.get(txid);
      if(transaction === undefined) return null;

      if (!this.verifyTransaction(transaction)) {
        logger.error(`❌ 트랜잭션 검증 실패: ${txid}`);
        return null;
      }
      return transaction;
    } catch (error) {
      return null;
    }
  }
}

