import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { buildContext } from 'graphql-passport'

import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from 'cors'
import passport from "passport";
import session from "express-session";
import ConnectMongoDBSession from "connect-mongodb-session";

import mergedResolvers from "./resolvers/index.js";
import mergedTypeDefs from "./typeDefs/index.js";
import connectDB from "./db/connectDB.js";
import { configurePassport } from "./passport/passport.config.js";

dotenv.config();
configurePassport()

const app = express();

const httpServer = http.createServer(app);

const MongoDBStore = ConnectMongoDBSession(session);

const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: "sessions",
});

store.on("error", () => console.log("❌ MongoDB session store error"));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
        },
        store: store,
    })
)

app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
    typeDefs: mergedTypeDefs,
    resolvers: mergedResolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(
    '/',
    cors({
        origin: 'http://localhost:3000',
        credentials: true
    }),
    express.json(),
    expressMiddleware(server, {
        context: async ({ req, res }) => buildContext({ req, res }),
    }),
)

try {
    await connectDB();
} catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
}

try {
    await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:4000`);
} catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
}
