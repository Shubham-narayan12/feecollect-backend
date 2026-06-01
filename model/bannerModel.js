import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  bannerTitle: String,
  photoUrl: String,
});

const bannerModel = mongoose.model("Banners", bannerSchema);
export default bannerModel;
