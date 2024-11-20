import {
  prop,
  getModelForClass,
  Ref,
  modelOptions,
} from "@typegoose/typegoose";
import { Field, ID, ObjectType } from "type-graphql";
import { Book } from "./Book";
import mongoose from "mongoose";

@ObjectType()
@modelOptions({
  schemaOptions: { collection: "authors", versionKey: false },
})
export class Author {
  @Field(() => ID)
  readonly _id!: mongoose.Types.ObjectId;

  @Field()
  @prop({ required: true })
  name!: string;

  @Field()
  @prop({ required: true })
  birthdate!: Date;

  @Field(() => [Book])
  @prop({ ref: () => Book, required: true })
  books?: Ref<any>[];
}

export const AuthorModel = getModelForClass(Author);
