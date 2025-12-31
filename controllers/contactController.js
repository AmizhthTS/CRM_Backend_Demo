import { Contact } from "../models/Contacts.js";
import { Company } from "../models/Company.js";
const buildContactQuery = (filters) => {
  const query = {};

  // Search by order text
  if (filters.search) {
    query.$or = [{ name: { $regex: filters.search, $options: "i" } }];
  }

  return query;
};
// create contact controller
export const createContact = async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({
      response: {
        responseStatus: 200,
        responseMessage: "Contact saved successfully",
      },
      contact,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// get contact list
export const contactList = async (req, res) => {
  try {
    const { page, limit, search, companyId } = req.body;

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
    const query = buildContactQuery({ search });
    if (companyId !== "0") {
      query.companyId = companyId;
    }
    const skip = (pageNum - 1) * limitNum;

    const total = await Contact.countDocuments(query);

    const contacts = await Contact.find(query)
      .limit(limitNum)
      .skip(skip)
      .lean();
    for (const contact of contacts) {
      contact.lastContact = contact.lastContact.toISOString().split("T")[0];
      // get company name
      if (contact.companyId) {
        console.log("contact.companyId", contact.companyId);

        let companyData = await Company.findById(contact.companyId).lean();
        if (companyData) {
          console.log("companyData", companyData);

          contact.companyName = companyData.companyName;
        }
      }
    }
    // total company mapped with contact with dublicate check also
    const uniqueCompanyIds = await Contact.distinct("companyId");
    const totalCompanies = uniqueCompanyIds.length;

    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Contact fetched successfully",
      },
      contacts,
      dashboardData: {
        totalContacts: total,
        totalCompanies: totalCompanies,
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
// get contact by id
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (contact.companyId) {
      let companyData = await Company.findById(contact.companyId).lean();
      if (companyData) {
        contact.companyName = companyData.companyName;
      }
    }
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Contact fetched successfully",
      },
      contact,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// delete contact
export const deleteContact = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Contact deleted successfully",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
// update contact
export const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.json({
      response: {
        responseStatus: 200,
        responseMessage: "Contact updated successfully",
      },
      contact,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};
