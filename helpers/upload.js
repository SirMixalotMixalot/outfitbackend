const cloudinary = require("cloudinary").v2;

const uploadToCloudinary = async (imageBuffer) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "image" }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        })
        .end(imageBuffer);
    });
    return result.secure_url; // Return the URL from the promise
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
};
