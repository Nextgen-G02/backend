import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Configured Cloudinary:");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);

console.log("Testing Cloudinary ping/connection...");
cloudinary.api.ping()
  .then(res => {
    console.log("Ping Success:", res);
    process.exit(0);
  })
  .catch(err => {
    console.error("Ping Error:", err);
    process.exit(1);
  });
