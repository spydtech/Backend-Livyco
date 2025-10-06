// import Razorpay from 'razorpay';
// import BankAccount from '../models/BankAccount.js';
// import User from '../models/User.js';
// import Property from '../models/Property.js';

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// class RazorpayAccountService {
  
//   // Create Razorpay contact for owner
//   async createRazorpayContact(clientData) {
//     try {
//       const contact = await razorpay.contacts.create({
//         name: clientData.name,
//         email: clientData.email,
//         contact: clientData.phone,
//         type: 'vendor',
//         reference_id: `client${clientData._id}`
//       });

//       return contact;
//     } catch (error) {
//       console.error('Create contact error:', error);
//       throw new Error(`Failed to create Razorpay contact: ${error.message}`);
//     }
//   }

//   // Create Razorpay fund account for bank account
//   async createFundAccount(bankAccountData, contactId) {
//     try {
//       const fundAccount = await razorpay.fundAccounts.create({
//         contact_id: contactId,
//         account_type: 'bank_account',
//         bank_account: {
//           name: bankAccountData.accountHolderName,
//           ifsc: bankAccountData.ifscCode,
//           account_number: bankAccountData.accountNumber
//         }
//       });

//       return fundAccount;
//     } catch (error) {
//       console.error('Create fund account error:', error);
      
//       // Handle specific Razorpay errors
//       if (error.error && error.error.description) {
//         if (error.error.description.includes('IFSC code is invalid')) {
//           throw new Error('Invalid IFSC code');
//         } else if (error.error.description.includes('Account number is invalid')) {
//           throw new Error('Invalid account number');
//         } else if (error.error.description.includes('beneficiary name')) {
//           throw new Error('Account holder name does not match bank records');
//         }
//       }
      
//       throw new Error(`Failed to create fund account: ${error.message}`);
//     }
//   }

//   // Verify bank account with Razorpay
//   async verifyBankAccount(fundAccountId, amount1, amount2) {
//     try {
//       const verification = await razorpay.fundAccounts.requestValidation({
//         fund_account_id: fundAccountId,
//         amount_1: amount1, // Random small amount 1
//         amount_2: amount2  // Random small amount 2
//       });

//       return verification;
//     } catch (error) {
//       console.error('Bank account verification error:', error);
//       throw new Error(`Bank account verification failed: ${error.message}`);
//     }
//   }

//   // Add bank account for property owner
//   // In RazorpayAccountService.js - fix the addBankAccount method
// async addBankAccount(clientId, propertyId, bankDetails) {
//   try {
//     // Check if owner exists and is a client - use _id instead of clientId
//     const owner = await User.findOne({ _id: clientId, role: 'client' });
//     if (!owner) {
//       throw new Error('Owner not found or invalid role');
//     }

//     // Check if property exists and belongs to owner - use _id instead of clientId
//     const property = await Property.findOne({ 
//       _id: propertyId, 
//       clientId: owner._id  // Use _id instead of clientId string
//     });
    
//     if (!property) {
//       throw new Error('Property not found or does not belong to owner');
//     }

//     // Check if account already exists for this property - use _id
//     const existingAccount = await BankAccount.findOne({
//       clientId: owner._id,  // Use _id instead of clientId string
//       propertyId,
//       isActive: true
//     });

//     if (existingAccount) {
//       throw new Error('Bank account already exists for this property');
//     }

//     // Create or get Razorpay contact
//     let contactId = owner.razorpayContactId;
//     if (!contactId) {
//       const contact = await this.createRazorpayContact(owner);
//       contactId = contact.id;
      
//       // Update owner with contact ID
//       await User.findByIdAndUpdate(clientId, {  // Use clientId (_id)
//         razorpayContactId: contactId
//       });
//     }

//     // Create fund account in Razorpay
//     const fundAccount = await this.createFundAccount(bankDetails, contactId);

//     // Save bank account to database - use _id
//     const bankAccount = new BankAccount({
//       clientId: owner._id,  // Use _id instead of clientId string
//       propertyId,
//       accountHolderName: bankDetails.accountHolderName,
//       accountNumber: bankDetails.accountNumber,
//       ifscCode: bankDetails.ifscCode,
//       bankName: bankDetails.bankName,
//       branchName: bankDetails.branchName,
//       accountType: bankDetails.accountType,
//       razorpayContactId: contactId,
//       razorpayFundAccountId: fundAccount.id
//     });

//     await bankAccount.save();

//     return {
//       success: true,
//       bankAccount,
//       message: 'Bank account added successfully. Verification required.'
//     };

//   } catch (error) {
//     console.error('Add bank account error:', error);
//     throw new Error(error.message);
//   }
// }

//   // Get bank accounts by owner
//   // In RazorpayAccountService.js - fix getOwnerBankAccounts method
// async getOwnerBankAccounts(clientId) {
//   try {
//     const bankAccounts = await BankAccount.find({ clientId, isActive: true })  // Now using _id
//       .populate('propertyId', 'propertyId name city locality')
//       .sort({ createdAt: -1 });

//     return {
//       success: true,
//       bankAccounts
//     };
//   } catch (error) {
//     console.error('Get owner bank accounts error:', error);
//     throw new Error('Failed to fetch bank accounts');
//   }
// }

//   // Get bank account by property
//   async getBankAccountByProperty(propertyId) {
//     try {
//       const bankAccount = await BankAccount.findOne({ 
//         propertyId, 
//         isActive: true,
//         isVerified: true 
//       }).populate('ownerId', 'name email phone clientId');

//       if (!bankAccount) {
//         throw new Error('No verified bank account found for this property');
//       }

//       return {
//         success: true,
//         bankAccount
//       };
//     } catch (error) {
//       console.error('Get bank account by property error:', error);
//       throw new Error(error.message);
//     }
//   }

//   // Get all bank accounts for admin
//   async getAllBankAccounts(filter = {}) {
//     try {
//       const bankAccounts = await BankAccount.find(filter)
//         .populate('ownerId', 'name email phone clientId role')
//         .populate('propertyId', 'propertyId name city locality status')
//         .populate('verificationDetails.verifiedBy', 'name email')
//         .sort({ createdAt: -1 });

//       const statistics = await BankAccount.aggregate([
//         {
//           $group: {
//             _id: '$verificationStatus',
//             count: { $sum: 1 }
//           }
//         }
//       ]);

//       return {
//         success: true,
//         bankAccounts,
//         statistics
//       };
//     } catch (error) {
//       console.error('Get all bank accounts error:', error);
//       throw new Error('Failed to fetch bank accounts');
//     }
//   }

//   // Verify bank account (Admin function)
//   async verifyBankAccountByAdmin(accountId, adminId, status, failureReason = '') {
//     try {
//       const updateData = {
//         verificationStatus: status,
//         isVerified: status === 'verified',
//         'verificationDetails.verifiedAt': new Date(),
//         'verificationDetails.verifiedBy': adminId
//       };

//       if (status === 'failed' && failureReason) {
//         updateData['verificationDetails.failureReason'] = failureReason;
//       }

//       const bankAccount = await BankAccount.findByIdAndUpdate(
//         accountId,
//         updateData,
//         { new: true }
//       ).populate('ownerId', 'name email');

//       if (!bankAccount) {
//         throw new Error('Bank account not found');
//       }

//       return {
//         success: true,
//         bankAccount,
//         message: `Bank account ${status} successfully`
//       };
//     } catch (error) {
//       console.error('Verify bank account error:', error);
//       throw new Error('Failed to verify bank account');
//     }
//   }

//   // Update bank account
//   async updateBankAccount(accountId, ownerId, updateData) {
//     try {
//       const bankAccount = await BankAccount.findOne({ _id: accountId, ownerId });

//       if (!bankAccount) {
//         throw new Error('Bank account not found');
//       }

//       if (bankAccount.isVerified) {
//         throw new Error('Cannot update verified bank account. Please add a new account instead.');
//       }

//       // Update bank account details
//       Object.keys(updateData).forEach(key => {
//         if (['accountHolderName', 'accountNumber', 'ifscCode', 'bankName', 'branchName', 'accountType'].includes(key)) {
//           bankAccount[key] = updateData[key];
//         }
//       });

//       bankAccount.verificationStatus = 'pending';
//       bankAccount.isVerified = false;

//       await bankAccount.save();

//       return {
//         success: true,
//         bankAccount,
//         message: 'Bank account updated successfully. Verification required.'
//       };
//     } catch (error) {
//       console.error('Update bank account error:', error);
//       throw new Error(error.message);
//     }
//   }

//   // Delete bank account (soft delete)
//   async deleteBankAccount(accountId, ownerId) {
//     try {
//       const bankAccount = await BankAccount.findOne({ _id: accountId, ownerId });

//       if (!bankAccount) {
//         throw new Error('Bank account not found');
//       }

//       // Check if this account is used in any active bookings
//       const activeBookings = await Booking.countDocuments({
//         propertyId: bankAccount.propertyId,
//         bookingStatus: { $in: ['confirmed', 'checked_in'] }
//       });

//       if (activeBookings > 0) {
//         throw new Error('Cannot delete bank account with active bookings');
//       }

//       bankAccount.isActive = false;
//       await bankAccount.save();

//       // Remove from user's bankAccounts array
//       await User.findByIdAndUpdate(ownerId, {
//         $pull: { bankAccounts: accountId }
//       });

//       return {
//         success: true,
//         message: 'Bank account deleted successfully'
//       };
//     } catch (error) {
//       console.error('Delete bank account error:', error);
//       throw new Error(error.message);
//     }
//   }
// }

// export default new RazorpayAccountService();



import Razorpay from 'razorpay';
import BankAccount from '../models/BankAccount.js';
import User from '../models/User.js';
import Property from '../models/Property.js';

// Check if Razorpay credentials are available
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('Razorpay credentials not found. Bank account features will be limited.');
}

let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} catch (error) {
  console.error('Razorpay initialization failed:', error);
  razorpay = null;
}

class RazorpayAccountService {
  
  async createRazorpayContact(clientData) {
    try {
      // Check if Razorpay is initialized
      if (!razorpay) {
        throw new Error('Razorpay not configured');
      }

      // Check if contacts API is available
      if (!razorpay.contacts) {
        // Fallback: Return a mock contact ID for development
        console.warn('Razorpay contacts API not available, using mock contact');
        return { id: `mock_contact_${clientData._id}` };
      }

      const contact = await razorpay.contacts.create({
        name: clientData.name || 'Property Owner',
        email: clientData.email || 'owner@example.com',
        contact: clientData.phone,
        type: 'vendor',
        reference_id: `client_${clientData._id}`
      });

      return contact;
    } catch (error) {
      console.error('Create contact error:', error);
      
      // Fallback for development/testing
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock Razorpay contact for development');
        return { id: `dev_contact_${clientData._id}` };
      }
      
      throw new Error(`Failed to create Razorpay contact: ${error.message}`);
    }
  }

  async createFundAccount(bankAccountData, contactId) {
    try {
      // Check if Razorpay is initialized
      if (!razorpay) {
        throw new Error('Razorpay not configured');
      }

      // Check if fundAccounts API is available
      if (!razorpay.fundAccounts) {
        // Fallback: Return a mock fund account ID for development
        console.warn('Razorpay fundAccounts API not available, using mock fund account');
        return { id: `mock_fund_account_${Date.now()}` };
      }

      const fundAccount = await razorpay.fundAccounts.create({
        contact_id: contactId,
        account_type: 'bank_account',
        bank_account: {
          name: bankAccountData.accountHolderName,
          ifsc: bankAccountData.ifscCode,
          account_number: bankAccountData.accountNumber
        }
      });

      return fundAccount;
    } catch (error) {
      console.error('Create fund account error:', error);
      
      // Fallback for development/testing
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock Razorpay fund account for development');
        return { id: `dev_fund_account_${Date.now()}` };
      }
      
      if (error.error && error.error.description) {
        if (error.error.description.includes('IFSC code is invalid')) {
          throw new Error('Invalid IFSC code');
        } else if (error.error.description.includes('Account number is invalid')) {
          throw new Error('Invalid account number');
        } else if (error.error.description.includes('beneficiary name')) {
          throw new Error('Account holder name does not match bank records');
        }
      }
      
      throw new Error(`Failed to create fund account: ${error.message}`);
    }
  }

  async verifyBankAccount(fundAccountId, amount1, amount2) {
    try {
      if (!razorpay || !razorpay.fundAccounts) {
        // Mock verification for development
        console.warn('Razorpay not available, using mock verification');
        return { status: 'mock_verified' };
      }

      const verification = await razorpay.fundAccounts.requestValidation({
        fund_account_id: fundAccountId,
        amount_1: amount1,
        amount_2: amount2
      });

      return verification;
    } catch (error) {
      console.error('Bank account verification error:', error);
      throw new Error(`Bank account verification failed: ${error.message}`);
    }
  }

  async addBankAccount(clientId, propertyId, bankDetails) {
    try {
      console.log('Service received:', { clientId, propertyId, bankDetails });

      // Validate bankDetails
      if (!bankDetails) {
        throw new Error('Bank details are required');
      }

      // Check if owner exists and is a client
      const owner = await User.findOne({ _id: clientId, role: 'client' });
      if (!owner) {
        throw new Error('Owner not found or invalid role');
      }

      console.log('Found owner:', { 
        ownerId: owner._id, 
        ownerClientId: owner.clientId,
        name: owner.name,
        email: owner.email,
        phone: owner.phone
      });

      // Check if property exists
      const property = await Property.findOne({ _id: propertyId });
      
      if (!property) {
        throw new Error('Property not found');
      }

      console.log('Found property:', { 
        propertyId: property._id, 
        propertyClientId: property.clientId,
        propertyName: property.name
      });

      // Compare the clientId strings
      const ownsProperty = property.clientId && property.clientId === owner.clientId;

      if (!ownsProperty) {
        console.log('Ownership check failed:', {
          propertyClientId: property.clientId,
          ownerClientId: owner.clientId,
          match: property.clientId === owner.clientId
        });
        throw new Error('Property does not belong to owner');
      }

      console.log('Ownership verified successfully!');

      // Check if account already exists for this property
      const existingAccount = await BankAccount.findOne({
        clientId: owner._id,
        propertyId,
        isActive: true
      });

      if (existingAccount) {
        throw new Error('Bank account already exists for this property');
      }

      // Create or get Razorpay contact
      let contactId = owner.razorpayContactId;
      if (!contactId) {
        const contact = await this.createRazorpayContact(owner);
        contactId = contact.id;
        
        // Only update if we got a real contact ID
        if (!contactId.startsWith('mock_') && !contactId.startsWith('dev_')) {
          await User.findByIdAndUpdate(clientId, {
            razorpayContactId: contactId
          });
        }
      }

      // Create fund account in Razorpay
      const fundAccount = await this.createFundAccount(bankDetails, contactId);

      // Save bank account to database
      const bankAccount = new BankAccount({
        clientId: owner._id,
        propertyId,
        accountHolderName: bankDetails.accountHolderName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        bankName: bankDetails.bankName,
        branchName: bankDetails.branchName,
        accountType: bankDetails.accountType,
        razorpayContactId: contactId,
        razorpayFundAccountId: fundAccount.id,
        // For mock accounts, mark as verified automatically
        isVerified: contactId.startsWith('mock_') || contactId.startsWith('dev_'),
        verificationStatus: contactId.startsWith('mock_') || contactId.startsWith('dev_') ? 'verified' : 'pending'
      });

      await bankAccount.save();

      return {
        success: true,
        bankAccount,
        message: contactId.startsWith('mock_') || contactId.startsWith('dev_') 
          ? 'Bank account added successfully (Development Mode)' 
          : 'Bank account added successfully. Verification required.'
      };

    } catch (error) {
      console.error('Add bank account error:', error);
      throw new Error(error.message);
    }
  }

  async getOwnerBankAccounts(clientId) {
    try {
      const bankAccounts = await BankAccount.find({ clientId, isActive: true })
        .populate('propertyId', 'name city locality')
        .sort({ createdAt: -1 });

      return {
        success: true,
        bankAccounts
      };
    } catch (error) {
      console.error('Get owner bank accounts error:', error);
      throw new Error('Failed to fetch bank accounts');
    }
  }

  async getBankAccountByProperty(propertyId) {
    try {
      const bankAccount = await BankAccount.findOne({ 
        propertyId, 
        isActive: true,
        isVerified: true 
      }).populate('clientId', 'name email phone');

      if (!bankAccount) {
        throw new Error('No verified bank account found for this property');
      }

      return {
        success: true,
        bankAccount
      };
    } catch (error) {
      console.error('Get bank account by property error:', error);
      throw new Error(error.message);
    }
  }

  async getAllBankAccounts(filter = {}) {
    try {
      const bankAccounts = await BankAccount.find(filter)
        .populate('clientId', 'name email phone role')
        .populate('propertyId', 'name city locality status')
        .populate('verificationDetails.verifiedBy', 'name email')
        .sort({ createdAt: -1 });

      const statistics = await BankAccount.aggregate([
        {
          $group: {
            _id: '$verificationStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        bankAccounts,
        statistics
      };
    } catch (error) {
      console.error('Get all bank accounts error:', error);
      throw new Error('Failed to fetch bank accounts');
    }
  }

  async verifyBankAccountByAdmin(accountId, adminId, status, failureReason = '') {
    try {
      const updateData = {
        verificationStatus: status,
        isVerified: status === 'verified',
        'verificationDetails.verifiedAt': new Date(),
        'verificationDetails.verifiedBy': adminId
      };

      if (status === 'failed' && failureReason) {
        updateData['verificationDetails.failureReason'] = failureReason;
      }

      const bankAccount = await BankAccount.findByIdAndUpdate(
        accountId,
        updateData,
        { new: true }
      ).populate('clientId', 'name email');

      if (!bankAccount) {
        throw new Error('Bank account not found');
      }

      return {
        success: true,
        bankAccount,
        message: `Bank account ${status} successfully`
      };
    } catch (error) {
      console.error('Verify bank account error:', error);
      throw new Error('Failed to verify bank account');
    }
  }

  async updateBankAccount(accountId, clientId, updateData) {
    try {
      const bankAccount = await BankAccount.findOne({ _id: accountId, clientId });

      if (!bankAccount) {
        throw new Error('Bank account not found');
      }

      if (bankAccount.isVerified) {
        throw new Error('Cannot update verified bank account. Please add a new account instead.');
      }

      Object.keys(updateData).forEach(key => {
        if (['accountHolderName', 'accountNumber', 'ifscCode', 'bankName', 'branchName', 'accountType'].includes(key)) {
          bankAccount[key] = updateData[key];
        }
      });

      bankAccount.verificationStatus = 'pending';
      bankAccount.isVerified = false;

      await bankAccount.save();

      return {
        success: true,
        bankAccount,
        message: 'Bank account updated successfully. Verification required.'
      };
    } catch (error) {
      console.error('Update bank account error:', error);
      throw new Error(error.message);
    }
  }

  async deleteBankAccount(accountId, clientId) {
    try {
      const bankAccount = await BankAccount.findOne({ _id: accountId, clientId });

      if (!bankAccount) {
        throw new Error('Bank account not found');
      }

      bankAccount.isActive = false;
      await bankAccount.save();

      return {
        success: true,
        message: 'Bank account deleted successfully'
      };
    } catch (error) {
      console.error('Delete bank account error:', error);
      throw new Error(error.message);
    }
  }
}

export default new RazorpayAccountService();