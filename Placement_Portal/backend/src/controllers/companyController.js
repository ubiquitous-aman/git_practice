/**
 * src/controllers/companyController.js
 *
 * HTTP Request handlers for companies API.
 */

'use strict';

const companyService = require('../services/companyService');
const asyncHandler = require('../utils/asyncHandler');

class CompanyController {
  getAllCompanies = asyncHandler(async (req, res) => {
    const companies = await companyService.getAllCompanies();
    res.status(200).json({
      success: true,
      count: companies.length,
      data: { companies },
    });
  });

  getCompanyById = asyncHandler(async (req, res) => {
    const company = await companyService.getCompanyById(req.params.id);
    res.status(200).json({
      success: true,
      data: { company },
    });
  });

  createCompany = asyncHandler(async (req, res) => {
    const company = await companyService.createCompany(req.body);
    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: { company },
    });
  });

  updateCompany = asyncHandler(async (req, res) => {
    const company = await companyService.updateCompany(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: { company },
    });
  });

  deleteCompany = asyncHandler(async (req, res) => {
    await companyService.deleteCompany(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    });
  });
}

module.exports = new CompanyController();
