import mongoose, { Schema } from "mongoose";

const todoSchema = new mongoose.Schema({
  text: { type: String, require: true },
  completed: { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema({
  title: { type: String, require: true },
  description: { type: String },
  priority: { type: String, enum: ["Low", "medium", "High"], default: "Low" },
  status: {
    type: String,
    enum: ["In Progress", "Completed", "Pending"],
    default: "Pending",
  },
  dueDate: { type: Date, require: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  attachments: [{ type: String }],
  todoChecklist: [todoSchema],
  progress: { type: Number, default: 0 },
});

export default mongoose.model("Task", taskSchema);
