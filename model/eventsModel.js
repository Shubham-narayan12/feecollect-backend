import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventTitle: {
      type: String,
      required: true,
      trim: true,
    },

    eventDate: {
      type: String,
      required: true,
    },

    eventDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt automatic
  }
);

const eventModel = mongoose.model("Event", eventSchema);

export default eventModel;