import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, UserModel } from "../models/User";
import mongoose from "mongoose";

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createToken = (user: User) => {
  // console.log(user);

  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });
};
