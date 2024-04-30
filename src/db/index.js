import mongoose from "mongoose";
import { DB_name } from "../constant.js";

const connect_db = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_name}`)
        console.log(connectionInstance.connection.host)
        console.log("connected successfully")
    } catch (error) {
        console.log("ERROR:", error);
        process.exit(1);
    }
}
 
export default connect_db