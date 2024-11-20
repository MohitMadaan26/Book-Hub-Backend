import {
  prop,
  getModelForClass,
  Ref,
  modelOptions,
} from "@typegoose/typegoose";
import { Field, ID, ObjectType } from "type-graphql";
import mongoose from "mongoose";
import { Author } from "./Author";

@ObjectType()
@modelOptions({
  schemaOptions: { collection: "books", timestamps: true, versionKey: false },
})
export class Book {
  @Field(() => ID)
  readonly _id!: mongoose.Types.ObjectId;

  @Field()
  @prop({ required: true })
  title!: string;

  @Field(() => Author)
  @prop({ ref: "Author", required: true })
  author!: Ref<Author>;

  @Field()
  @prop({ required: true })
  publishedDate!: Date;

  @Field(() => [String])
  @prop({ type: () => [String], required: true })
  genre!: string[];

  @Field()
  @prop({ required: true })
  summary!: string;

  @Field()
  @prop({ required: true })
  addedBy!: string;
}

export const BookModel = getModelForClass(Book);
