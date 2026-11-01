const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');

// SQLite database connection
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false,
    define: {
        timestamps: true,
        underscored: true
    }
});

// Test connection
sequelize.authenticate()
    .then(() => console.log('✅ SQLite Database connected successfully!'))
    .catch(err => console.error('❌ Database connection failed:', err));

// Import models
const LostItem = require('./LostItem')(sequelize, DataTypes);
const FoundItem = require('./FoundItem')(sequelize, DataTypes);
const Claim = require('./Claim')(sequelize, DataTypes);
const Admin = require('./Admin')(sequelize, DataTypes);

// Sync all models with database
sequelize.sync({ force: false })
    .then(async () => {
        console.log('✅ Database tables synced');
        
        // Create default admin if not exists
        const adminCount = await Admin.count();
        if (adminCount === 0) {
            await Admin.create({
                username: 'admin',
                password: bcrypt.hashSync('admin123', 10),
                email: 'admin@invertis.edu.in'
            });
            console.log('✅ Default admin created (admin/admin123)');
        }
        
        // Add sample data if database is empty
        const lostCount = await LostItem.count();
        if (lostCount === 0) {
            await addSampleData(LostItem, FoundItem);
        }
    })
    .catch(err => console.error('❌ Sync error:', err));

// Sample data function
async function addSampleData(LostItem, FoundItem) {
    const sampleLost = [
        {
            item_name: 'Student ID Card - Rahul Sharma',
            category: 'ID Cards',
            description: 'ID card with name Rahul Sharma, enrollment number 2023CS101, CSE department',
            date_lost: '2024-02-15',
            location_lost: 'Library',
            contact_name: 'Rahul Sharma',
            contact_email: 'rahul.sharma@invertis.edu.in',
            contact_phone: '9876543210',
            status: 'lost'
        },
        {
            item_name: 'Samsung Galaxy S21',
            category: 'Mobile Phones',
            description: 'Black Samsung S21 with blue silicone case, screen protector applied',
            date_lost: '2024-02-14',
            location_lost: 'Canteen',
            contact_name: 'Priya Singh',
            contact_email: 'priya.singh@invertis.edu.in',
            contact_phone: '9876543211',
            status: 'lost'
        },
        {
            item_name: 'Brown Leather Wallet',
            category: 'Wallets',
            description: 'Brown leather wallet containing ₹500 cash, SBI ATM card, and Aadhar card',
            date_lost: '2024-02-13',
            location_lost: 'Parking Lot',
            contact_name: 'Amit Kumar',
            contact_email: 'amit.kumar@invertis.edu.in',
            contact_phone: '9876543212',
            status: 'lost'
        },
        {
            item_name: 'HP Laptop Charger',
            category: 'Electronics',
            description: 'HP laptop charger (45W) with round pin, black color',
            date_lost: '2024-02-12',
            location_lost: 'Computer Lab',
            contact_name: 'Neha Gupta',
            contact_email: 'neha.gupta@invertis.edu.in',
            contact_phone: '9876543213',
            status: 'lost'
        }
    ];

    const sampleFound = [
        {
            item_name: 'Black Laptop Bag',
            category: 'Bags',
            description: 'HP laptop bag with notebook, pen, and calculator inside',
            date_found: '2024-02-16',
            location_found: 'Auditorium',
            finder_name: 'Vikram Singh',
            finder_email: 'vikram.singh@invertis.edu.in',
            finder_phone: '9876543214',
            handed_to_security: true,
            status: 'found'
        },
        {
            item_name: '32GB USB Drive',
            category: 'Electronics',
            description: 'Sandisk 32GB USB drive, blue and black color',
            date_found: '2024-02-15',
            location_found: 'Computer Lab',
            finder_name: 'Neha Gupta',
            finder_email: 'neha.gupta@invertis.edu.in',
            finder_phone: '9876543215',
            handed_to_security: false,
            status: 'found'
        },
        {
            item_name: 'Library Card',
            category: 'ID Cards',
            description: 'Library card issued to Anjali Sharma, enrollment number 2022EC045',
            date_found: '2024-02-14',
            location_found: 'Library',
            finder_name: 'Rohit Yadav',
            finder_email: 'rohit.yadav@invertis.edu.in',
            finder_phone: '9876543216',
            handed_to_security: true,
            status: 'found'
        },
        {
            item_name: 'Steel Water Bottle',
            category: 'Others',
            description: 'Milton steel water bottle, blue color, almost new',
            date_found: '2024-02-13',
            location_found: 'Sports Complex',
            finder_name: 'Ankit Sharma',
            finder_email: 'ankit.sharma@invertis.edu.in',
            finder_phone: '9876543217',
            handed_to_security: false,
            status: 'found'
        }
    ];

    try {
        await LostItem.bulkCreate(sampleLost);
        await FoundItem.bulkCreate(sampleFound);
        console.log('✅ Sample data added successfully');
    } catch (error) {
        console.error('❌ Error adding sample data:', error);
    }
}

module.exports = {
    sequelize,
    LostItem,
    FoundItem,
    Claim,
    Admin
};