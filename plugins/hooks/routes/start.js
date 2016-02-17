'use strict';

const Boom = require('boom');
const Joi = require('joi');

const controllerFunc = require('../controller');

module.exports = {
  path: '/v1/hooks/start',
  method: 'POST',
  config: {
    description: 'Webhook endpoint for the start event',
    tags: ['api', 'v1', 'start'],
    validate: {
      query: {
        routePrefix: Joi.string().regex(/[a-z-]+/i)
      }
    },
    plugins: {
      'hapi-swaggered': {
        responses: {
          default: {
            description: 'OK',
            schema: Joi.object({ status: 'OK' })
          },
          500: {
            description: 'Internal Server Error',
            schema: Joi.object({
              statusCode: Joi.number(),
              error: Joi.string(),
              message: Joi.string()
            })
          },
          503: {
            description: 'Server Timeout',
            schema: Joi.object({
              statusCode: Joi.number(),
              error: Joi.string(),
              message: Joi.string()
            })
          }
        }
      }
    }
  },
  handler: (req, reply) => {
    const caller = req.payload.project.domain;
    const authClient = req.server.plugins['authentic-client'].client;
    const controller = controllerFunc(authClient, req);
    let principalId = req.payload.project.name;
    let keyId = req.payload.project.id;

    req.log(['info'], `Creating authentic registration for ${caller}`);
    return controller.addApplication(caller, req.query.routePrefix, principalId, keyId)
      .then(() => {
        req.log(['info'], 'Endpoint and endpoint key created');
        return reply({ status: 'OK' });
      })
      .catch(e => {
        console.log(['error'], 'Error while adding endpoint\n$', e.stack);
        return reply(Boom.wrap(e));
      });
  }
};
