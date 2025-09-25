// import express from "express"
// import { array } from "joi";
import Task from "../models/Task.js";

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (admin only usually)
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
    } = req.body;
    if (!Array.isArray(assignedTo)) {
      return res
        .status(400)
        .json({ message: "assignedTo must be an array of user IDs" });
    }
    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      createdBy: req.user._id,
      attachments,
      todoChecklist,
    });
    res
      .status(201)
      .json({ message: "Taske has been created successfully", task });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all tasks (Admin gets all, User gets only assigned tasks)
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) {
      filter.status = status;
    }
    let tasks;

    if (req.user.role === "admin") {
      tasks = await Task.find()
        .populate("assignedTo", "name email profileImageUrl")
        .sort({ createdAt: -1 });
    } else {
      tasks = await Task.find({ ...filter, assignedTo: req.user._id })
        .populate("assignedTo", "name email profileImageUrl")
        .sort({ createdAt: -1 });
    }
    tasks = await Promise.all(
      tasks.map(async (task) => {
        const completedCount = task.todoChecklist.filter(
          (item) => item.completed
        ).length;
        return { ...task._doc, completedTodoCount: completedCount };
      })
    );
    const allTasks = await Task.countDocuments(
      req.user.role === "admin" ? {} : { assignedTo: req.user._id }
    );
    const pendingTasks = await Task.countDocuments({
      ...filter,
      status: "Pending",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    const inProgressTasks = await Task.countDocuments({
      ...filter,
      status: "In Progress",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    const completedTasks = await Task.countDocuments({
      ...filter,
      status: "Completed",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    res.json({
      tasks,
      statussummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    console.error("Error fetching tasks:", error);

    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a task by ID
// @route   PUT /api/tasks/:id
// @access  Private (admin or task owner)
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    // updates
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.attachments = req.body.attachments || task.attachments;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;

    // handle assignedTo safely
    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return res
          .status(400)
          .json({ message: "assignedTo must be an array of user IDs" });
      }
      task.assignedTo = req.body.assignedTo;
    }

    const updatedTask = await task.save();

    res.status(200).json({ message: "Task updated successfully", updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a task by ID
// @route   DELETE /api/tasks/:id
// @access  Private (admin only)
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.deleteOne();
    res.status(200).json({ message: "Task has been deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update only the status of a task (pending → inProgress → completed)
// @route   PUT /api/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    const userId = req.user._id.toString();

    const isAssigned = task.assignedTo.some(
      (assignedUser) => assignedUser.toString() === userId
    );

    if (!isAssigned && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this task" });
    }

    task.status = req.body.status || task.status;

    if (task.status === "Completed") {
      task.todoCheckList.forEach((item) => {
        item.completed = true;
      });
      task.progress = 100;
    }

    await task.save();

    res.status(200).json({
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Update the checklist inside a task (subtasks progress)
// @route   PATCH /api/tasks/:id/todo
// @access  Private
export const updateTaskChecklist = async (req, res) => {
  try {
    const { todoCheckList } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update the checklist" });
    }

    task.todoChecklist = todoCheckList; // update the checklist

    // auto update progress based on the checklist
    const completedCount = task.todoChecklist.filter(
      (item) => item.completed
    ).length;
    const totalItems = task.todoChecklist.length;
    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // Auto mark task as completed if all items are checked
    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }
    await task.save();
    const updateTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );
    res
      .status(200)
      .json({ message: "Task checklist updated", task: updateTask });
  } catch (error) {
    console.error("Error fetching tasks:", error);

    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get admin dashboard data (stats about all tasks, users, reports)
// @route   GET /api/tasks/dashboard-data
// @access  Private (admin only)
export const getDashboardData = async (req, res) => {
  try {
    // statistics
    const allTasks = await Task.countDocuments();
    const PendingTasks = await Task.countDocuments({ status: "Pending" });
    const CompletedTasks = await Task.countDocuments({ status: "Completed" });
    const overdueTasks = await Task.countDocuments({
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });
    //Distribution by statuse
    const tasksStatus = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const taskDistribution = tasksStatus.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = allTasks;
    // Distribution by Priority
    const tasksPriority = ["Pending", "In Progress", "Completed"];
    const taskPriorityLevelRaw = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);
    const taskPriorityLevels = tasksPriority.reduce((acc, Priority) => {
      acc[Priority] =
        taskPriorityLevelRaw.find((item) => item._id === Priority)?.count || 0;
      return acc;
    }, {});
    // fetch recent 10 tasks
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");
    res.status(200).json({
      statistics: {
        allTasks,
        PendingTasks,
        CompletedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);

    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user dashboard data (personal task stats)
// @route   GET /api/tasks/dashboard/me
// @access  Private (user)
export const getUserDashboardData = async (req, res) => {
  try {
    // Statistics
    const allTasks = await Task.countDocuments({ assignedTo: req.user._id });
    const PendingTasks = await Task.countDocuments({ assignedTo: req.user._id, status: "Pending" });
    const CompletedTasks = await Task.countDocuments({ assignedTo: req.user._id, status: "Completed" });
    const overdueTasks = await Task.countDocuments({
      assignedTo: req.user._id,
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    // Distribution by status
    const tasksStatus = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      { $match: { assignedTo: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const taskDistribution = tasksStatus.reduce((acc, status) => {
      acc[status] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = allTasks;

    // Distribution by priority
    const priorities = ["Low", "Medium", "High"];
    const taskPriorityRaw = await Task.aggregate([
      { $match: { assignedTo: req.user._id } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);
    const taskPriorityLevels = priorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    // Recent tasks
    const recentTasks = await Task.find({ assignedTo: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    res.status(200).json({
      statistics: {
        allTasks,
        PendingTasks,
        CompletedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    console.error("Error fetching user dashboard:", error);
    res.status(500).json({ message: "Server error" });
  }
};
