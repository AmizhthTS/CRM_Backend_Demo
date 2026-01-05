import { Leads } from "../models/Leads.js";
import { Deals } from "../models/Deals.js";

// Helper function to calculate percentage change
const calculateChange = (current, previous) => {
  if (previous === 0) {
    return current > 0
      ? { change: "+100%", changeType: "positive" }
      : { change: "0%", changeType: "neutral" };
  }
  const percentChange = ((current - previous) / previous) * 100;
  const roundedChange = Math.round(percentChange);

  if (roundedChange > 0) {
    return { change: `+${roundedChange}%`, changeType: "positive" };
  } else if (roundedChange < 0) {
    return { change: `${roundedChange}%`, changeType: "negative" };
  } else {
    return { change: "0%", changeType: "neutral" };
  }
};

// count controller
export const countController = async (req, res) => {
  try {
    // Get current month date range
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Get previous month date range
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    // ===== CURRENT MONTH DATA =====
    // Total leads count (current month)
    const totalLeads = await Leads.countDocuments({
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
    });

    // Active deals (current month)
    const activeDeals = await Deals.countDocuments({
      stage: { $nin: ["closed_won", "closed_lost"] },
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
    });

    // Total revenue from won deals (current month)
    const revenueResult = await Deals.aggregate([
      {
        $match: {
          stage: "closed_won",
          createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Conversion rate (current month)
    const convertedLeads = await Leads.countDocuments({
      status: "converted",
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
    });
    const conversionRate =
      totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // ===== PREVIOUS MONTH DATA =====
    // Total leads count (previous month)
    const totalLeadsPrev = await Leads.countDocuments({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
    });

    // Active deals (previous month)
    const activeDealsPrev = await Deals.countDocuments({
      stage: { $nin: ["closed_won", "closed_lost"] },
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
    });

    // Total revenue (previous month)
    const revenueResultPrev = await Deals.aggregate([
      {
        $match: {
          stage: "closed_won",
          createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);
    const totalRevenuePrev =
      revenueResultPrev.length > 0 ? revenueResultPrev[0].total : 0;

    // Conversion rate (previous month)
    const convertedLeadsPrev = await Leads.countDocuments({
      status: "converted",
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
    });
    const conversionRatePrev =
      totalLeadsPrev > 0
        ? Math.round((convertedLeadsPrev / totalLeadsPrev) * 100)
        : 0;

    // Calculate changes
    const leadsChange = calculateChange(totalLeads, totalLeadsPrev);
    const dealsChange = calculateChange(activeDeals, activeDealsPrev);
    const revenueChange = calculateChange(totalRevenue, totalRevenuePrev);
    const conversionChange = calculateChange(
      conversionRate,
      conversionRatePrev
    );

    // total won
    const totalWon = await Deals.countDocuments({
      stage: "closed_won",
    });
    // total lost
    const totalLost = await Deals.countDocuments({
      stage: "closed_lost",
    });
    let data = {
      response: {
        responseStatus: 200,
        responseMessage: "Dashboard Fetched Successfully",
      },
      totalLeads: {
        count: totalLeads,
        change: leadsChange.change,
        changeType: leadsChange.changeType,
      },
      activeDeals: {
        count: activeDeals,
        change: dealsChange.change,
        changeType: dealsChange.changeType,
      },
      totalRevenue: {
        count: totalRevenue,
        change: revenueChange.change,
        changeType: revenueChange.changeType,
      },
      conversionRate: {
        count: conversionRate,
        change: conversionChange.change,
        changeType: conversionChange.changeType,
      },
      totalWon: {
        count: totalWon,
      },
      totalLost: {
        count: totalLost,
      },
    };
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      response: {
        responseStatus: 500,
        responseMessage: "Internal Server Error",
      },
    });
  }
};

// Revenue Overview based on month values are month,revenue,deals
export const revenueOverviewController = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const revenueOverview = await Deals.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $year: "$createdAt" }, targetYear],
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$value" },
          deals: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const result = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const data = revenueOverview.find((d) => d._id === monthNum);
      return {
        month: name,
        revenue: data ? data.revenue : 0,
        deals: data ? data.deals : 0,
      };
    });

    let data = {
      response: {
        responseStatus: 200,
        responseMessage: "Revenue Overview Fetched Successfully",
      },
      chartData: result,
    };
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      response: {
        responseStatus: 500,
        responseMessage: "Internal Server Error",
      },
    });
  }
};

// Lead source data for charts
export const leadSourceController = async (req, res) => {
  try {
    // Get all leads grouped by source
    const leadSourceData = await Leads.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          count: 1,
        },
      },
    ]);

    // Calculate total leads for percentage
    const totalLeads = leadSourceData.reduce(
      (sum, item) => sum + item.count,
      0
    );
    let source = ["Website", "Referral", "LinkedIn", "Trade Show", "Cold Call"];
    // Add percentage to each source
    const chartData = source.map((item) => {
      const sourceData = leadSourceData.find((d) => d.source === item);
      const count = sourceData?.count || 0;
      const percentage =
        totalLeads > 0 && count > 0
          ? Math.round((count / totalLeads) * 100)
          : 0;

      return {
        source: item,
        count: count,
        percentage: percentage || 0,
      };
    });

    let data = {
      response: {
        responseStatus: 200,
        responseMessage: "Lead Source Data Fetched Successfully",
      },
      chartData,
    };
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      response: {
        responseStatus: 500,
        responseMessage: "Internal Server Error",
      },
    });
  }
};

// lead source data if the value in graph is greater than 0
export const reportDataController = async (req, res) => {
  try {
    // Get all leads grouped by source
    const leadSourceData = await Leads.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          count: 1,
        },
      },
    ]);
    let data = {
      response: {
        responseStatus: 200,
        responseMessage: "Lead Source Data Fetched Successfully",
      },
      chartData: leadSourceData,
    };
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      response: {
        responseStatus: 500,
        responseMessage: "Internal Server Error",
      },
    });
  }
};
