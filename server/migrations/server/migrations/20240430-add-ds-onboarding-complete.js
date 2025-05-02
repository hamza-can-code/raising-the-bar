'use strict';

module.exports = {
  // RUN:   npx sequelize-cli db:migrate
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'user_progress',                 // ← table name in Postgres
      'ds_onboarding_complete',        // ← new column
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );
  },

  // ROLLBACK: npx sequelize-cli db:migrate:undo
  down: async (queryInterface) => {
    return queryInterface.removeColumn(
      'user_progress',
      'ds_onboarding_complete'
    );
  }
};
