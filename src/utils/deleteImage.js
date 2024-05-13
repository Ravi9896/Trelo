import { v2 as cloudinary } from "cloudinary";
import ApiError from "./ApiError.js";

cloudinary.config({
  cloud_name: "duc6khzlh",
  api_key: "697125964942783", 
  api_secret: "YUoAE2k7t9f1fvkh99jCsyhlF7A",
});


const deleteOnCloudinary = async (publicId) => {
  console.log("12",publicId);
  try {
    if (!publicId) return null;
    // Delete the file on Cloudinary
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    // Throw an ApiError if deletion fails
    throw new ApiError(401, error.message,"Failed to delete the Cloudinary image");
  }
};

export default deleteOnCloudinary;