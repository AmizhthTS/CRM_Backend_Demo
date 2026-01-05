import { Leads } from "../models/Leads.js";
import { Company } from "../models/Company.js";
import { Team } from "../models/Team.js";

const buildLeadsQuery = (filters) => {
  const query = {};

  // Search by order text
  if (filters.search) {
    query.$or = [{ name: { $regex: filters.search, $options: "i" } }];
  }

  return query;
};
// create leads controller
export const createLead = async (req, res) => {
  try {
    const lead = await Leads.create(req.body);
    res.status(201).json({
      response: {
        responseStatus: 200,
        responseMessage: "Lead saved successfully",
      },
      lead,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// get leads list
export const leadsList = async (req, res) => {
  try {
    const { page, limit, search, status } = req.body;

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
    console.log("userid", req.user);
    const query = buildLeadsQuery({ search });
    if (req.user.role !== "admin") {
      query.teamId = req.user.userId;
    }
    if (status !== "all") {
      query.status = status;
    }
    const skip = (pageNum - 1) * limitNum;

    const total = await Leads.countDocuments(query);

    const leads = await Leads.find(query).limit(limitNum).skip(skip).lean();

    for (const lead of leads) {
      lead.createdAt = lead.createdAt.toISOString().split("T")[0];
      // get company name
      if (lead.companyId) {
        let companyData = await Company.findById(lead.companyId).lean();
        if (companyData) {
          lead.companyName = companyData.companyName;
        }
      }
      // Team name
      if (lead.teamId) {
        let teamData = await Team.findById(lead.teamId).lean();
        if (teamData) {
          lead.teamName = teamData.name;
          lead.teamImage = teamData.image;
        }
      }
    }
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Leads fetched successfully",
      },
      leads,
      dashboardData: {
        totalLeads: total,
        newLeads: await Leads.countDocuments({ status: "new" }),
        qualifiedLeads: await Leads.countDocuments({ status: "qualified" }),
        convertedLeads: await Leads.countDocuments({ status: "converted" }),
      },
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
// get leads by id
export const getLeadById = async (req, res) => {
  try {
    const lead = await Leads.findById(req.params.id).lean();
    console.log("lead", lead);

    if (lead.teamId) {
      console.log("lead.teamId", lead.teamId);

      let teamData = await Team.findById(lead.teamId).lean();
      if (teamData) {
        console.log("teamData", teamData);

        lead.teamName = teamData.name;
        lead.teamImage = teamData.image;
      }
    }
    if (lead.companyId) {
      console.log("lead.companyId", lead.companyId);

      let companyData = await Company.findById(lead.companyId).lean();
      if (companyData) {
        console.log("companyData", companyData);

        lead.companyName = companyData.companyName;
      }
    }
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Lead fetched successfully",
      },
      lead,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// delete leads
export const deleteLead = async (req, res) => {
  try {
    await Leads.findByIdAndDelete(req.params.id);
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Lead deleted successfully",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// update leads
export const updateLead = async (req, res) => {
  try {
    const lead = await Leads.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Lead updated successfully",
      },
      lead,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// update status
export const updateLeadStatus = async (req, res) => {
  try {
    const { leadId, status } = req.body;
    console.log("status", req.body);

    const lead = await Leads.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "Lead not found",
        },
      });
    }
    lead.status = status;
    await lead.save();
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Lead status updated successfully",
      },
      lead,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
