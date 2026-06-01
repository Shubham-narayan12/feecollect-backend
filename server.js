// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Imports
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

// DB Connection
import connectDb from "./config/db.js";

// Route Imports
import studentRoutes from "./routes/studentRoutes.js";
import feeCollectRoutes from "./routes/feeCollectRoutes.js";
import feeStructureRoutes from "./routes/feeStructureRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import idCardRoutes from "./routes/idCardRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

// Connect to database
connectDb();

// Create Express app
const app = express();
const port = process.env.PORT || 8000;

//origins changed
const allowedOrigins = [
  "http://localhost:5173",
  "https://demoschool.aadishrisoftech.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // allow cookies
  }),
);

// Middleware
app.use(morgan("dev"));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use("/public", express.static("public"));
// static folder for direct access (optional)
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/feecollect", feeCollectRoutes);
app.use("/api/v1/feestructure", feeStructureRoutes);
app.use("/api/v1/receipt", receiptRoutes);
app.use("/api/v1/idcard", idCardRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/enquiry", enquiryRoutes);
app.use("/api/v1/banner", bannerRoutes);
app.use("/api/v1/gallery", galleryRoutes);
app.use("/api/v1/notice", noticeRoutes);
app.use("/api/v1/event", eventRoutes);

app.get("/", (req, res) => {
  res.send("Hello from Fee Collect server!");
});

// Start server (only if not in Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

// Export for Vercel serverless
export default app;
