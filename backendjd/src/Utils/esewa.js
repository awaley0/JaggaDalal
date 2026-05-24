import crypto from 'crypto';

// eSewa Sandbox Credentials - from environment variables
const ESEWA_MERCHANT_CODE = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q'; 

// For standard testing without env vars, hardcoding these as specified in Sandbox docs.
export const generateEsewaSignature = (total_amount, transaction_uuid, product_code = ESEWA_MERCHANT_CODE) => {
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  const hash = crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(data).digest('base64');
  return hash;
};

export const verifyEsewaSignature = (encodedData) => {
  try {
    // Decode base64 
    const decodedStr = Buffer.from(encodedData, 'base64').toString('ascii');
    const parsedData = JSON.parse(decodedStr);

    const {
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
      signature
    } = parsedData;

    // eSewa V2 uses signed_field_names heavily. If not present, we will fallback to standard ordering
    let stringToHash = '';
    if (signed_field_names) {
        const fields = signed_field_names.split(',');
        const fieldArray = fields.map(field => {
            // we must properly fetch the value to match the fields they signed with
            return `${field}=${parsedData[field]}`;
        });
        stringToHash = fieldArray.join(',');
    } else {
        stringToHash = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    }

    const generatedSignature = crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(stringToHash).digest('base64');

    if (generatedSignature !== signature) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { 
      success: true, 
      data: parsedData 
    };

  } catch (error) {
    console.error("eSewa verification error: ", error);
    return { success: false, error: 'Invalid payload' };
  }
};
