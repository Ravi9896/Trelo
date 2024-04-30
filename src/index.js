
import dotenv from "dotenv"
import connect_db from "./db/index.js";

dotenv.config({
    path:"./env"
})


connect_db()