const Joi = require('joi');

const identitySchema = Joi.object().keys({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  middleName: Joi.string().trim(),
  systemId: Joi.string().required(),
  systemName: Joi.string().required(),
  address: Joi.object(),
  phoneNumber: Joi.string().trim().required(),
  email: Joi.string().trim().email({
    minDomainSegments: 2
  }).required(),
  type: Joi.string().trim().valid('technician', 'vendor', 'insuranceAgent').required(),
  specialities: Joi.array().items(Joi.string()),
  bio: Joi.string()
});

const agentObjectSchema = Joi.object().keys({
  systemId: Joi.string().required(),
  agentName: Joi.string().required(),
  targetSystem: Joi.object().keys({
    systemName: Joi.string().required(),
    queryURL: Joi.string().required(),
  }),
})

const updateObjectSchema = Joi.object().keys({
  firstName: Joi.string().trim(),
  lastName: Joi.string().trim(),
  phoneNumber: Joi.string().trim(),
  email: Joi.string().trim().email({
    minDomainSegments: 2
  }),
});

const validateIdentityData = (identityData) => identitySchema.validateAsync(identityData);
const validateIdentityDataSync = (identityData) => identitySchema.validate(identityData);
const validateAgentObject = (agentObject) => agentObjectSchema.validateAsync(agentObject);
const validateUpdateObject = (updateObject) => updateObjectSchema.validateAsync(updateObject);

module.exports = {
  validateIdentityData,
  validateAgentObject,
  validateUpdateObject,
  validateIdentityDataSync
}