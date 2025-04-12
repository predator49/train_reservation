const sequelize = require('../config/database');
const User = require('./User');
const Seat = require('./Seat');

// Define associations
User.hasMany(Seat, { foreignKey: 'bookedBy' });
Seat.belongsTo(User, { foreignKey: 'bookedBy' });

module.exports = {
  sequelize,
  User,
  Seat
}; 