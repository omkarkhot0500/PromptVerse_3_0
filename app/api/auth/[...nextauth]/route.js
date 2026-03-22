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
    // 1. JWT Callback: Runs once on sign-in, saves the MongoDB ID into the encrypted token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },

    // 2. Session Callback: Fast because it reads from the token (NO DB calls here)
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
      }
      return session;
    },

    // 3. SignIn Callback: Handshake, DB Sync, and User creation
    async signIn({ account, profile, user }) {
      try {
        await connectToDB();

        // Find user by email
        let dbUser = await User.findOne({ email: profile.email });

        if (!dbUser) {
          // If the user is new, generate a username and create them
          const username = await generateUniqueUsername(profile.name);
          dbUser = await User.create({
            email: profile.email,
            username: username,
            image: profile.picture,
          });
        }

        // Pass the MongoDB info to the 'user' object so the 'jwt' callback can see it
        user.id = dbUser._id.toString();
        user.username = dbUser.username;

        return true;

      } catch (error) {
        console.error("Sign-in error:", error);
        return false;
      }
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 3600, // 1 hour
  },

  // SECURE: Use an environment secret to sign your JWTs
  secret: process.env.NEXTAUTH_SECRET,

  // Add debug mode for development
  // debug: process.env.NODE_ENV === 'development',

  // Add error page for better error handling
  // pages: {
  //   error: '/auth/error', // Error code passed in query string as ?error=
  // }
})

export { handler as GET, handler as POST }