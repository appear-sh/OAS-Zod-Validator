import { z } from 'zod';
import { ExtensibleObject } from './core';

export const SecurityRequirementObject = z.record(z.array(z.string()));

const apiKeySchema = z.object({
  type: z.literal('apiKey'),
  name: z.string(),
  in: z.enum(['header', 'query', 'cookie']),
  description: z.string().optional(),
}).merge(ExtensibleObject);

const httpSchema = z.object({
  type: z.literal('http'),
  scheme: z.string(),
  bearerFormat: z.string().optional(),
  description: z.string().optional(),
}).merge(ExtensibleObject);

const oauth2Schema = z.object({
  type: z.literal('oauth2'),
  flows: z.object({
    implicit: z.object({
      authorizationUrl: z.string().url(),
      refreshUrl: z.string().url().optional(),
      scopes: z.record(z.string()),
    }).merge(ExtensibleObject).optional(),
    password: z.object({
      tokenUrl: z.string().url(),
      refreshUrl: z.string().url().optional(),
      scopes: z.record(z.string()),
    }).merge(ExtensibleObject).optional(),
    clientCredentials: z.object({
      tokenUrl: z.string().url(),
      refreshUrl: z.string().url().optional(),
      scopes: z.record(z.string()),
    }).merge(ExtensibleObject).optional(),
    authorizationCode: z.object({
      authorizationUrl: z.string().url(),
      tokenUrl: z.string().url(),
      refreshUrl: z.string().url().optional(),
      scopes: z.record(z.string()),
    }).merge(ExtensibleObject).optional(),
  }).merge(ExtensibleObject),
  description: z.string().optional(),
}).merge(ExtensibleObject);

const openIdConnectSchema = z.object({
  type: z.literal('openIdConnect'),
  openIdConnectUrl: z.string().url(),
  description: z.string().optional(),
}).merge(ExtensibleObject);

export const SecuritySchemeObject = z.discriminatedUnion('type', [
  apiKeySchema,
  httpSchema, 
  oauth2Schema,
  openIdConnectSchema
]);