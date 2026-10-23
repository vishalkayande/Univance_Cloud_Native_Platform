const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    studentRollNo: {
      type: String,
      trim: true,
      index: true,
    },
    studentClass: {
      type: String,
      trim: true,
    },
    studentBranch: {
      type: String,
      trim: true,
    },
    studentEmail: {
      type: String,
      trim: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    eventCategory: {
      type: String,
      default: 'Technical',
    },
    eventLevel: {
      type: String,
      default: 'institute',
    },
    eventDate: {
      type: Date,
    },
    eventDateText: {
      type: String,
    },
    issueDateText: {
      type: String,
    },
    certificateType: {
      type: String,
      enum: ['participant', 'winner', 'volunteer'],
      required: true,
      index: true,
    },
    typeLabel: {
      type: String,
      default: 'Certificate of Participation',
    },
    theme: {
      type: String,
      default: 'theme-imperial-navy',
    },
    position: {
      type: Number,
    },
    positionText: {
      type: String,
    },
    isGroupEvent: {
      type: Boolean,
      default: false,
    },
    teamName: {
      type: String,
    },
    collegeName: {
      type: String,
      default: 'Deogiri Institute of Engineering and Management Studies',
    },
    trustName: {
      type: String,
      default: 'Marathwada Shikshan Prasarak Mandal’s',
    },
    autonomousText: {
      type: String,
      default: '(An Autonomous Institute)',
    },
    collegeAddress: {
      type: String,
      default: 'Deogiri Campus, Near Hotel VITS, Railway Station Road, Chhatrapati Sambhajinagar, Maharashtra, India - 431005',
    },
    leftSignatoryTitle: {
      type: String,
      default: 'Director, DIEMS, Chh. Sambhajinagar',
    },
    leftSignatoryName: {
      type: String,
      default: 'Dr. Ulhas Shiurkar',
    },
    leftSignatoryImage: {
      type: String,
      default: '',
    },
    rightSignatoryTitle: {
      type: String,
      default: 'Head of Events Association',
    },
    rightSignatoryName: {
      type: String,
      default: '',
    },
    rightSignatoryImage: {
      type: String,
      default: '',
    },
    customCertificateUrl: {
      type: String,
      default: null,
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
    isEventDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ student: 1, certificateType: 1 });
certificateSchema.index({ studentRollNo: 1, certificateType: 1 });
certificateSchema.index({ studentName: 1, certificateType: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
