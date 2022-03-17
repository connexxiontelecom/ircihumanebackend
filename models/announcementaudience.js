'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AnnouncementAudience extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async createAudience(postId, personId, ){
      AnnouncementAudience.create({
        aa_announcement_id:postId,
        aa_user_id:personId
      });
    }
  };
  AnnouncementAudience.init({
    aa_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    aa_announcement_id: DataTypes.INTEGER,
    aa_user_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'AnnouncementAudience',
    tableName: 'announcement_audiences'
  });
  return AnnouncementAudience;
};
