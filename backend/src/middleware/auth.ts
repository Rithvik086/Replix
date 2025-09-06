import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        userId?: string;
    };
}

export const generateToken = (userId: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }

    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }

    return jwt.verify(token, secret);
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.token;

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
            return;
        }

        const decoded = verifyToken(token);
        req.user = { id: decoded.userId };
        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};
