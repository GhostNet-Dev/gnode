// KeyManager.ts (Web 환경 호환)
import { IDBManager, IGenericDB } from "@GBlibs/db/dbtypes";
import { logger } from "@GBlibs/logger/logger";
import { WebCryptoProvider } from "./webcrypto";
import hash from "hash.js";
import bs58 from "bs58";

export default class KeyManager {
  private keyDB: IGenericDB<string>

  constructor(
    dbMgr: IDBManager,
    private crypto: WebCryptoProvider
  ) {
    this.keyDB = dbMgr.getDB<string>("key-db");
    this.keyDB.open();
  }

  async generateKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
    return await this.crypto.generateKeyPair();
  }

  async derivePublicKeyFromPrivateKey(privateKeyPem: string): Promise<string> {
    // 1. PEM → ArrayBuffer
    const keyBuffer = this.crypto.pemToArrayBuffer(privateKeyPem); // <- 구현된 함수

    // 2. Import privateKey (must be extractable!)
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      true, // ✅ 반드시 extractable: true
      ["sign"]
    );

    // 3. Export to JWK (JSON Web Key)
    const jwk = await crypto.subtle.exportKey("jwk", privateKey);

    // 4. Remove private key material (d) & set correct key_ops
    delete jwk.d;
    jwk.key_ops = ["verify"];

    // 5. Import as public key
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"]
    );

    // 6. Export public key as SPKI
    const spki = await crypto.subtle.exportKey("spki", publicKey);

    // 7. Return as PEM
    return this.crypto.arrayBufferToPem(spki, "PUBLIC KEY");
  }



  async encryptPrivateKey(privateKey: string, password: string): Promise<string> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      enc.encode(privateKey)
    );

    return `${Buffer.from(salt).toString("base64")}:${Buffer.from(iv).toString("base64")}:${Buffer.from(ciphertext).toString("base64")}`;
  }

  async decryptPrivateKey(encrypted: string, password: string): Promise<string | null> {
    try {
      const [saltB64, ivB64, dataB64] = encrypted.split(":");
      const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
      const data = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));

      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      const aesKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        data
      );
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      logger.error("❌ 복호화 실패:", e);
      return null;
    }
  }

  async putIfAbsent(key: string, value: string): Promise<boolean> {
    const existing = await this.keyDB.get(key);
    if (existing !== undefined && existing !== null) {
      logger.info(`⚠️ 키 '${key}'는 이미 존재합니다. 저장하지 않음.`);
      return false;
    }
    await this.keyDB.put(key, value);
    logger.info(`✅ 키 '${key}'가 존재하지 않아 저장되었습니다.`);
    return true;
  }

  async saveKeyPair(id: string, password: string, privateKey: string, publicKey: string) {
    const encryptedPrivateKey = await this.encryptPrivateKey(privateKey, password);
    await this.putIfAbsent(`${id}:private`, encryptedPrivateKey);
    await this.putIfAbsent(`${id}:public`, publicKey);
    logger.info(`✅ 키 저장 완료 (ID: ${id})`);
  }

  async getPublicKey(id: string): Promise<string | null> {
    try {
      const ret = await this.keyDB.get(`${id}:public`);
      return ret ?? null;
    } catch {
      return null;
    }
  }

  async getPrivateKey(id: string, password: string): Promise<string | null> {
    try {
      const encrypted = await this.keyDB.get(`${id}:private`);
      if (!encrypted) return null;
      return await this.decryptPrivateKey(encrypted, password);
    } catch {
      return null;
    }
  }

  async signData(id: string, data: string, password?: string): Promise<string | null> {
    const privateKey = await this.getPrivateKey(id, password ?? "");
    if (!privateKey) {
      logger.error(`❌ 개인키 없음 (ID: ${id})`);
      return null;
    }
    return await this.crypto.createSign(data, privateKey);
  }

  async verifySignature(id: string, data: string, signature: string): Promise<boolean> {
    const publicKey = await this.getPublicKey(id);
    if (!publicKey) {
      logger.error(`❌ 공개키 없음 (ID: ${id})`);
      return false;
    }
    return await this.crypto.createVerify(data, signature, publicKey);
  }
  async listAllKeysWithValues(): Promise<{ key: string; value: string }[]> {
    const result: { key: string; value: string }[] = [];
    for await (const [key, value] of this.keyDB.iterator()) {
      if (key.endsWith(":public")) {
        const id = key.split(":")[0];
        const address = await this.pemToBitcoinAddress(value);
        result.push({ key: id, value: address });
      }
    }
    return result;
  }


  async pemToBitcoinAddress(pem: string): Promise<string> {
    // 1. PEM → CryptoKey (SPKI)
    const key = await crypto.subtle.importKey(
      "spki",
      this.crypto.pemToArrayBuffer(pem),
      { name: "ECDSA", namedCurve: "P-256" }, // or "secp256k1" if WebCrypto supports it
      true,
      []
    );

    // 2. SPKI DER export
    const spki = await crypto.subtle.exportKey("spki", key);

    // 3. SHA-256
    const hash1 = new Uint8Array(await crypto.subtle.digest("SHA-256", spki));

    // 4. RIPEMD-160 (WebCrypto는 지원 안함 → hash.js 사용)
    const ripemd160 = hash.ripemd160().update(Buffer.from(hash1)).digest();
    const pubKeyHash = Uint8Array.from(ripemd160);

    // 5. Add network prefix (0x00 = mainnet)
    const payload = new Uint8Array(1 + pubKeyHash.length);
    payload[0] = 0x00;
    payload.set(pubKeyHash, 1);

    // 6. Double SHA-256 for checksum
    const checksum1 = new Uint8Array(await crypto.subtle.digest("SHA-256", payload));
    const checksum2 = new Uint8Array(await crypto.subtle.digest("SHA-256", checksum1));
    const checksum = checksum2.slice(0, 4);

    // 7. Append checksum
    const fullPayload = new Uint8Array(payload.length + 4);
    fullPayload.set(payload);
    fullPayload.set(checksum, payload.length);

    // 8. Base58 인코딩
    return bs58.encode(Buffer.from(fullPayload));
  }
}
