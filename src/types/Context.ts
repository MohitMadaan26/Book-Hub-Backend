import { Request } from "express";
import { User } from "../models/User";

export interface Context {
  req: Request;
  user?: Omit<User, "password">;
}
