import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins"

//Tente com 127.0.0.1:27017 ou localhost:27017
const client = new MongoClient("mongodb://127.0.0.1:27017/qli-mate");
export const db = client.db();
 
export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword:{
    enabled: true,
    minPasswordLength: 5
  },
  plugins: [
    admin()
  ],
});