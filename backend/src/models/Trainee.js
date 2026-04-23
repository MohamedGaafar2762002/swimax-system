import mongoose from "mongoose";

export const TRAINEE_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const traineeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    age: { type: Number, required: true, min: 0 },

    level: { type: String, required: true, enum: TRAINEE_LEVELS },

    notes: { type: String, default: "", trim: true },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    // 🖼️ Image URL (Cloudinary)
    image: {
      type: String,
      default: "",
    },

    // 🔥 مهم جدًا: public_id عشان نقدر نمسح الصورة
    imagePublicId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Trainee", traineeSchema);