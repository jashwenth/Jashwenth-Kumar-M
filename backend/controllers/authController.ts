import type { Response } from 'express';
import { db } from '../db/database.ts';
import { generateToken, type AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import type { UserRole, User } from '../types/fixit.ts';

export const login = (req: AuthenticatedRequest, res: Response) => {
  const { email, password, role } = req.body;

  let user: User | undefined;

  // Support login by email
  if (email) {
    user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }
  } else if (role) {
    // Quick login by role (useful for fast switching between Student, Staff, Maintenance, Admin during demo)
    user = db.getUsers().find((u) => u.role === (role as string).toUpperCase());
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `No default user found for role: ${role}`,
        },
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email or role must be provided for login.',
      },
    });
  }

  const token = generateToken(user);
  const { password: _, ...safeUser } = user;

  return res.status(200).json({
    success: true,
    user: safeUser,
    token,
  });
};

export const register = (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, role, department } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'name',
        message: 'Name must be at least 2 characters.',
      },
    });
  }

  if (!email || !email.includes('@')) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'email',
        message: 'Please provide a valid email address.',
      },
    });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        field: 'email',
        message: 'A user with this email already exists.',
      },
    });
  }

  const validRoles: UserRole[] = ['STUDENT', 'STAFF', 'MAINTENANCE', 'ADMIN'];
  const userRole: UserRole = validRoles.includes(role?.toUpperCase())
    ? (role.toUpperCase() as UserRole)
    : 'STUDENT';

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password || 'password123',
    role: userRole,
    department: department ? department.trim() : 'General Campus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createUser(newUser);
  const token = generateToken(newUser);
  const { password: _, ...safeUser } = newUser;

  return res.status(201).json({
    success: true,
    user: safeUser,
    token,
  });
};

export const getMe = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated.',
      },
    });
  }

  const { password: _, ...safeUser } = req.user;
  return res.status(200).json({
    success: true,
    user: safeUser,
  });
};

export const logout = (_req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getAllUsers = (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().map(({ password: _, ...u }) => u);
  return res.status(200).json({
    success: true,
    users,
  });
};
