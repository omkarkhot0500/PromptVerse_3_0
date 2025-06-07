import mongoose from "mongoose";

let isConnected = false; // track the connection
let connectionPromise = null; // track the connection promise

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  // If we're already connected, return immediately
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("MongoDB is already connected");
    return;
  }

  // If there's already a connection attempt in progress, wait for it
  if (connectionPromise) {
    console.log("Waiting for existing connection attempt...");
    return connectionPromise;
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    
    // Create the connection promise
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: "share_prompt_to",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      retryWrites: true, // Retry failed writes
    });

    await connectionPromise;
    isConnected = true;
    console.log("MongoDB connected successfully");
    
  } catch (error) {
    console.error("MongoDB connection error:", error);
    isConnected = false;
    connectionPromise = null;
    throw error;
  } finally {
    connectionPromise = null;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (error) => {
  isConnected = false;
  console.error('Mongoose connection error:', error);
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('Mongoose reconnected to MongoDB');
});

// Force reconnection function (can be called when needed)
export const forceReconnect = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    isConnected = false;
    connectionPromise = null;
    await connectToDB();
  } catch (error) {
    console.error('Force reconnect failed:', error);
    throw error;
  }
};