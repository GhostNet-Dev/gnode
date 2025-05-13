// TransactionManager.ts
import { Transaction, UTXO } from "./txtypes";
import { logger } from "@GBlibs/logger/logger";
import { IDBManager, IGenericDB } from "@GBlibs/db/dbtypes";
import { WebCryptoProvider } from "@GBlibs/key/webcrypto";

export default class TransactionManager {
  private utxoDB: IGenericDB<UTXO>;
  private txDB: IGenericDB<Transaction>;
  private dataTxDB: IGenericDB<Transaction>;

  constructor(
    private dbMgr: IDBManager,
    private crypto: WebCryptoProvider // crypto provider 주입
  ) {
    this.utxoDB = this.dbMgr.getDB<UTXO>("utxo-db");
    this.txDB = this.dbMgr.getDB<Transaction>("tx-db");
    this.dataTxDB = this.dbMgr.getDB<Transaction>("data-tx-db");
  }

  async generateTransactionHash(transaction: Omit<Transaction, "signature">): Promise<string> {
    const input = JSON.stringify(transaction.inputs) +
      JSON.stringify(transaction.outputs) +
      transaction.senderPublicKey +
      (transaction.mediator || "");
    return await this.crypto.createHash(input);
  }

  async signTransaction(transactionData: Omit<Transaction, "signature">, privateKey: string): Promise<string> {
    return await this.crypto.createSign(JSON.stringify(transactionData), privateKey);
  }

  async verifyTransaction(transaction: Transaction): Promise<boolean> {
    const txData: Omit<Transaction, "signature"> = {
      txid: transaction.txid,
      inputs: transaction.inputs,
      outputs: transaction.outputs,
      senderPublicKey: transaction.senderPublicKey,
      mediator: transaction.mediator,
    };
    return await this.crypto.createVerify(JSON.stringify(txData), transaction.signature, transaction.senderPublicKey);
  }

  async saveUTXO(utxo: UTXO): Promise<void> {
    const key = `${utxo.txid}:${utxo.index}`;
    await this.utxoDB.put(key, utxo);
    logger.info(`✅ UTXO 저장 완료: ${key}`);
  }

  async removeUTXO(txid: string, index: number): Promise<void> {
    const key = `${txid}:${index}`;
    try {
      await this.utxoDB.del(key);
      logger.info(`🗑️ UTXO 삭제 완료: ${key}`);
    } catch (error) {
      logger.warn(`⚠️ UTXO 삭제 실패: ${key} - ${error}`);
    }
  }

  async getUTXO(txid: string, index: number): Promise<UTXO | null> {
    const key = `${txid}:${index}`;
    try {
      return (await this.utxoDB.get(key)) ?? null;
    } catch {
      return null;
    }
  }

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

    for await (const [_, utxo] of this.utxoDB.iterator()) {
      if (utxo.owner === sender && utxo.amount > 0) {
        inputs.push(utxo);
        totalInput += utxo.amount;
        if (totalInput >= amount) break;
      }
    }

    if (totalInput < amount) throw new Error("잔액 부족!");

    for (const utxo of inputs) {
      await this.removeUTXO(utxo.txid, utxo.index);
    }

    const outputs: UTXO[] = [
      { txid: "", index: 0, amount, owner: recipient },
    ];
    if (totalInput > amount) {
      outputs.push({ txid: "", index: 1, amount: totalInput - amount, owner: sender });
    }
    if (mediator) {
      outputs.push({ txid: "", index: outputs.length, amount: 1, owner: mediator });
    }

    const txData: Omit<Transaction, "signature"> = {
      txid: "",
      inputs,
      outputs,
      senderPublicKey,
      mediator,
    };
    txData.txid = await this.generateTransactionHash(txData);
    const signedTx: Transaction = { ...txData, signature: await this.signTransaction(txData, senderPrivateKey) };

    await this.saveTransaction(signedTx);
    for (let i = 0; i < outputs.length; i++) {
      await this.saveUTXO({ ...outputs[i], txid: txData.txid, index: i });
    }
    return signedTx;
  }

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

    txData.txid = await this.generateTransactionHash(txData);
    const signedTx: Transaction = { ...txData, signature: await this.signTransaction(txData, senderPrivateKey) };

    await this.saveTransaction(signedTx);
    await this.saveUTXO({ ...output, txid: txData.txid });
    return signedTx;
  }

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

    txData.txid = await this.generateTransactionHash(txData);
    const signedTx: Transaction = { ...txData, signature: await this.signTransaction(txData, senderPrivateKey) };

    await this.saveTransaction(signedTx);
    await this.saveUTXO({ ...deletedUTXO, txid: txData.txid });
    return signedTx;
  }

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

  async getLatestDataHash(key: string): Promise<string | null> {
    const utxo = await this.getLatestDataUTXO(key);
    return utxo?.hash ?? null;
  }

  async saveTransaction(tx: Transaction): Promise<void> {
    await this.txDB.put(tx.txid, tx);
    const hasData = tx.outputs.some(o => o.hash);
    if (hasData) await this.dataTxDB.put(tx.txid, tx);
    logger.info(`✅ 트랜잭션 저장 완료: ${tx.txid}`);
  }

  async getTransaction(txid: string): Promise<Transaction | null> {
    try {
      const transaction = await this.txDB.get(txid);
      if (!transaction) return null;
      if (!(await this.verifyTransaction(transaction))) {
        logger.error(`❌ 트랜잭션 검증 실패: ${txid}`);
        return null;
      }
      return transaction;
    } catch {
      return null;
    }
  }
}
