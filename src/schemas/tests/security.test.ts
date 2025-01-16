import { SecuritySchemeObject, SecurityRequirementObject } from '../security';
import { describe, test, expect } from '@jest/globals';

describe('Security Schema Validation', () => {
  describe('SecurityRequirementObject', () => {
    test('validates empty security requirement', () => {
      expect(() => SecurityRequirementObject.parse({})).not.toThrow();
    });

    test('validates security requirement with no scopes', () => {
      const requirement = { 'api_key': [] };
      expect(() => SecurityRequirementObject.parse(requirement)).not.toThrow();
    });

    test('validates security requirement with scopes', () => {
      const requirement = {
        'oauth2': ['read', 'write'],
        'api_key': []
      };
      expect(() => SecurityRequirementObject.parse(requirement)).not.toThrow();
    });

    test('rejects invalid scope types', () => {
      const requirement = {
        'oauth2': ['read', 123]
      };
      expect(() => SecurityRequirementObject.parse(requirement)).toThrow();
    });
  });

  describe('SecuritySchemeObject', () => {
    test('validates apiKey security scheme', () => {
      const schemes = [
        {
          type: 'apiKey',
          name: 'api_key',
          in: 'header'
        },
        {
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
          description: 'API Key in query'
        },
        {
          type: 'apiKey',
          name: 'api_key',
          in: 'cookie',
          description: 'API Key in cookie',
          'x-custom': 'value'
        }
      ];

      schemes.forEach(scheme => {
        expect(() => SecuritySchemeObject.parse(scheme)).not.toThrow();
      });
    });

    test('validates http security scheme', () => {
      const schemes = [
        {
          type: 'http',
          scheme: 'basic'
        },
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        {
          type: 'http',
          scheme: 'digest',
          description: 'Digest auth'
        }
      ];

      schemes.forEach(scheme => {
        expect(() => SecuritySchemeObject.parse(scheme)).not.toThrow();
      });
    });

    test('validates oauth2 security scheme', () => {
      const scheme = {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/auth',
            scopes: {
              read: 'Read access',
              write: 'Write access'
            }
          },
          password: {
            tokenUrl: 'https://example.com/token',
            scopes: {
              read: 'Read access'
            }
          },
          clientCredentials: {
            tokenUrl: 'https://example.com/token',
            scopes: {}
          },
          authorizationCode: {
            authorizationUrl: 'https://example.com/auth',
            tokenUrl: 'https://example.com/token',
            refreshUrl: 'https://example.com/refresh',
            scopes: {
              read: 'Read access',
              write: 'Write access'
            }
          }
        }
      };

      expect(() => SecuritySchemeObject.parse(scheme)).not.toThrow();
    });

    test('validates openIdConnect security scheme', () => {
      const scheme = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        description: 'OpenID Connect'
      };

      expect(() => SecuritySchemeObject.parse(scheme)).not.toThrow();
    });

    test('rejects invalid security schemes', () => {
      const invalidSchemes = [
        {
          type: 'apiKey',
          name: 'api_key',
          in: 'invalid'
        },
        {
          type: 'http',
          scheme: ''
        },
        {
          type: 'oauth2',
          flows: {}
        },
        {
          type: 'openIdConnect',
          openIdConnectUrl: 'not-a-url'
        },
        {
          type: 'invalid'
        }
      ];

      invalidSchemes.forEach(scheme => {
        expect(() => SecuritySchemeObject.parse(scheme)).toThrow();
      });
    });
  });
});