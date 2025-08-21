module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "brightbuy",
  DB: "BrightBuy",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
