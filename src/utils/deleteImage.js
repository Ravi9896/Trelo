import { v2 as cloudinary } from "cloudinary";
import ApiError from "./ApiError.js";

cloudinary.config({
  cloud_name: "duc6khzlh",
  api_key: "697125964942783", 
  api_secret: "YUoAE2k7t9f1fvkh99jCsyhlF7A",
});


const deleteOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //delete the file on cloudinary
    await cloudinary.uploader.destroy(localFilePath, {
      resource_type: "auto",
    });
    
  } catch (error) {
throw new ApiError(401, "faild to  delete the cloudinary image")
  }
};


export default deleteOnCloudinary;
