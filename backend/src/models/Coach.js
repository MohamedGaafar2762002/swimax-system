import mongoose from "mongoose";

const coachSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    age: { type: Number, required: true, min: 0 },

    bio: { type: String, default: "", trim: true },

    totalWorkingHours: { type: Number, default: 0, min: 0 },

    // 🔥 NEW: coach image (optional)
    image: {
      type: String, // هنخزن اسم الصورة أو URL
      default: "",  // لو مفيش صورة
    },
  },
  { timestamps: true }
);

export default mongoose.model("Coach", coachSchema);