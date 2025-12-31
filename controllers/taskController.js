import { Task } from "../models/Task.js";
import { Team } from "../models/Team.js";
const buildTaskQuery = (filters) => {
  const query = {};

  // Search by order text
  if (filters.search) {
    query.$or = [{ title: { $regex: filters.search, $options: "i" } }];
  }

  return query;
};
// create task controller
export const createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json({
      response: {
        responseStatus: 200,
        responseMessage: "Task saved successfully",
      },
      task,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// get tasks list
export const tasksList = async (req, res) => {
  try {
    const { page, limit, search, status, assignTo, dueDate } = req.body;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "Invalid page or limit value",
        },
      });
    }
    const query = buildTaskQuery({ search });
    if (status !== "all") {
      query.status = status;
    }
    if (assignTo) {
      query.assignTo = assignTo;
    }
    // Filter for tasks due today only
    if (dueDate) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      query.dueDate = {
        $gte: startOfToday,
        $lte: endOfToday,
      };
    }
    console.log(query);

    const skip = (pageNum - 1) * limitNum;

    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query).limit(limitNum).skip(skip).lean();
    for (const task of tasks) {
      task.createdAt = task.createdAt.toISOString().split("T")[0];
      if (task.assignTo) {
        let teamData = await Team.findById(task.assignTo).lean();
        if (teamData) {
          task.assignToName = teamData.name;
          task.assignToImage = teamData.image;
        }
      }
    }
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Tasks fetched successfully",
      },
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// dashboard data
export const dashboardData = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const inProgressTasks = await Task.countDocuments({
      status: "in_progress",
    });
    const pendingTasks = await Task.countDocuments({ status: "pending" });
    const overdueTasks = await Task.countDocuments({
      // status: "overdue",
      dueDate: { $gte: startOfToday, $lte: endOfToday },
    });
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Dashboard data fetched successfully",
      },
      dashboardData: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// get task by id
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (task.assignTo) {
      let teamData = await Team.findById(task.assignTo).lean();
      if (teamData) {
        task.assignedToName = teamData.name;
        task.assignedToImage = teamData.image;
      }
    }
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Task fetched successfully",
      },
      task,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// delete task
export const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Task deleted successfully",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// update task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Task updated successfully",
      },
      task,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    console.log(id, status);

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "Task not found",
        },
      });
    }
    task.status = status;
    await task.save();
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Task status updated successfully",
      },
      task,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
