const jdoodleAccounts = [
  {
    clientId: process.env.JDOODLE_CLIENT_ID1,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET1,
  },
  {
    clientId: process.env.JDOODLE_CLIENT_ID2,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET2,
  },
  {
    clientId: process.env.JDOODLE_CLIENT_ID3,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET3,
  },
  {
    clientId: process.env.JDOODLE_CLIENT_ID4,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET4,
  },
  {
    clientId: process.env.JDOODLE_CLIENT_ID5,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET5,
  },
  {
    clientId: process.env.JDOODLE_CLIENT_ID6,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET6,
  },
  {
    clientId: process.env.JDOODLE_CLIENT_ID7,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET7,
  },

].filter((account) => account.clientId && account.clientSecret);

let currentAccountIndex = 0;

const getNextJDoodleAccount = () => {
  if (jdoodleAccounts.length === 0) {
    throw new Error("No JDoodle API credentials configured");
  }

  const account = jdoodleAccounts[currentAccountIndex];

  currentAccountIndex = (currentAccountIndex + 1) % jdoodleAccounts.length;

  return account;
};

module.exports = {
  getNextJDoodleAccount,
};
