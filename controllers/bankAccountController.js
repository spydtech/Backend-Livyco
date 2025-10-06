import RazorpayAccountService from '../services/razorpayAccountService.js';
import BankAccount from '../models/BankAccount.js';
import User from '../models/User.js';
import Property from '../models/Property.js';

export const addBankAccount = async (req, res) => {
  try {
    const { propertyId, bankDetails } = req.body;
    const clientId = req.user.id;

    const result = await RazorpayAccountService.addBankAccount(
      clientId, 
      propertyId, 
      bankDetails
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Add bank account error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getMyBankAccounts = async (req, res) => {
  try {
    const clientId = req.user.id;

    const result = await RazorpayAccountService.getOwnerBankAccounts(clientId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get my bank accounts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPropertyBankAccount = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const result = await RazorpayAccountService.getBankAccountByProperty(propertyId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get property bank account error:', error);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllBankAccounts = async (req, res) => {
  try {
    const { status, clientId, verificationStatus } = req.query;
    
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (clientId) filter.clientId = clientId;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const result = await RazorpayAccountService.getAllBankAccounts(filter);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get all bank accounts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const verifyBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { status, failureReason } = req.body;
    const adminId = req.user.id;

    const result = await RazorpayAccountService.verifyBankAccountByAdmin(
      accountId, 
      adminId, 
      status, 
      failureReason
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Verify bank account error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const updateData = req.body;
    const clientId = req.user.id;

    const result = await RazorpayAccountService.updateBankAccount(
      accountId, 
      clientId, 
      updateData
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Update bank account error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const clientId = req.user.id;

    const result = await RazorpayAccountService.deleteBankAccount(accountId, clientId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getBankAccountStats = async (req, res) => {
  try {
    const stats = await BankAccount.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalAccounts: { $sum: 1 },
          verifiedAccounts: { 
            $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } 
          },
          pendingVerification: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'pending'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $unwind: '$client'
      },
      {
        $group: {
          _id: '$client.role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Get bank account stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};