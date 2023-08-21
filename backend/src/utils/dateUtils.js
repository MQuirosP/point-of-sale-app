const moment = require('moment');

const formatDate = (date) => moment(date).format('YYYY-MM-DD HH:mm:ss');

module.exports = { formatDate };