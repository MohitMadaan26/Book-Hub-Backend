import {
  Resolver,
  Mutation,
  Arg,
  Ctx,
  Query,
  Authorized,
  UseMiddleware,
} from "type-graphql";
import { User, UserModel } from "../models/User";
import { hashPassword, verifyPassword, createToken } from "../utils/auth";
import { Context } from "../types/Context";

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async getUser(@Arg("userId") id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user;
  }

  // Query to get admin data - accessible only by users with the "ADMIN" role
  @Query(() => String)
  @Authorized("ADMIN") // Only users with the "ADMIN" role can access this
  // @UseMiddleware(isAuth)
  async getAdminData(@Ctx() context: Context): Promise<string> {
    return `Admin data: ${context.user?.username}.`;
  }

  @Mutation(() => User)
  async register(
    @Arg("username") username: string,
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Arg("role", { defaultValue: "USER" }) role: string
  ): Promise<User> {
    // Convert email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Check if user is already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new Error("Email already in use");
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);
    const user = new UserModel({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    await user.save();
    return user;
  }

  @Mutation(() => String)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string
  ): Promise<string> {
    // Convert email to lowercase
    const normalizedEmail = email.toLowerCase();

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new Error("Invalid credentials");
    }

    // Generate a token
    const token = createToken(user);

    return token;
  }
}
