import jwt from 'jsonwebtoken';

export class JWT {
    static async generateJwtToken(payload: any): Promise<string> {
        return jwt.sign(payload, process.env.JWT_KEY || "", { expiresIn: "10d" })
    }

    static async verifyJwtToken(token: string) {
        return jwt.verify(token, process.env.JWT_KEY || "");
    }
}