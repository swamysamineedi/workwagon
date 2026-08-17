const { AppError } = require('./errorHandler');

/**
 * validate
 *
 * Lightweight validation middleware factory using plain JavaScript.
 * No external validation library needed for Phase 2.
 *
 * Usage:
 *   router.post('/route', validate(mySchema), controller)
 *
 * A schema is an object where each key maps to an array of rule functions.
 * Each rule receives the field value and field name, and returns an error
 * string on failure or null on success.
 *
 * Example schema:
 *   const schema = {
 *     email: [rules.required(), rules.isEmail()],
 *     name:  [rules.required(), rules.maxLength(50)],
 *   }
 *
 * Source of validated data can be:
 *   'body'   (default) — req.body
 *   'params' — req.params
 *   'query'  — req.query
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const errors = [];

    for (const [field, fieldRules] of Object.entries(schema)) {
      const value = data?.[field];
      for (const rule of fieldRules) {
        const error = rule(value, field);
        if (error) {
          errors.push(error);
          break; // First error per field is enough
        }
      }
    }

    if (errors.length > 0) {
      return next(new AppError(`Validation failed: ${errors.join('; ')}`, 400));
    }

    next();
  };
};

/**
 * Built-in validation rules.
 * Each rule is a factory that returns a validator function.
 */
const rules = {
  required: () => (value, field) => {
    if (value === undefined || value === null || value === '') {
      return `${field} is required`;
    }
    return null;
  },

  isString: () => (value, field) => {
    if (value !== undefined && typeof value !== 'string') {
      return `${field} must be a string`;
    }
    return null;
  },

  isEmail: () => (value, field) => {
    if (value && !/^\S+@\S+\.\S+$/.test(value)) {
      return `${field} must be a valid email address`;
    }
    return null;
  },

  minLength: (min) => (value, field) => {
    if (value && String(value).length < min) {
      return `${field} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value, field) => {
    if (value && String(value).length > max) {
      return `${field} cannot exceed ${max} characters`;
    }
    return null;
  },

  isNumber: () => (value, field) => {
    if (value !== undefined && typeof value !== 'number') {
      return `${field} must be a number`;
    }
    return null;
  },

  min: (minVal) => (value, field) => {
    if (value !== undefined && Number(value) < minVal) {
      return `${field} must be at least ${minVal}`;
    }
    return null;
  },

  max: (maxVal) => (value, field) => {
    if (value !== undefined && Number(value) > maxVal) {
      return `${field} cannot exceed ${maxVal}`;
    }
    return null;
  },

  isEnum: (values) => (value, field) => {
    if (value !== undefined && !values.includes(value)) {
      return `${field} must be one of: ${values.join(', ')}`;
    }
    return null;
  },

  isMongoId: () => (value, field) => {
    if (value && !/^[a-f\d]{24}$/i.test(String(value))) {
      return `${field} must be a valid ID`;
    }
    return null;
  },
};

module.exports = { validate, rules };
