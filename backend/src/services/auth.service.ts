import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload, Role } from '../types';

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    password: string;
    studentIdNumber?: string;
    phoneNumber?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() }
    });

    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        role: Role.STUDENT,
        studentIdNumber: data.studentIdNumber || null,
        phoneNumber: data.phoneNumber || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentIdNumber: true,
        phoneNumber: true,
        createdAt: true
      }
    });

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      departmentId: null
    });

    return { user, token };
  }

  async login(credentials: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email.toLowerCase().trim() },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('This account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await bcrypt.compare(credentials.password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      departmentId: user.departmentId
    });

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      department: user.department,
      studentIdNumber: user.studentIdNumber,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt
    };

    return { user: sanitizedUser, token };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentIdNumber: true,
        phoneNumber: true,
        avatarUrl: true,
        departmentId: true,
        department: {
          select: { id: true, name: true, code: true }
        },
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  }

  async listStaff(departmentId?: string) {
    const where: any = {
      role: { in: [Role.STAFF, Role.ADMIN] },
      isActive: true
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any
    });
  }
}

export const authService = new AuthService();
