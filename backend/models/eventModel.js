const mongoose = require('mongoose');

const eventSchema = mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    college: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add an event name'],
    },
    level: {
      type: String,
      enum: ['department', 'institute', 'club', 'intercollege'],
      required: true,
    },
    isInterCollege: {
      type: Boolean,
      default: false,
    },
    clubName: {
      type: String,
    },
    department: {
      type: String,
      default: 'ALL',
    },
    departments: {
      type: [String],
      default: ['ALL'],
    },
    category: {
      type: String, // e.g., 'Technical', 'Cultural', 'Sports'
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    url: String,
    upiId: {
      type: String,
      required: false,
    },
    registrationLimit: {
      type: Number,
      default: 0, // 0 means no limit (for individual events) or team limit (for group events)
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    photo: String,
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    isGroupEvent: {
      type: Boolean,
      default: false,
    },
    minTeamSize: {
      type: Number,
      default: 2,
      min: 1,
    },
    maxTeamSize: {
      type: Number,
      default: 4,
      min: 1,
    },
    registrations: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        mobileNo: String,
        email: String,
        teamName: String,
        teamLeader: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        teamMembers: [
          {
            student: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            name: String,
            college: String,
            rollNo: String,
            class: String,
            branch: String,
            email: String,
            mobileNo: String,
            status: {
              type: String,
              enum: ['pending', 'accepted', 'rejected', 'left'],
              default: 'pending',
            },
            respondedAt: {
              type: Date,
            },
            isUnregistered: {
              type: Boolean,
              default: false,
            },
          }
        ],
        status: {
          type: String,
          enum: ['pending', 'confirmed', 'rejected'],
          default: 'confirmed',
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    winners: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name: String,
        rollNo: String,
        class: String,
        branch: String,
        isTeamWinner: {
          type: Boolean,
          default: false,
        },
        teamName: String,
        teamMembers: [
          {
            name: String,
            rollNo: String,
            class: String,
            branch: String,
          }
        ],
        position: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],
    certificates: {
      participantCertificatesAllocated: {
        type: Boolean,
        default: false,
      },
      winnerCertificatesAllocated: {
        type: Boolean,
        default: false,
      },
      allocatedAt: {
        type: Date,
      },
      eventDateText: {
        type: String,
      },
      issueDateText: {
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
      },
      participantDriveUrl: {
        type: String,
      },
      winnerDriveUrl: {
        type: String,
      },
      theme: {
        type: String,
        default: 'theme-imperial-navy',
      },
      customCertificates: [
        {
          studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          studentRollNo: String,
          studentName: String,
          teamName: String,
          type: {
            type: String,
            enum: ['participant', 'winner'],
            default: 'participant',
          },
          certificateUrl: String,
          position: Number,
        }
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);
