import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  Int,
  UseMiddleware,
} from "type-graphql";
import { Book, BookModel } from "../models/Book";
import { AuthorModel } from "../models/Author";
import { UserModel } from "../models/User";
import { Context } from "../types/Context";
import mongoose from "mongoose";

// Book CRUD Resolver

@Resolver()
export class BookResolver {
  // Query to get all books with pagination and sorting
  @Query(() => [Book])
  async getBooks(
    @Arg("page", () => Int, { nullable: true, defaultValue: 1 }) page: number,
    @Arg("limit", () => Int, { nullable: true, defaultValue: 10 })
    limit: number,
    @Arg("sortBy", { defaultValue: "publishedDate" }) sortBy: string,
    @Arg("sortOrder", { defaultValue: "desc" }) sortOrder: string,
    @Arg("filterByGenre", () => [String], { nullable: true })
    filterByGenre?: string[],
    @Arg("filterByAuthor", { nullable: true }) filterByAuthor?: string,
    @Arg("filterByDate", () => [String], { nullable: true })
    filterByDate?: string[],
    @Arg("searchByTitle", { nullable: true }) searchByTitle?: string
  ): Promise<Book[]> {
    const query: any = {};

    if (filterByGenre) {
      query.genre = { $in: filterByGenre };
    }

    if (filterByAuthor) {
      const author = await AuthorModel.findOne({
        name: { $regex: filterByAuthor, $options: "i" }, // Case-insensitive search for author name
      });
      if (author) {
        query.author = author._id; // Use the author's _id to filter books
      } else {
        return []; // Return empty array if no author matches the name
      }
    }

    if (filterByDate && filterByDate.length === 2) {
      query.publishedDate = {
        $gte: new Date(filterByDate[0]),
        $lte: new Date(filterByDate[1]),
      };
    } else if (filterByDate?.length === 1) {
      query.publishedDate = {
        $gte: new Date(filterByDate[0]), // Single date as start date
      };
    }

    if (searchByTitle) {
      query.title = { $regex: searchByTitle, $options: "i" }; // Case-insensitive regex
    }

    const books = await BookModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .populate("author");

    return books;
  }

  @Query(() => Book, { nullable: true })
  async getBook(@Arg("id") id: string): Promise<Book | null> {
    const book = await BookModel.findById(id).populate("author");
    return book;
  }

  // Mutation to create a new book
  @Mutation(() => Book)
  @Authorized("ADMIN")
  async createBook(
    @Arg("title") title: string,
    @Arg("authorId") authorId: string,
    @Arg("publishedDate") publishedDate: Date,
    @Arg("genre", () => [String]) genre: string[],
    @Arg("summary") summary: string,
    @Ctx() context: Context
  ): Promise<Book> {
    // Validate that the author exists
    const author = await AuthorModel.findById(authorId);
    if (!author) {
      throw new Error("Author not found");
    }

    // Validate that the user is authorized to add books
    // console.log(context.user?._id);

    const user = await UserModel.findById(context.user?._id);
    if (!user || user.role !== "ADMIN") {
      throw new Error("Only admin can add books");
    }
    // console.log(context.user?.username);

    // Create the new book
    const book = new BookModel({
      title,
      author: authorId,
      publishedDate,
      genre,
      summary,
      addedBy: context.user?.username,
    });

    await book.save();

    // Update the author's `books` array
    await AuthorModel.findByIdAndUpdate(
      authorId,
      { $push: { books: book._id } },
      { new: true } // Return the updated document
    );

    return book;
  }

  // Mutation to update a book
  @Mutation(() => Book)
  @Authorized("ADMIN")
  async updateBook(
    @Arg("id") id: string,
    @Arg("title", { nullable: true }) title?: string,
    @Arg("authorId", { nullable: true }) authorId?: string,
    @Arg("publishedDate", { nullable: true }) publishedDate?: Date,
    @Arg("genre", () => [String], { nullable: true }) genre?: string[],
    @Arg("summary", { nullable: true }) summary?: string
  ): Promise<Book> {
    // Find the book and populate the author field
    const book = await BookModel.findById(id).populate("author");
    if (!book) {
      throw new Error("Book not found");
    }

    // Update fields
    if (title) book.title = title;
    if (publishedDate) book.publishedDate = publishedDate;
    if (genre) book.genre = genre;
    if (summary) book.summary = summary;

    if (authorId) {
      // Ensure the new author exists
      const newAuthor = await AuthorModel.findById(authorId);
      if (!newAuthor) {
        throw new Error("New author not found");
      }

      // Remove the book from the old author's books array
      if (book.author) {
        await AuthorModel.findByIdAndUpdate(book.author, {
          $pull: { books: book._id },
        });
      }

      // Assign the new author to the book
      book.author = new mongoose.Types.ObjectId(authorId);

      // Add the book to the new author's books array
      await AuthorModel.findByIdAndUpdate(
        authorId,
        { $push: { books: book._id } },
        { new: true }
      );
    }

    // Save the updated book
    await book.save();

    return book;
  }

  // Mutation to delete a book
  @Mutation(() => Boolean)
  @Authorized("ADMIN")
  async deleteBook(@Arg("id") id: string): Promise<boolean> {
    // Find the book and check if it exists
    const book = await BookModel.findById(id);
    if (!book) {
      throw new Error("Book not found");
    }

    // Remove the book from the associated author's `books` array
    if (book.author) {
      await AuthorModel.findByIdAndUpdate(book.author, {
        $pull: { books: book._id },
      });
    }

    // Delete the book
    await book.deleteOne();

    return true;
  }
}
