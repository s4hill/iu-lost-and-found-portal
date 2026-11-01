module.exports = (sequelize, DataTypes) => {
    const Claim = sequelize.define('Claim', {
        item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        item_type: {
            type: DataTypes.ENUM('lost', 'found'),
            allowNull: false
        },
        claimant_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        claimant_email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        claimant_phone: {
            type: DataTypes.STRING
        },
        proof_description: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        }
    });

    return Claim;
};