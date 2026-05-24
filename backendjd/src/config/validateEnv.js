// Validate required environment variables at application startup
export const validateEnvironmentVariables = () => {
  const requiredVars = [
    'PORT',
    'MONGO_URI',
    'JWT_SECRET',
    'FRONTEND_URL',
    'CORS_ORIGIN',
    'EMAIL_USER',
    'EMAIL_APP_PASSWORD',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'CLOUDINARY_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'ESEWA_MERCHANT_CODE',
    'ESEWA_SECRET_KEY',
    'SESSION_SECRET',
  ];

  const missingVars = [];

  requiredVars.forEach((variable) => {
    if (!process.env[variable]) {
      missingVars.push(variable);
    }
  });

  if (missingVars.length > 0) {
    console.error(
      '❌ Missing required environment variables:',
      missingVars.join(', ')
    );
    console.error(
      '⚠️ Please add these variables to your .env file before starting the application.'
    );
    process.exit(1);
  }

  console.log('✅ All required environment variables are configured.');

  // Validate CORS origins
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [];
  corsOrigins.forEach((origin) => {
    const trimmedOrigin = origin.trim();
    try {
      new URL(trimmedOrigin);
    } catch (error) {
      console.error(
        `❌ Invalid CORS origin: "${trimmedOrigin}" - must be a valid URL`
      );
      process.exit(1);
    }
  });

  console.log(`✅ CORS origins validated: ${corsOrigins.map((o) => o.trim()).join(', ')}`);

  // Validate Mongo URI format
  if (!process.env.MONGO_URI?.startsWith('mongodb')) {
    console.error('❌ Invalid MONGO_URI - must be a valid MongoDB connection string');
    process.exit(1);
  }

  console.log('✅ MongoDB URI format validated.');

  return true;
};
