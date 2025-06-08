import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import User from '@models/user';
import { connectToDB } from '@utils/database';

// Helper function to generate a unique username
async function generateUniqueUsername(baseName) {
  // Clean the base name and make it lowercase
  let username = baseName.replace(/\s+/g, '').toLowerCase();
  
  // Ensure it meets the minimum length requirement
  if (username.length < 8) {
    username = username.padEnd(8, Math.random().toString(36).substr(2, 8));
  }
  
  // Truncate if too long
  if (username.length > 20) {
    username = username.substring(0, 20);
  }
  
  // Remove any invalid characters (keep only alphanumeric, dots, underscores)
  username = username.replace(/[^a-zA-Z0-9._]/g, '');
  
  // Ensure it doesn't start or end with . or _
  username = username.replace(/^[._]+|[._]+$/g, '');
  
  // If still too short after cleaning, pad it
  if (username.length < 8) {
    username = username + Math.random().toString(36).substr(2, 8 - username.length);
  }
  
  let finalUsername = username;
  let counter = 1;
  
  // Check for uniqueness and append numbers if needed
  while (true) {
    const existingUser = await User.findOne({ username: finalUsername });
    if (!existingUser) {
      break;
    }
    finalUsername = `${username}${counter}`;
    
    // If the username becomes too long, truncate the base and add counter
    if (finalUsername.length > 20) {
      const truncatedBase = username.substring(0, 20 - counter.toString().length);
      finalUsername = `${truncatedBase}${counter}`;
    }
    
    counter++;
  }
  
  return finalUsername;
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async session({ session }) {
      try {
        await connectToDB();
        // store the user id from MongoDB to session
        const sessionUser = await User.findOne({ email: session.user.email });
        
        if (sessionUser) {
          session.user.id = sessionUser._id.toString();
          session.user.username = sessionUser.username;
        }
        
        return session;
      } catch (error) {
        console.log("Error in session callback: ", error.message);
        return session;
      }
    },
    
    async signIn({ account, profile, user, credentials }) {
      try {
        await connectToDB();
        
        console.log("Attempting sign in for:", profile.email);
        
        // check if user already exists
        const userExists = await User.findOne({ email: profile.email });
        
        if (!userExists) {
          console.log("Creating new user for:", profile.email);
          
          // Generate a unique username
          const username = await generateUniqueUsername(profile.name);
          
          console.log("Generated username:", username);
          
          // Create new user
          const newUser = await User.create({
            email: profile.email,
            username: username,
            image: profile.picture,
          });
          
          console.log("Successfully created user:", newUser._id);
        } else {
          console.log("User already exists:", userExists._id);
        }
        
        return true;
        
      } catch (error) {
        console.error("Detailed sign-in error:", {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        
        // Log specific MongoDB errors
        if (error.code === 11000) {
          console.error("Duplicate key error:", error.keyPattern);
        }
        
        return false;
      }
    },
  },
  
  // Add debug mode for development
  // debug: process.env.NODE_ENV === 'development',
  
  // Add error page for better error handling
  // pages: {
  //   error: '/auth/error', // Error code passed in query string as ?error=
  // }
})

export { handler as GET, handler as POST }