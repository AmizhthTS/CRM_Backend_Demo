import { Deals } from "../models/Deals.js";
import { Company } from "../models/Company.js";
import { Team } from "../models/Team.js";
import { Contact } from "../models/Contacts.js";
const buildDealsQuery = (filters) => {
  const query = {};

  // Search by order text
  if (filters.search) {
    query.$or = [{ name: { $regex: filters.search, $options: "i" } }];
  }

  return query;
};
// create deals controller
export const createDeal = async (req, res) => {
  try {
    const { stage } = req.body;

    // Stage to probability and message mapping
    const stageConfig = {
      lead: { probability: 20, message: "Stage created to Lead" },
      qualified: { probability: 40, message: "Stage created to Qualified" },
      proposal: { probability: 60, message: "Stage created to Proposal" },
      negotiation: { probability: 75, message: "Stage created to Negotiation" },
      closed_won: { probability: 100, message: "Stage created to Closed Won" },
      closed_lost: { probability: 0, message: "Stage created to Closed Lost" },
    };

    // Set probability based on stage
    const config = stageConfig[stage];
    if (config) {
      req.body.probability = config.probability;

      // Initialize stageHistory array if it doesn't exist
      if (!req.body.stageHistory) {
        req.body.stageHistory = [];
      }

      // Add initial stage history entry
      req.body.stageHistory.push({
        stage: stage,
        stageDate: new Date(),
        message: config.message,
      });
    }

    const deal = await Deals.create(req.body);
    res.status(201).json({
      response: {
        responseStatus: 200,
        responseMessage: "Deal saved successfully",
      },
      deal,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// get deals list
export const dealsList = async (req, res) => {
  try {
    const { page, limit, search } = req.body;

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
    const query = buildDealsQuery({ search });
    const skip = (pageNum - 1) * limitNum;

    const total = await Deals.countDocuments(query);

    const deals = await Deals.find(query).limit(limitNum).skip(skip).lean();
    for (const deal of deals) {
      deal.createdAt = deal.createdAt.toISOString().split("T")[0];

      // Team name
      if (deal.teamId) {
        let teamData = await Team.findById(deal.teamId).lean();
        if (teamData) {
          deal.teamName = teamData.name;
          deal.teamImage = teamData.image;
        }
      }
      // contact name
      if (deal.contactId) {
        let contactData = await Contact.findById(deal.contactId).lean();
        if (contactData) {
          deal.contactName = contactData.name;
          // get company name
          if (contactData.companyId) {
            let companyData = await Company.findById(
              contactData.companyId
            ).lean();
            if (companyData) {
              deal.companyName = companyData.companyName;
              deal.companyId = companyData._id;
            }
          }
        }
      }
    }
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Deals fetched successfully",
      },
      deals,
      //   dashboardData: {
      //     totalDeals: total,
      //     newDeals: await Deals.countDocuments({ status: "new" }),
      //     qualifiedDeals: await Deals.countDocuments({ status: "qualified" }),
      //     convertedDeals: await Deals.countDocuments({ status: "converted" }),
      //   },
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
// get deals by id
export const getDealById = async (req, res) => {
  try {
    const deal = await Deals.findById(req.params.id);
    if (deal.teamId) {
      let teamData = await Team.findById(deal.teamId).lean();
      if (teamData) {
        deal.teamName = teamData.name;
        deal.teamImage = teamData.image;
      }
    }
    if (deal.assignBy) {
      let userData = await Team.findById(deal.assignBy).lean();
      if (userData) {
        deal.ownerDetails = {
          name: userData.name,
          image: userData.image,
          email: userData.email,
          phone: userData.phoneNumber,
        };
      }
    }
    // contactId
    if (deal.contactId) {
      let contactData = await Contact.findById(deal.contactId).lean();
      if (contactData) {
        deal.contactName = contactData.name;
        // get company name
        if (contactData.companyId) {
          let companyData = await Company.findById(
            contactData.companyId
          ).lean();
          if (companyData) {
            deal.companyName = companyData.companyName;
            deal.companyId = companyData._id;
          }
        }
      }
    }
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Deal fetched successfully",
      },
      deal,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// delete deals
export const deleteDeal = async (req, res) => {
  try {
    await Deals.findByIdAndDelete(req.params.id);
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Deal deleted successfully",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// update deals
export const updateDeal = async (req, res) => {
  try {
    const deal = await Deals.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Deal updated successfully",
      },
      deal,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// update stage
export const updateDealStage = async (req, res) => {
  try {
    const { _id, stage } = req.body;
    let probability;
    let message;
    if (stage === "lead") {
      probability = 20;
      message = "Stage created to Lead";
    } else if (stage === "qualified") {
      probability = 40;
      message = "Stage updated to Qualified";
    } else if (stage === "proposal") {
      probability = 60;
      message = "Stage updated to Proposal";
    } else if (stage === "negotiation") {
      probability = 75;
      message = "Stage updated to Negotiation";
    } else if (stage === "closed_won") {
      probability = 100;
      message = "Stage updated to Closed Won";
    } else if (stage === "closed_lost") {
      probability = 0;
      message = "Stage updated to Closed Lost";
    }
    const deal = await Deals.findById(_id);
    if (!deal) {
      return res.status(404).json({
        response: {
          responseStatus: 404,
          responseMessage: "Deal not found",
        },
      });
    }
    deal.stage = stage;
    deal.probability = probability;
    deal.stageHistory.push({
      stage,
      stageDate: Date.now(),
      message: message,
    });
    await deal.save();
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Deal stage updated successfully",
      },
      deal,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
