import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// building connection with database
export async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
}
