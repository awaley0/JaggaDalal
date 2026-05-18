import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'location'],
      default: 'text',
    },
    attachmentUrl: String,
    attachmentName: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      label: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDelegated: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
chatSchema.index({ sender: 1, receiver: 1 });
chatSchema.index({ receiver: 1, isRead: 1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ deletedFor: 1 });

// Format message response
chatSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return {
    id: obj._id,
    sender: obj.sender,
    receiver: obj.receiver,
    message: obj.message,
    messageType: obj.messageType,
    attachmentUrl: obj.attachmentUrl,
    attachmentName: obj.attachmentName,
    location: obj.location,
    isRead: obj.isRead,
    isEdited: obj.isEdited,
    editedAt: obj.editedAt,
    isDeleted: obj.isDeleted,
    deletedAt: obj.deletedAt,
    deletedFor: obj.deletedFor,
    timestamp: obj.createdAt,
  };
};

export default mongoose.model('Chat', chatSchema);
