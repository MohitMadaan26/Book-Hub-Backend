import { ObjectType, Field, ID } from "type-graphql";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import mongoose from "mongoose";

@ObjectType()
@modelOptions({
  schemaOptions: { collection: "users", versionKey: false },
})
export class User {
  @Field(() => ID)
  _id!: mongoose.Types.ObjectId;

  @prop({ required: true, unique: true })
  @Field()
  username!: string;

  @prop({ required: true, unique: true })
  @Field()
  email!: string;

  @prop({ required: true })
  password!: string;

  @prop({ default: "USER" })
  @Field()
  role!: string; // 'USER' or 'ADMIN'
}

export const UserModel = getModelForClass(User);
