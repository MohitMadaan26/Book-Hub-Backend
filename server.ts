import "reflect-metadata";
import { ApolloServer } from "apollo-server";
import { buildSchema } from "type-graphql";
import { connectDatabase } from "./src/utils/database";
import { customAuthChecker } from "./src/middlewares/authChecker";
import { UserResolver } from "./src/resolvers/UserResolver";
import { AuthorResolver } from "./src/resolvers/AuthorResolver";
import { BookResolver } from "./src/resolvers/BookResolver";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  // Connect to MongoDB
  await connectDatabase();

  // Build the TypeGraphQL schema
  const schema = await buildSchema({
    resolvers: [UserResolver, AuthorResolver, BookResolver],

    authChecker: customAuthChecker,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ req }),
  });

  const { url } = await server.listen(process.env.PORT || 4000);
  console.log(`Server is running on ${url}`);
}

startServer().catch((error) => {
  console.error("Error starting server:", error);
});
