import User from "../models/User.js";
import Task from "../models/Task.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Private (admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "member" }).select("-password");
    // Add Task Counts for each user
    const userWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const pendingTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "pending",
        });
        const inProgressTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "inProgress",
        });
        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "completed",
        });
        return {
          ...user._doc,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
        };
      })
    );
    res.status(200).json(userWithTaskCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (admin or the same user)
export const getUserById = async (req, res) => {
  try {
    const user = req.params.id;
    const userid = await User.findById(user).select("-password");
    res.status(200).json(userid);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a user
// @route   Delete /api/users/:id
// @access  Private (admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
