import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_optical_shop_key';

export interface AuthRequest extends Request {
  adminId?: string;
  adminName?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string };
    req.adminId = decoded.id;
    req.adminName = decoded.name;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired authorization token' });
  }
};
