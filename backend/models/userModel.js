const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'organizer'],
      default: 'student',
    },
    collegeName: {
      type: String,
      required: function() {
        return this.role !== 'admin';
      },
    },
    // Student specific fields
    studentDetails: {
      class: String,
      rollNo: String,
      branch: String,
      year: String,
      mobileNo: String,
    },
    // Organizer specific fields
    isApproved: {
      type: Boolean,
      default: false,
    },
    organizerDetails: {
      department: String,
      mobileNo: String,
      contactEmail: String,
    },
    resetPasswordOTP: String,
    resetPasswordOTPExpire: Date,
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
