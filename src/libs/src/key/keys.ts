import { createPrivateKey, createPublicKey, generateKeyPairSync, createSign, createVerify } from "crypto";
import { Level } from "level";
import crypto from "crypto";
import { ec as EC } from "elliptic"
import bs58check from "bs58check"

// ✅ 키 저장용 LevelDB
const keyDB = new Level<string, string>("./key-db", { valueEncoding: "utf-8" });

export default class KeyManager {
  ec = new EC("secp256k1")
  constructor() { }

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
   * ✅ PEM 형식의 개인키로부터 공개키 파생
   */
  derivePublicKeyFromPrivateKey(privateKeyPem: string): string {
    const privateKeyObj = createPrivateKey({
      key: privateKeyPem,
      format: "pem",
      type: "pkcs8",
    });

    const publicKeyObj = createPublicKey(privateKeyObj);

    return publicKeyObj.export({
      type: "spki",
      format: "pem",
    }) as string;
  }

  /**
   * ✅ 비밀번호 기반 AES-256 개인키 암호화
   */
  encryptPrivateKey(privateKey: string, password: string): string {
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
  decryptPrivateKey(encryptedKey: string, password: string): string | null {
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
  // const db = new Level<string, string>("path-to-db");
  async putIfAbsent(key: string, value: string): Promise<boolean> {
    const existing = await keyDB.get(key);
    if (existing !== undefined && existing !== null) {
      console.log(`⚠️ 키 '${key}'는 이미 존재합니다. 저장하지 않음.`);
      return false;
    }
    await keyDB.put(key, value);
    console.log(`✅ 키 '${key}'가 존재하지 않아 저장되었습니다.`);
    return true;
  }
  /**
   * ✅ 저장된 모든 키와 해당 값 리스트 반환
   */
  async listAllKeysWithValues(): Promise<{ key: string; value: string }[]> {
    const result: { key: string; value: string }[] = [];
    for await (const [key, value] of keyDB.iterator()) {
      if(key.endsWith(":public")) {
        const id = key.split(":")[0]
        const pubKey = this.pemToBitcoinAddress(value)
        result.push({ key: id, value: pubKey });
        console.log(id, value)
      }
    }
    return result;
  }
  pemToBitcoinAddress(pem: string): string {
    // 1. PEM → 키 객체
    const keyObject = createPublicKey({
      key: pem,
      format: "pem",
      type: "spki"
    });

    // 2. DER Buffer 가져오기
    const der = keyObject.export({ format: "der", type: "spki" }) as Buffer;

    // 3. elliptic 으로 공개키 객체 파싱
    const pubKeyPoint = this.ec.keyFromPublic(der.slice(-65), "hex").getPublic();

    // 4. 압축 공개키 (33바이트, hex)
    const compressedPubKey = pubKeyPoint.encodeCompressed("hex"); // or uncompressed

    // 5. 공개키 → SHA256 → RIPEMD160
    const sha256 = crypto.createHash("sha256").update(Buffer.from(compressedPubKey, "hex")).digest();
    const pubKeyHash = crypto.createHash("ripemd160").update(sha256).digest();

    // 6. 버전 바이트 붙이기 (P2PKH: 0x00 for mainnet)
    const payload: Uint8Array = Buffer.concat([Buffer.from([0x00]), pubKeyHash]);

    // 7. Base58Check 인코딩 → Bitcoin 주소
    const address = bs58check.encode(payload);
    return address;
  }
  deriveBitcoinPublicKeyHex(privateKeyPem: string, compressed = true): string {
      // 1. 개인키 객체 생성
      const privateKeyObj = createPrivateKey({
          key: privateKeyPem,
          format: "pem",
          type: "pkcs8",
      });

      // 2. DER에서 개인키 추출 (elliptic이 필요로 함)
      const der = privateKeyObj.export({ format: "der", type: "pkcs8" }) as Buffer;

      // 3. elliptic에 맞게 키 가져오기
      // 개인키는 보통 DER 구조 끝에 있으므로 직접 파싱하거나 외부 라이브러리로 추출해야 합니다.
      // 여기서는 예제를 간단히 하기 위해 PEM에서 hex 키를 바로 받았다고 가정합니다.

      const keyPair = this.ec.keyFromPrivate(der.slice(-32)); // 32바이트 개인키 사용

      // 4. 공개키 반환
      return keyPair.getPublic(compressed, "hex");
  }

  /**
   * ✅ 키 저장 (개인키는 비밀번호로 암호화)
   */
  async saveKeyPair(id: string, password: string, privateKey: string, publicKey: string) {
    const encryptedPrivateKey = this.encryptPrivateKey(privateKey, password);
    if (!await this.putIfAbsent(`${id}:private`, encryptedPrivateKey)) {
      return false
    }
    if (!await this.putIfAbsent(`${id}:public`, publicKey)) {
      return false
    }
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

