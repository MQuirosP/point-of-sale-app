const { Options } = require("../database/models");

const optionService = {
  getOptions: async (id) => {
    try {
      const options = await Options.findOne({ where: { id }});
      return options;
    } catch (error) {
        throw new Error('Error fetching options')
    }
  },
  updateOptions: async (id, data) => {
    console.log(id, data);
    try {
        const options = await Options.findOne({ where: {id}});
        if (options) {
            options.activateRegister = data;
            await options.save();
        } else {
            await Options.create({ activateRegister });
        }
    } catch (error) {
        throw new Error ('Error updating options')
    }
  }
};

module.exports = optionService;
