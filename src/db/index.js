import mongoose from "mongoose";
import { DB_name } from "../constant.js";

const connect_db = async () => {

  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_DB_URL}/${DB_name}`
      //   "mongodb+srv://ravi:ravi9896@cluster0.za29fxr.mongodb.net/trelo"
    );
    console.log(connectionInstance.connection.host);
    console.log("connected successfully");
  } catch (error) {
    console.log("ERROR:", error);
    process.exit(1);
  }
};

export default connect_db;
