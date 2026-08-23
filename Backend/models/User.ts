import mongoose from 'mongoose';

// Define the TypeScript Interface
export interface IUser extends mongoose.Document {
  firebaseUid: string;
  name?: string;
  businessCategory?: string;
  region?: string;
  preferredLanguage: string;
  onboardingComplete: boolean;
  createdAt: Date;
}

// Define the Mongoose Schema
const UserProfileSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String },
  businessCategory: { type: String }, 
  region: { type: String },           
  preferredLanguage: { type: String, default: 'English' },
  onboardingComplete: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Export the Model
export default mongoose.model<IUser>('User', UserProfileSchema);