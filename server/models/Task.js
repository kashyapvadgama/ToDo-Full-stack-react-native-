// server/models/Task.js

const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    deadline: { type: Date }, // Due date ke liye
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    category: { type: String, default: 'General' }, // Category/Tag ke liye
    completed: { type: Boolean, default: false },
}, {
    timestamps: true 
});

module.exports = mongoose.model('Task', TaskSchema);