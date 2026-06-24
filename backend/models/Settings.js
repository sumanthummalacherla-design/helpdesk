const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    helpDeskName: {
      type: String,
      default: "Help Desk Support",
      trim: true,
    },

    companyName: {
      type: String,
      default: "Acme Inc.",
      trim: true,
    },

    timezone: {
      type: String,
      default: "India (UTC+05:30)",
      enum: [
        "India (UTC+05:30)",
        "US Eastern (UTC-05:00)",
        "US Central (UTC-06:00)",
        "US Mountain (UTC-07:00)",
        "US Pacific (UTC-08:00)",
      ],
    },

    dateFormat: {
      type: String,
      default: "DD/MM/YYYY",
      enum: [
        "DD/MM/YYYY",
        "MM/DD/YYYY",
      ],
    },

    timeFormat: {
      type: String,
      default: "12 Hour",
      enum: [
        "12 Hour",
        "24 Hour",
      ],
    },

    language: {
      type: String,
      default: "English",
      enum: ["English"],
    },

    allowCustomerTickets: {
      type: Boolean,
      default: true,
    },

    emailNotifications: {
      type: Boolean,
      default: true,
    },

    autoCloseTickets: {
      type: Boolean,
      default: false,
    },

    autoCloseDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 365,
    },

    satisfactionSurvey: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Settings",
  SettingsSchema
);