import mongoose from "mongoose";

const coachSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    age: { type: Number, required: true, min: 0 },

    bio: { type: String, default: "", trim: true },

    totalWorkingHours: { type: Number, default: 0, min: 0 },

    // 🖼️ Image URL (Cloudinary)
    image: {
      type: String,
      default: "",
    },

    // 🔥 مهم: public_id عشان نقدر نمسح الصورة
    imagePublicId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Coach", coachSchema);