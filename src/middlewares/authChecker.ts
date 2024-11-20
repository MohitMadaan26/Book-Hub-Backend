import { AuthChecker } from "type-graphql";
import { Context } from "../types/Context";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserModel } from "../models/User";

export const customAuthChecker: AuthChecker<Context> = async (
  { context },
  roles
) => {
  // Accessing the Authorization header from the request
  const token = context.req.headers.authorization;
  // console.log(token);
  // console.log(roles);

  // If no Authorization header is found, throw an error
  if (!token) {
    throw new Error("Not authenticated");
  }
  try {
    // Verifying the token and using the correct `userId` key
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: mongoose.Types.ObjectId;
    };
    // console.log(payload);

    // Fetch the full user object from the database using the userId
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }
    // console.log(user);

    context.user = user;
    // console.log(context.user);

    // If no roles are required, return true
    if (roles.length === 0) {
      return true;
    }

    // Check if the user has one of the required roles
    if (!roles.includes(context.user.role)) {
      throw new Error("Forbidden");
    }

    return true; // User doesn't have the required role
  } catch (error) {
    throw new Error("unauthorized");
  }
};
