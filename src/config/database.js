const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
 " postgresql://postgres.qwnqijbwtxcmjrdkarvj:Omyadav04@@aws-0-ap-south-1.pooler.supabase.com:5432/postgres",

  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize; 