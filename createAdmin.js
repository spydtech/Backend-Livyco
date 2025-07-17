import Admin from './models/Admin.js';

const createAdmin = async () => {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    const existing = await Admin.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin already exists');
      return;
    }

    const admin = new Admin({ 
      email: adminEmail, 
      password: adminPassword 
    });
    
    await admin.save();

    console.log('✅ Admin created successfully');
    console.log(`Email: ${adminEmail}\nPassword: ${adminPassword}`);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

export default createAdmin;