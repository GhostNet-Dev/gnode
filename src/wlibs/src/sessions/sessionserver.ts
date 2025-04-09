import jwt from "jsonwebtoken";

export default class SessionServer {
    generateToken(userId: string, key: string) {
        return jwt.sign({ userId }, key, { expiresIn: "1h" });
    }

    verifyToken(token: string, key: string): string | null {
        try {
            const payload = jwt.verify(token, key) as any;
            return payload.userId;
        } catch {
            return null;
        }
    }
}
