import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Authorized,
  UseMiddleware,
  ID,
} from "type-graphql";
import { Author, AuthorModel } from "../models/Author";
import { Book, BookModel } from "../models/Book";
import mongoose from "mongoose";
// import { Types } from "mongoose";

@Resolver()
export class AuthorResolver {
  // Query to get all authors
  @Query(() => [Author])
  async getAuthors(): Promise<Author[]> {
    const authors = await AuthorModel.find().populate("books");
    return authors;
  }

  // Query to get a single author by ID
  @Query(() => Author)
  async getAuthor(@Arg("id") id: string): Promise<Author | null> {
    const author = await AuthorModel.findById(id).populate("books");
    return author;
  }

  // Mutation to create a new author
  @Mutation(() => Author)
  @Authorized("ADMIN")
  async createAuthor(
    @Arg("name") name: string,
    @Arg("birthdate") birthdate: Date
    // @Arg("books", () => [String], { nullable: true }) books?: string[]
  ): Promise<Author> {
    const author = new AuthorModel({
      name,
      birthdate,
    });

    await author.save();
    return author;
  }

  // Mutation to update an author's details
  @Mutation(() => Author)
  @Authorized("ADMIN")
  async updateAuthor(
    @Arg("id") id: string,
    @Arg("name", { nullable: true }) name?: string,
    @Arg("birthdate", { nullable: true }) birthdate?: Date,
    @Arg("books", () => [ID], { nullable: true }) books?: string[]
  ): Promise<Author> {
    const author = await AuthorModel.findById(id).populate("books");
    if (!author) {
      throw new Error("Author not found");
    }

    if (name) author.name = name;
    if (birthdate) author.birthdate = birthdate;
    // If books array is provided, update the author's books with new IDs
    if (books) {
      // Ensure `author.books` is an array before updating
      author.books = ((author.books as mongoose.Types.ObjectId[]) || []).concat(
        books.map((books) => new mongoose.Types.ObjectId(books))
      );
    }

    return await author.save();
  }

  // Mutation to delete an author
  @Mutation(() => Boolean)
  @Authorized("ADMIN")
  async deleteAuthor(@Arg("id") id: string): Promise<boolean> {
    const author = await AuthorModel.findById(id);
    if (!author) {
      throw new Error("Author not found");
    }

    // Check if this author has books and prevent deletion if so
    const books = await BookModel.find({ author: id });
    if (books.length > 0) {
      throw new Error("Cannot delete author with existing books");
    }

    await author.deleteOne();
    return true;
  }
}
