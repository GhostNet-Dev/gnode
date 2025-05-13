// WebCryptoProvider.ts
// Node.js crypto API 이름을 따르는 브라우저용 Web Crypto API 구현

export class WebCryptoProvider {
    // createHash: SHA-256 해시 생성
    async createHash(data: string): Promise<string> {
        const encoded = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    // createSign: SHA-256 + ECDSA 서명
    async createSign(data: string, privateKeyPem: string): Promise<string> {
        const key = await this.createPrivateKey(privateKeyPem);
        const encoded = new TextEncoder().encode(data);
        const signature = await crypto.subtle.sign(
            { name: "ECDSA", hash: "SHA-256" },
            key,
            encoded
        );
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    // createVerify: SHA-256 + ECDSA 검증
    async createVerify(data: string, signatureBase64: string, publicKeyPem: string): Promise<boolean> {
        const key = await this.createPublicKey(publicKeyPem);
        const encoded = new TextEncoder().encode(data);
        const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
        return crypto.subtle.verify(
            { name: "ECDSA", hash: "SHA-256" },
            key,
            signature,
            encoded
        );
    }

    // createPrivateKey: PEM 문자열로부터 개인키 import
    async createPrivateKey(pem: string): Promise<CryptoKey> {
        const keyData = this.pemToArrayBuffer(pem);
        return crypto.subtle.importKey(
            "pkcs8",
            keyData,
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["sign"]
        );
    }

    // createPublicKey: PEM 문자열로부터 공개키 import
    async createPublicKey(pem: string): Promise<CryptoKey> {
        const keyData = this.pemToArrayBuffer(pem);
        return crypto.subtle.importKey(
            "spki",
            keyData,
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["verify"]
        );
    }

    // generateKeyPair: 브라우저에서 사용할 수 있는 PEM 포맷 키 쌍 생성
    async generateKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
        const { publicKey, privateKey } = await crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256",
            },
            true,
            ["sign", "verify"]
        );

        const exportedPriv = await crypto.subtle.exportKey("pkcs8", privateKey);
        const exportedPub = await crypto.subtle.exportKey("spki", publicKey);

        return {
            privateKey: this.arrayBufferToPem(exportedPriv, "PRIVATE KEY"),
            publicKey: this.arrayBufferToPem(exportedPub, "PUBLIC KEY"),
        };
    }

    pemToArrayBuffer(pem: string): ArrayBuffer {
        const base64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
        const binary = atob(base64);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
        return buffer.buffer;
    }

    arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const formatted = base64.match(/.{1,64}/g)?.join("\n") ?? base64;
        return `-----BEGIN ${label}-----\n${formatted}\n-----END ${label}-----`;
    }
}
