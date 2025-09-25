import Task from "../models/Task.js";
import User from "../models/User.js";
import ExcelJS from "exceljs"; // ✅ الصح

// @desc    Export filtered tasks as an Excel file
// @route   GET api/reports/export/tasks?status=Completed&user=USER_ID
// @access  Private (Admin)

export const exportTasksReport = async (req, res) => {
  try {
    const { status, user } = req.query;

    // build filter dynamically
    let filter = {};
    if (status) filter.status = status;
    if (user) filter.assignedTo = user;

    const tasks = await Task.find(filter).populate("assignedTo", "name email");

    const workbook = new ExcelJS.Workbook(); // ✅
    const worksheet = workbook.addWorksheet("Tasks Report");

    worksheet.columns = [
      { header: "Task ID", key: "_id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Assigned To", key: "assignedTo", width: 30 },
    ];

    tasks.forEach((task) => {
      const assignedTo = task.assignedTo
        .map((user) => `${user.name} (${user.email})`)
        .join(", ");

      worksheet.addRow({
        _id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate
          ? task.dueDate.toISOString().split("T")[0]
          : "N/A",
        assignedTo: assignedTo || "Unassigned",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tasks_report_${Date.now()}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting tasks:", error);
    res
      .status(500)
      .json({ message: "Error exporting tasks", error: error.message });
  }
};

// @desc    Export all tasks as an Excel file
// @route   GET api/reports/export/tasks
// @access  Private (Admin)

export const exportUsersReport = async (req, res) => {
  try {
    const users = await User.find({}, "name email _id");
    const userTasks = await Task.find().populate(
      "assignedTo",
      "name email _id"
    );

    // map users
    const userTaskMap = {};
    users.forEach((user) => {
      userTaskMap[user._id] = {
        name: user.name,
        email: user.email,
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      };
    });

    // count tasks
    userTasks.forEach((task) => {
      if (task.assignedTo && task.assignedTo.length > 0) {
        task.assignedTo.forEach((assignedUser) => {
          if (userTaskMap[assignedUser._id]) {
            userTaskMap[assignedUser._id].taskCount += 1;

            if (task.status === "Pending") {
              userTaskMap[assignedUser._id].pendingTasks += 1;
            } else if (task.status === "In Progress") {
              userTaskMap[assignedUser._id].inProgressTasks += 1;
            } else if (task.status === "Completed") {
              userTaskMap[assignedUser._id].completedTasks += 1;
            }
          }
        });
      }
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook(); // ✅
    const worksheet = workbook.addWorksheet("User Task Report");

    // Define columns
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Total Tasks", key: "taskCount", width: 15 },
      { header: "Pending", key: "pendingTasks", width: 15 },
      { header: "In Progress", key: "inProgressTasks", width: 15 },
      { header: "Completed", key: "completedTasks", width: 15 },
    ];

    // Add rows
    Object.values(userTaskMap).forEach((data) => {
      worksheet.addRow(data);
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=users_report.xlsx"
    );

    // Send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting users", error: error.message });
  }
};
