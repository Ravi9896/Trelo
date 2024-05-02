import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res) => {
  //get user details from frontend
  res.status(200)
  .json({
    message:"ok"
  })
  
});


export {
    registerUser,
}