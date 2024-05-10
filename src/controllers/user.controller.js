import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import deleteOnCloudinary from "../utils/deleteImage.js";
import mongoose from "mongoose";
const generateAccessTokenAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    //use await while generating access token and refresh token otherwise it will return an empty {} or can you can try without await
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating access token and refresh token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend(req.something)
  //validate user details
  //check if user is already registered
  //check for images
  //check for avatar
  //upload them to cloudinary
  //create user object - create entry in db
  //remove password and refresh token field
  //check for user creation
  //return response if not return error

  const { username, fullName, email, password } = req.body;
  console.log(email);
  //validate user details
  if (
    [username, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields must be provided");
  }
  if (!email.includes("@")) {
    throw new ApiError(401, "please enter a valid email address");
  }

  //check if user is already registered
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(401, "username or email  already exists");
  }

  //check for images
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //check for avatar
  if (!avatarLocalPath) {
    throw new ApiError(401, "avatar file is required1");
  }
  //upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // console.log(avatar,coverImage);

  //check for avatar
  if (!avatar) throw new ApiError(401, "avatar file is required2");

  //create user objectan d  create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || " ",
    email,
    username: username.toLowerCase(),
    password,
  });

  //remove password and refresh token

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  //return the response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user created successfully"));
});
const loginUser = asyncHandler(async (req, res) => {
  //get email and password form the req.body
  // check  eamil and passowrd is available
  //find the user
  //password check
  //generate access and refresh token
  //send cookies
  //send response

  //get email and password form the req.body
  const { email, password, username } = req.body;

  // check  eamil and passowrd is available
  if (!(username || email)) {
    throw new ApiError(401, "username or email is required");
  }
  //find the user
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  //password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  //generate access and refresh token
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});
const loggedOutUser = asyncHandler(async (req, res) => {
  //clear the refresh token from the user model

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  //clear the cookies

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out sucessfully"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invlaid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message);
  }
});
const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldpassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!(fullName || email)) {
    throw new ApiError(401, "all fields must be provided");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName:fullName,
        email:email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(401, "avatar is not available");
    //TODO: delete the old avatar
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(401, "error while uploading avatar");
  }

  //delete the old  avatar
  const deleteOldimage= await User.findById(req.user.avatar);
  if (!deleteOldimage) {
    throw new ApiError(401, "can't find the old avatar url ")
  }
  try {
    await deleteOnCloudinary(deleteOldimage)
  } catch (error) {
    throw new ApiError(401, "can't delete the old avatar")
  }



  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password")
  
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user,
      "avatar updated successfully"
    )
  )
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(401, "avatar is not available");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(401, "error while uploading avatar");
  }


  const deleteOldimage = await User.findById(req.user.avatar);
  if (!deleteOldimage) {
    throw new ApiError(401, "can't find the old cover url ");
  }
  try {
    await deleteOnCloudinary(deleteOldimage);
  } catch (error) {
    throw new ApiError(401, "can't delete the old cover");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const {username} = req.params

  if(!username?.trim()) throw new ApiError(401, "username is required")
   const channel = await User.aggregate([
     {
       $match: {
         username: username?.toLowerCase(),
       },
     },
     {
       $lookup: {
         from: "subscriptions",
         localField: "_id",
         foreignField: "channel",
         as: "subscribers",
       },
     },
     {
       $lookup: {
         from: "subscriptions",
         localField: "_id",
         foreignField: "subscriber",
         as: "subscribedTo ",
       },
     },
     {
       $addFields: {
         subscribersCount: {
           $size: "$subscribers",
         },
         chanelSubscribersTo: {
           $size: "$subscribedTo",
         },
         isSubscribed: {
           $cond: {
             if: {
               $in: [req.user?._id, "$subscribers.subscriber"],
             },
             then: true,
             else: true,
           },
         },
       },
     },
     {
       $project: {
         fullName: 1,
         username: 1,
         subscribersCount: 1,
         chanelSubscribersTo: 1,
         isSubscribed: 1,
         avatar: 1,
         coverImage: 1,
         email: 1,
       },
     },
   ]);

   if(!channel?.length){
    throw new ApiError(404,"channel does not exist ")
   }
   return res.status(200)
   .json(
    new ApiResponse(200,channel[0],"user channel fetched sucessfully")
   )
});
const getUserWatchHistory = asyncHandler(async(req,res)=>{
const user = await User.aggregate([
  {
    $match: {
      _id: new mongoose.Types.ObjectId(req.user._id),
    },
  },
  {
    $lookup: {
      from: "videos",
      localField: "watchHistory",
      foreignField: "_id",
      as: "watchHistory",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "creator",
            foreignField: "_id",
            as: "creator",
            pipeline: [
              {
                $project: {
                  fullName: 1,
                  username: 1,
                  avatar: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            watchHistory: {
              $first: "$watchHistory",
            },
          },
        },
      ],
    },
  },
]);
return res.status(200).json(
  new ApiResponse(
    200,
    user[0].watchHistory,
    "watchHistory fetched successfully"
  )
)
})
export {
  registerUser,
  loginUser,
  loggedOutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
