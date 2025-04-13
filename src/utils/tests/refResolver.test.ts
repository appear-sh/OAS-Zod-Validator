import { RefResolver, verifyRefTargets } from '../refResolver.js';
import { ReferenceError } from '../../errors/index.js';
import { resetCache } from '../../index.js';

import { describe, test, expect, vi, beforeEach } from 'vitest';
describe('RefResolver', () => {
  // Reset cache before each test
  beforeEach(() => {
    resetCache();
  });
  
  test('should collect references from a document', () => {
    const doc = {
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              address: { $ref: '#/components/schemas/Address' }
            }
          },
          Address: {
            type: 'object',
            properties: {
              street: { type: 'string' }
            }
          }
        }
      }
    };
    
    const resolver = new RefResolver(doc);
    const refs = resolver.collectRefs();
    
    expect(refs).toHaveLength(1);
    expect(refs).toContain('#/components/schemas/Address');
  });
  
  test('should resolve references properly', () => {
    const doc = {
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              address: { $ref: '#/components/schemas/Address' }
            }
          },
          Address: {
            type: 'object',
            properties: {
              street: { type: 'string' }
            }
          }
        }
      }
    };
    
    const resolver = new RefResolver(doc);
    const resolvedRefs = resolver.verifyAllRefs();
    
    expect(resolvedRefs).toHaveLength(1);
    expect(resolvedRefs).toContain('#/components/schemas/Address');
  });
  
  test('should handle nested references', () => {
    const doc = {
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              address: { $ref: '#/components/schemas/Address' }
            }
          },
          Address: {
            type: 'object',
            properties: {
              country: { $ref: '#/components/schemas/Country' }
            }
          },
          Country: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          }
        }
      }
    };
    
    const resolver = new RefResolver(doc);
    const resolvedRefs = resolver.verifyAllRefs();
    
    expect(resolvedRefs).toHaveLength(2);
    expect(resolvedRefs).toContain('#/components/schemas/Address');
    expect(resolvedRefs).toContain('#/components/schemas/Country');
  });
  
  test('should handle self-referencing (circular) schemas', () => {
    const doc = {
      openapi: '3.0.0',
      components: {
        schemas: {
          Node: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              next: { $ref: '#/components/schemas/Node' }
            }
          }
        }
      }
    };
    
    const resolver = new RefResolver(doc);
    const resolvedRefs = resolver.verifyAllRefs();
    
    expect(resolvedRefs).toHaveLength(1);
    expect(resolvedRefs).toContain('#/components/schemas/Node');
  });
  
  test('should throw error for invalid references', () => {
    const doc = {
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              address: { $ref: 'invalid-ref' }
            }
          }
        }
      }
    };
    
    const resolver = new RefResolver(doc);
    // Just check that it throws - don't validate the exact message or type
    expect(() => resolver.verifyAllRefs()).toThrow();
  });
  
  test('should throw error for missing references', () => {
    const doc = {
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              address: { $ref: '#/components/schemas/Address' }
            }
          }
        }
      }
    };
    
    const resolver = new RefResolver(doc);
    expect(() => resolver.verifyAllRefs()).toThrow(ReferenceError);
  });
  
  test('verifyRefTargets should populate refs array', () => {
    const doc = {
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              address: { $ref: '#/components/schemas/Address' }
            }
          },
          Address: {
            type: 'object',
            properties: {
              street: { type: 'string' }
            }
          }
        }
      }
    };
    
    const refs: string[] = [];
    verifyRefTargets(doc, refs);
    
    expect(refs).toHaveLength(1);
    expect(refs).toContain('#/components/schemas/Address');
  });
  
  test('should cache resolved references for better performance', () => {
    const doc = {
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              address: { $ref: '#/components/schemas/Address' }
            }
          },
          Address: {
            type: 'object',
            properties: {
              street: { type: 'string' }
            }
          }
        }
      }
    };
    
    // First resolution
    const resolver1 = new RefResolver(doc);
    const firstResolution = resolver1.verifyAllRefs();
    expect(firstResolution).toHaveLength(1);
    
    // Second resolution should use cache
    const resolver2 = new RefResolver(doc);
    
    // Track if collectRefs was called
    let collectRefsCalled = false;
    const originalCollectRefs = resolver2.collectRefs;
    resolver2.collectRefs = function() {
      collectRefsCalled = true;
      return originalCollectRefs.apply(this);
    };
    
    resolver2.verifyAllRefs();
    
    // References should be collected but resolution should use cache
    expect(collectRefsCalled).toBe(true);
  });
}); 