import { Level } from "level";
import { createHash, createSign, createVerify } from "crypto";
import { Transaction, UTXO } from "./txtypes";
import { logger } from "@GBlibs/logger/logger";

// UTXO 저장용 DB
const utxoDB = new Level<string, UTXO>("./utxo-db", { valueEncoding: "json" });
// 트랜잭션 저장용 DB
const txDB = new Level<string, Transaction>("./tx-db", { valueEncoding: "json" });

export default class TransactionManager {
  // ✅ UTXO 저장
  async saveUTXO(utxo: UTXO): Promise<void> {
    const key = `${utxo.txid}:${utxo.index}`;
    await utxoDB.put(key, utxo);
    logger.info(`✅ UTXO 저장 완료: ${key}`);
  }

  // ✅ UTXO 조회
  async getUTXO(txid: string, index: number): Promise<UTXO | null> {
    const key = `${txid}:${index}`;
    try {
      return await utxoDB.get(key);
    } catch (error) {
      return null;
    }
  }

  // ✅ UTXO 삭제
  async removeUTXO(txid: string, index: number): Promise<void> {
    const key = `${txid}:${index}`;
    try {
      await utxoDB.del(key);
      logger.info(`🗑️ UTXO 삭제 완료: ${key}`);
    } catch (error) {
      logger.error("UTXO 삭제 실패:", error);
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
    for await (const [_, utxo] of utxoDB.iterator()) {
      if (utxo.owner === sender) {
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

    // ✅ 새로운 UTXO 생성 (중계자가 존재하면 중계자도 추가)
    const newUTXOs: UTXO[] = [{ txid: "new_tx", index: 0, amount, owner: recipient }];
    if (totalInput > amount) {
      newUTXOs.push({ txid: "new_tx", index: 1, amount: totalInput - amount, owner: sender });
    }
    if (mediator) {
      newUTXOs.push({ txid: "new_tx", index: 2, amount: 1, owner: mediator }); // 중계자에게 1코인 지급
    }

    // ✅ 트랜잭션 객체 생성 (txid 제외)
    const transactionData: Omit<Transaction, "signature"> = {
      txid: "",
      inputs,
      outputs: newUTXOs,
      senderPublicKey,
      mediator,
    };

    // ✅ 트랜잭션 해시 생성
    transactionData.txid = this.generateTransactionHash(transactionData);

    // ✅ 서명 추가 (트랜잭션 전체 데이터 기반)
    const signedTransaction: Transaction = {
      ...transactionData,
      signature: this.signTransaction(transactionData, senderPrivateKey),
    };

    // ✅ 트랜잭션 저장
    await this.saveTransaction(signedTransaction);
    return signedTransaction;
  }

  // ✅ 트랜잭션 저장
  async saveTransaction(tx: Transaction): Promise<void> {
    await txDB.put(tx.txid, tx);
    logger.info(`✅ 트랜잭션 저장 완료: ${tx.txid}`);
  }

  // ✅ 트랜잭션 조회 및 검증
  async getTransaction(txid: string): Promise<Transaction | null> {
    try {
      const transaction = await txDB.get(txid);
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

