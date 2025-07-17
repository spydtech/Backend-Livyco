import mongoose from "mongoose";
import Property from "../models/Property.js";
import dotenv from "dotenv";

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Remove unique index from clientId if it exists
    try {
      await Property.collection.dropIndex("clientId_1");
      console.log("Dropped clientId unique index");
    } catch (e) {
      if (e.code !== 27) { // 27 = IndexNotFound
        throw e;
      }
      console.log("clientId unique index didn't exist");
    }

    // Create new indexes
    await Property.collection.createIndex({ propertyId: 1 }, { unique: true });
    await Property.collection.createIndex({ registrationId: 1 }, { unique: true });
    console.log("Created new indexes");

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();