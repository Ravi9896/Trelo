import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) => {
  //get user details from frontend
 //validate user details 
 //check if user is already registered
 //check for images
 //check for avatar
 //upload them to cloudinary 
 //create user object - create entry in db
 //remove password and refresh token field
 //check for user creation 
 //return response if not return error


 const {username,fullName,email,password}=req.body
 console.log(email)
 //validate user details
 if ([ username, fullName, email, password ] .some((field)=> field?.trim()==="")) {
   throw new ApiError(
    400,"all fields must be provided"
   );

  }
if(!email.includes('@')){
  throw new ApiError(401, "please enter a valid email address")
}

//check if user is already registered
const existedUser = User.findOne({
  $or:[{email},{username}]
})
if (existedUser){
  throw new ApiError(401,"username or email  already exists")
}

//check for images
const avatarLocalPath = req.files?.avatar[0]?.path
const coverImageLocalPath = req.files?.coverImage[0]?.path


//check for avatar
if(!avatarLocalPath){
  throw new ApiError(401,"avatar file is required")
}
//upload them to cloudinary
const avatar =await uploadOnCloudinary(avatarLocalPath)
const  coverImage =await uploadOnCloudinary(coverImageLocalPath)


//check for avatar
if(!avatar) throw new ApiError(401,"avatar file is required")   


//create user object and  create entry in db 
const user = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage?.url || " ",
  email,
  username:username.toLowerCase(),
  password,
})

//remove password and refresh token

const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
)

if(!createdUser){
  throw new ApiError(500,"something went wrong while registering the user")
}

//return the response 
return res.status(201) .json(
  new ApiResponse(200,createdUser,"user created successfully")
  
)

});


export {
    registerUser,
}