import { Company } from "../models/Company.js";
import { Contact } from "../models/Contacts.js";
const buildCompanyQuery = (filters) => {
  const query = {};

  // Search by order text
  if (filters.search) {
    query.$or = [{ companyName: { $regex: filters.search, $options: "i" } }];
  }

  return query;
};
// create company controller
export const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({
      response: {
        responseStatus: 200,
        responseMessage: "Company saved successfully",
      },
      company,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// get company list
export const companyList = async (req, res) => {
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
    const query = buildCompanyQuery({ search });
    const skip = (pageNum - 1) * limitNum;

    const total = await Company.countDocuments(query);

    const companyList = await Company.find(query)
      .limit(limitNum)
      .skip(skip)
      .lean();
    for (const company of companyList) {
      company.createdAt = company.createdAt.toISOString().split("T")[0];
      // get company count from contact collection
      const contactCount = await Contact.countDocuments({
        companyId: company._id,
      });
      company.contactCount = contactCount;
    }
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Company fetched successfully",
      },
      companyList,
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
// get company by id
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Company fetched successfully",
      },
      company,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// delete company
export const deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Company deleted successfully",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// update company
export const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Company updated successfully",
      },
      company,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
