/**
 * src/services/companyService.js
 *
 * Business logic layer for companies.
 */

'use strict';

const companyRepository = require('../repositories/companyRepository');
const AppError = require('../utils/AppError');

class CompanyService {
  async getAllCompanies() {
    return companyRepository.findAll();
  }

  async getCompanyById(id) {
    const company = await companyRepository.findById(id);
    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }
    return company;
  }

  async createCompany(data) {
    // Check duplicate company name
    const existing = await companyRepository.findByName(data.name);
    if (existing) {
      throw new AppError('A company with this name already exists', 409, 'DUPLICATE_COMPANY_NAME');
    }

    return companyRepository.create(data);
  }

  async updateCompany(id, data) {
    // Check company exists
    await this.getCompanyById(id);

    // Check duplicate name if name changed
    const existing = await companyRepository.findByName(data.name);
    if (existing && existing.id !== Number(id)) {
      throw new AppError('Another company with this name already exists', 409, 'DUPLICATE_COMPANY_NAME');
    }

    return companyRepository.update(id, data);
  }

  async deleteCompany(id) {
    await this.getCompanyById(id);

    try {
      await companyRepository.delete(id);
    } catch (err) {
      // Catch foreign key constraint RESTRICT violation (23503)
      if (err.code === '23503') {
        throw new AppError(
          'Cannot delete company because active placement drives depend on it. Delete the placement drives first.',
          400,
          'COMPANY_HAS_DRIVES'
        );
      }
      throw err;
    }
  }
}

module.exports = new CompanyService();
