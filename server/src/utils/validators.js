const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput({ name, email, password }) {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (name.trim().length > 100) {
    errors.push('Name must be at most 100 characters');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one letter and one number');
    }
  }

  return errors;
}

function validateLoginInput({ email, password }) {
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  return errors;
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  EMAIL_REGEX,
};
