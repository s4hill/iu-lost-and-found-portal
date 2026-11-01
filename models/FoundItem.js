module.exports = (sequelize, DataTypes) => {
    const FoundItem = sequelize.define('FoundItem', {
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
        date_found: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        location_found: {
            type: DataTypes.STRING
        },
        image_path: {
            type: DataTypes.STRING
        },
        finder_name: {
            type: DataTypes.STRING
        },
        finder_email: {
            type: DataTypes.STRING
        },
        finder_phone: {
            type: DataTypes.STRING
        },
        handed_to_security: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        status: {
            type: DataTypes.ENUM('found', 'claimed', 'returned'),
            defaultValue: 'found'
        }
    });

    return FoundItem;
};