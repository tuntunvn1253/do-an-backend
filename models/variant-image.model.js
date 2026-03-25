const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VariantImage = sequelize.define('VariantImage', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    variant_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'variant_images',
    timestamps: false
});

module.exports = VariantImage;
