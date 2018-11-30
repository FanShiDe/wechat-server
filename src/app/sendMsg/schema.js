import Joi from 'joi';

export const sendMsg = {
  payload: {
    authCode: Joi.string().required(),
    templateData: Joi.object(),
  },
};
