import mongoose from 'mongoose';

const newsletterHistorySchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sentCount: {
    type: Number,
    required: true,
    default: 0
  },
  failedCount: {
    type: Number,
    required: true,
    default: 0
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

const NewsletterHistory = mongoose.model('NewsletterHistory', newsletterHistorySchema);

export default NewsletterHistory;
