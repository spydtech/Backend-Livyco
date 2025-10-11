

// // app.js
// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import authRoutes from "./routes/authRoutes.js";
// import adminRoutes from './routes/adminRoutes.js';
// import { existsSync } from 'fs';
// import Admin from "./models/Admin.js";


// const path = './livyco-b65f5-firebase-adminsdk-fbsvc-bdf4b116db.json';
// console.log('File exists:', existsSync(path));

// dotenv.config();

// const app = express();

// // Enhanced CORS middleware
// app.use(cors({
//   origin: true, // or specific origin like "http://localhost:3000"
//   credentials: true,
//   allowedHeaders: ["Content-Type", "Authorization"],
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   exposedHeaders: ["Authorization"]
// }));

// app.use(express.json());

// app.use("/api/auth", authRoutes);
// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "OK" });
// });
// // Admin routes
// app.use("/api/admin", adminRoutes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     success: false,
//     message: "Internal server error",
//     error: err.message
//   });
// });



// // Initialize default admin
// const initializeAdmin = async () => {
//   try {
//     const adminEmail = "prabhashyams@gmail.com";
//     const existingAdmin = await Admin.findOne({ email: adminEmail });

//     if (!existingAdmin) {
//       await Admin.create({
//         email: adminEmail,
//         password: "Shyam@1234", // plain password
//         name: "Admin",
//         role: "admin"
//       });
//       console.log("✅ Superadmin created successfully");
//     } else {
//       console.log("✅ Superadmin already exists");
//     }
//   } catch (error) {
//     console.error("❌ Error initializing admin:", error);
//   }
// };
// initializeAdmin();



// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => {
//   console.log("MongoDB connected");
//   app.listen(process.env.PORT || 5000, () => {
//     console.log("Server running on port", process.env.PORT || 5000);
//   });
// })
// .catch((err) => console.error("MongoDB connection error:", err));




// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import authRoutes from "./routes/authRoutes.js";
// import adminRoutes from './routes/adminRoutes.js';
// import { existsSync } from 'fs';
// import Admin from "./models/Admin.js";


// dotenv.config();

// const app = express();
// const path = './livyco-b65f5-firebase-adminsdk-fbsvc-bdf4b116db.json';
// console.log('File exists:', existsSync(path));

// // Middlewares
// app.use(cors({
//   origin: ["https://api.livyco.com", "http://localhost:5173", "https://livyco.com", "http://82.29.161.78:5000"], // Replace with your actual frontend URL
//   credentials: true,
//   allowedHeaders: ["Content-Type", "Authorization"],
//   methods: ["GET", "POST", "PUT",'PATCH', "DELETE", "OPTIONS"],
//   exposedHeaders: ["Authorization"]
// }));

// app.use(express.json()); // For parsing application/json
// app.use(express.urlencoded({ extended: true })); 
// app.use((err, req, res, next) => {
//   if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
//     return res.status(400).json({ 
//       success: false, 
//       message: 'Invalid JSON format' 
//     });
//   }
//   next();
// });

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);

// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "OK" });
// });

// // Superadmin creation logic
// const initializeAdmin = async () => {
//   try {
//     const adminEmail = "prabhashyams@gmail.com";
//     const existingAdmin = await Admin.findOne({ email: adminEmail });

//     if (!existingAdmin) {
//       await Admin.create({
//         email: adminEmail,
//         password: "Shyam@1234",
//         name: "Admin",
//         role: "admin"
//       });
//       console.log("✅ Superadmin created successfully");
//     } else {
//       console.log("✅ Superadmin already exists");
//     }
//   } catch (error) {
//     console.error("❌ Error initializing admin:", error);
//   }
// };

// // MongoDB connection with improved options
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000
//     });
//     console.log("✅ MongoDB connected");
//     await initializeAdmin();
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   }
// };

// // Start server only after DB connection
// connectDB().then(() => {
//   app.listen(process.env.PORT || 5000, () => {
//     console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
//   });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     success: false,
//     message: "Internal server error",
//     error: err.message
//   });
// });






import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import concernRoutes from './routes/concernRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import bankAccountRoutes from './routes/bankAccountsRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
// import vacateRoutes from './routes/vacateRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import { existsSync } from 'fs';
import Admin from "./models/Admin.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const path = './livyco-b65f5-firebase-adminsdk-fbsvc-bdf4b116db.json';
console.log('File exists:', existsSync(path));

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["https://api.livyco.com", "http://localhost:5173", "https://livyco.com", "http://82.29.161.78:5000"],
    allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'recaptcha-token', // Add this line
    'x-recaptcha-token' // Alternative header name
  ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// Store connected users
const connectedUsers = {};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user authentication
  socket.on('authenticate', (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    // Update user's online status
    User.findByIdAndUpdate(userId, { 
      online: true, 
      socketId: socket.id 
    })
    .catch(err => console.error('Error updating user status:', err));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const userId = Object.keys(connectedUsers).find(
      key => connectedUsers[key] === socket.id
    );
    
    if (userId) {
      delete connectedUsers[userId];
      console.log(`User ${userId} disconnected`);
      
      // Update user's online status
      User.findByIdAndUpdate(userId, { 
        online: false, 
        socketId: null 
      })
      .catch(err => console.error('Error updating user status:', err));
    }
  });
});

// Middlewares
app.use(cors({
  origin: ["https://api.livyco.com", "http://localhost:5173", "https://livyco.com", "http://82.29.161.78:5000"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization",'recaptcha-token', 'x-recaptcha-token'],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposedHeaders: ["Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handler for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid JSON format' 
    });
  }
  next();
});

// Attach io and connectedUsers to app for use in controllers
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", paymentRoutes); // payment routes
app.use("/api/concerns", concernRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/bank-accounts", bankAccountRoutes);
// app.use("/api/vacate", vacateRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Superadmin creation logic
const initializeAdmin = async () => {
  try {
    const adminEmail = "prabhashyams@gmail.com";
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await Admin.create({
        email: adminEmail,
        password: "Shyam@1234",
        name: "Admin",
        role: "admin"
      });
      console.log("✅ Superadmin created successfully");
    } else {
      console.log("✅ Superadmin already exists");
    }
  } catch (error) {
    console.error("❌ Error initializing admin:", error);
  }
};

// MongoDB connection with improved options
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log("✅ MongoDB connected");
    await initializeAdmin();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

// Start server only after DB connection
connectDB().then(() => {
  server.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

export { app, server };