
import dotenv from "dotenv"
import connect_db from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path:"./.env"
})

console.log(process.env.PORT)

connect_db()
// beacuse our {connect_db} function is a async function which always returns a promise so we can use {.then & .catch} after that.
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(
          `Server is running on http://localhost:${process.env.PORT} `
        );
    })
})
.catch((error)=>{
    console.log("MONGO DB Connection FAILED !! :: !!", error);
})

