import mongoose from 'mongoose';

const AdminSecuritySettingsSchema = new mongoose.Schema({
  requireTwoFactor: {
    type: Boolean,
    default: false,
  },
  sessionTimeout: {
    type: Number,
    default: 30, // minutes
  },
  maxLoginAttempts: {
    type: Number,
    default: 5,
  },
  ipWhitelist: [
    {
      type: String,
      trim: true,
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure we always have a single settings document
AdminSecuritySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.models.AdminSecuritySettings ||
  mongoose.model('AdminSecuritySettings', AdminSecuritySettingsSchema);
