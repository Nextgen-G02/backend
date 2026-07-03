import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  status: {
    type: String,
    enum: ['Active', 'Unsubscribed'],
    default: 'Active'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  }
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

export default Newsletter;
