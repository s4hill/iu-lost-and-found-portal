module.exports = (sequelize, DataTypes) => {
    const LostItem = sequelize.define('LostItem', {
        item_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        date_lost: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        location_lost: {
            type: DataTypes.STRING
        },
        image_path: {
            type: DataTypes.STRING
        },
        contact_name: {
            type: DataTypes.STRING
        },
        contact_email: {
            type: DataTypes.STRING
        },
        contact_phone: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.ENUM('lost', 'claimed', 'returned'),
            defaultValue: 'lost'
        }
    });

    return LostItem;
};