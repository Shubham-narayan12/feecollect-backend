import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const ATLASDB_URL = process.env.MONGO_URL;
const connectDb = async () => {
  try {
    await mongoose.connect(ATLASDB_URL);
    console.log("connected to Db");
  } catch (error) {
    console.log(`mongoDb Error ${error}`);
  }
};

export default connectDb;
