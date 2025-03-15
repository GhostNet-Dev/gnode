import { generateKeyPairSync, createSign, createVerify } from "crypto";
import { Level } from "level";
import crypto from "crypto";

// ✅ 키 저장용 LevelDB
const keyDB = new Level<string, string>("./key-db", { valueEncoding: "utf-8" });

export default class KeyManager {
  constructor() {}

  /**
   * ✅ ECDSA 개인키 및 공개키 생성
   */
  generateKeyPair(): { privateKey: string; publicKey: string } {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "secp256k1",
      privateKeyEncoding: { format: "pem", type: "pkcs8" },
      publicKeyEncoding: { format: "pem", type: "spki" },
    });

    console.log("🔑 개인키 및 공개키 생성 완료");
    return { privateKey, publicKey };
  }

  /**
   * ✅ 비밀번호 기반 AES-256 개인키 암호화
   */
  private encryptPrivateKey(privateKey: string, password: string): string {
    const key = crypto.scryptSync(password, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(privateKey, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }

  /**
   * ✅ 비밀번호 기반 AES-256 개인키 복호화
   */
  private decryptPrivateKey(encryptedKey: string, password: string): string | null {
    try {
      const key = crypto.scryptSync(password, "salt", 32);
      const [ivHex, encryptedData] = encryptedKey.split(":");
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(encryptedData, "hex", "utf-8");
      decrypted += decipher.final("utf-8");
      return decrypted;
    } catch (error) {
      console.error("❌ 잘못된 비밀번호! 개인키 복호화 실패");
      return null;
    }
  }

  /**
   * ✅ 키 저장 (개인키는 비밀번호로 암호화)
   */
  async saveKeyPair(id: string, privateKey: string, publicKey: string, password: string) {
    const encryptedPrivateKey = this.encryptPrivateKey(privateKey, password);
    await keyDB.put(`${id}:private`, encryptedPrivateKey);
    await keyDB.put(`${id}:public`, publicKey);
    console.log(`✅ 키 저장 완료 (ID: ${id})`);
  }

  /**
   * ✅ 공개키 가져오기
   */
  async getPublicKey(id: string): Promise<string | null> {
    try {
      return await keyDB.get(`${id}:public`);
    } catch {
      return null;
    }
  }

  /**
   * ✅ 개인키 가져오기 (비밀번호 필요)
   */
  async getPrivateKey(id: string, password: string): Promise<string | null> {
    try {
      const encryptedKey = await keyDB.get(`${id}:private`);
      return this.decryptPrivateKey(encryptedKey, password);
    } catch {
      return null;
    }
  }

  /**
   * ✅ 개인키로 서명 생성 (비밀번호 필요)
   */
  async signData(id: string, data: string, password: string): Promise<string | null> {
    const privateKey = await this.getPrivateKey(id, password);
    if (!privateKey) {
      console.error(`❌ 개인키 없음 또는 복호화 실패 (ID: ${id})`);
      return null;
    }

    const sign = createSign("SHA256");
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, "hex");
  }

  /**
   * ✅ 공개키로 서명 검증
   */
  async verifySignature(id: string, data: string, signature: string): Promise<boolean> {
    const publicKey = await this.getPublicKey(id);
    if (!publicKey) {
      console.error(`❌ 공개키 없음 (ID: ${id})`);
      return false;
    }

    const verify = createVerify("SHA256");
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, "hex");
  }
}

