import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: {
    type: String,
    unique: [true, 'Email already exists!'],
    required: [true, 'Email is required!'],
  },
  username: {
    type: String,
    required: [true, 'Username is required!'],
    unique: [true, 'Username already exists!'], // Add unique constraint
    match: [
      /^(?=.{8,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/, 
      "Username invalid, it should contain 8-20 alphanumeric letters and be unique!"
    ]
  },
  image: {
    type: String,
  },
  // Add timestamps for better tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = models.User || model("User", UserSchema);

export default User;