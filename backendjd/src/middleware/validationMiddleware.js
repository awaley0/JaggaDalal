// Input validation middleware
export const validateSignup = (req, res, next) => {
  // Check if req.body exists
  if (!req.body) {
    return res.status(400).json({ 
      success: false,
      errors: ["Request body is missing. Make sure Content-Type is application/json"] 
    });
  }

  const { name, email, password } = req.body;
  const errors = [];

  // Validate name
  if (!name || typeof name !== "string") {
    errors.push("Name is required and must be a string");
  } else if (name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  } else if (name.trim().length > 50) {
    errors.push("Name must not exceed 50 characters");
  }

  // Validate email
  if (!email || typeof email !== "string") {
    errors.push("Email is required and must be a string");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push("Please enter a valid email address");
    }
  }

  // Validate password
  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  } else if (password.length > 100) {
    errors.push("Password is too long");
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      errors 
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  // Check if req.body exists
  if (!req.body) {
    return res.status(400).json({ 
      success: false,
      errors: ["Request body is missing. Make sure Content-Type is application/json"] 
    });
  }

  const { email, password } = req.body;
  const errors = [];

  // Validate email
  if (!email || typeof email !== "string") {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push("Please enter a valid email address");
    }
  }

  // Validate password
  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      errors 
    });
  }

  next();
};

export const validateEmail = (req, res, next) => {
  // Check if req.body exists
  if (!req.body) {
    return res.status(400).json({ 
      success: false,
      errors: ["Request body is missing. Make sure Content-Type is application/json"] 
    });
  }

  const { email } = req.body;
  const errors = [];

  if (!email || typeof email !== "string") {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push("Please enter a valid email address");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      errors 
    });
  }

  next();
};
