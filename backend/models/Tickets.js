const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  senderId:   { type: String },
  type:       { type: String, enum: ['reply', 'note'], default: 'reply' },
  body:       { type: String, required: true },
  createdAt:  { type: Date, default: Date.now },
});

const schema = new mongoose.Schema({
  id:             { type: Number, required: true, unique: true },
  subject:        { type: String, required: true },
  category:       { type: String, required: true },
  priority:       { type: String, required: true },
  assignee:       { type: String },
  description:    { type: String, required: true },
  attachmentUrl:  { type: String },
  status:         { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  // who filed the ticket
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requesterName:  { type: String },
  requesterId:    { type: String },   // works for both ObjectId (assignee) and Customer id
  requesterRole:  { type: String, enum: ['assignee', 'customer'], default: 'assignee' },
  messages:       [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model('Ticket', schema);