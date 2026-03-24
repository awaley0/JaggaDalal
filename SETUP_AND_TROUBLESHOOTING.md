# 🚀 Complete Setup & Troubleshooting Guide

## ✅ What Was Fixed

### 1. **Environment Variables** ✓
- Created `.env` files for both Backend and Frontend
- Configured MongoDB URI, JWT secret, and CORS origins
- Added VITE_API_BASE_URL for dynamic API endpoint

### 2. **API Configuration** ✓
- Fixed `axios.js` with proper interceptors
- Added request/response error handling
- Automatic token injection in headers
- Updated auth.js to use centralized axios instance

### 3. **Backend Setup** ✓
- Enhanced CORS configuration with proper origins
- Better error handling and logging
- Input validation middleware
- Standardized API response format
- Database connection improvements

### 4. **Frontend Improvements** ✓
- Better error message handling
- Network error detection
- "Remember Me" functionality
- Loading states and visual feedback

### 5. **Vite Proxy** ✓
- Added dev server proxy for `/api` routes
- No CORS issues in development

---

## 🔧 Important: Before Running

### 1. **MongoDB Setup**
Make sure MongoDB is running:

**Windows:**
```bash
# Start MongoDB Service
mongod

# Or if installed via MongoDB Community Edition:
# Open Services and find "MongoDB Server" or start from terminal:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

### 2. **Node Modules Installation**
```bash
# Backend
cd Backend
npm install

# Frontend
cd Frontend
npm install
```

---

## 🎯 Running the Application

### Terminal 1 - Backend:
```bash
cd Backend
npm start
# or
npm run dev    # with nodemon for auto-reload
```

**Expected Output:**
```
╔═══════════════════════════════════════╗
║  🚀 Server Running Successfully!      ║
║  🌍 http://localhost:5000             ║
║  📡 API: http://localhost:5000/api    ║
║  🔧 Environment: development          ║
╚═══════════════════════════════════════╝

✅ MongoDB Connected successfully
```

### Terminal 2 - Frontend:
```bash
cd Frontend
npm run dev
```

**Expected Output:**
```
VITE v7.1.14  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## 🧪 Testing Authentication

### 1. **Test Backend Directly** (Before Testing UI)

**Health Check:**
```bash
curl http://localhost:5000
```

**Expected Response:**
```json
{
  "message": "✅ API is running...",
  "timestamp": "2026-03-23T...",
  "environment": "development"
}
```

### 2. **Test Signup Endpoint:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "buyer"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "msg": "Account created successfully!",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "buyer"
  }
}
```

### 3. **Test Login Endpoint:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## ❌ Troubleshooting

### **Network Error in UI**

**Problem:** "Network error. Make sure the backend server is running..."

**Solutions:**
1. ✅ Is backend running on port 5000?
   ```bash
   netstat -ano | findstr :5000    # Windows Check
   ```

2. ✅ Is MongoDB running?
   ```bash
   mongo --version    # Check if MongoDB is installed
   mongod             # Start MongoDB
   ```

3. ✅ Check Backend .env file:
   ```bash
   cat Backend/.env
   # Should show: MONGO_URI, JWT_SECRET, PORT=5000
   ```

4. ✅ Test API health:
   ```bash
   curl http://localhost:5000
   ```

---

### **"Email already exists" Error**

This means a user with that email is already in the database.

**Solutions:**
1. Use a different email
2. Clear MongoDB database:
   ```bash
   mongo
   > use jagga_dalal
   > db.users.deleteMany({})
   > exit
   ```

---

### **"Invalid email or password" on Login**

The email or password doesn't match any user in the database.

**Solutions:**
1. ✅ Double-check your email and password
2. ✅ Create a new account first with the signup form
3. ✅ Verify MongoDB has the user:
   ```bash
   mongo
   > use jagga_dalal
   > db.users.find()
   > exit
   ```

---

### **CORS or Connection Errors**

**In Browser Console:** Check for red error messages

**Solutions:**
1. ✅ Verify Backend .env has correct CORS_ORIGIN:
   ```
   CORS_ORIGIN=http://localhost:5173,http://localhost:5174
   ```

2. ✅ Clear browser cache:
   - F12 → Application → Clear all

3. ✅ Restart both servers:
   - Stop backend and frontend (Ctrl+C)
   - Run them again from fresh terminals

---

### **"Cannot GET /api/auth/..." in Browser**

This happens if you're accessing the API directly in browser (wrong endpoint).

**Solutions:**
1. ✅ Use the UI to test (http://localhost:5173)
2. ✅ Use curl or Postman for direct API testing
3. ✅ API is only accessible via POST requests for auth

---

## 📊 Architecture Overview

```
Frontend (React + Vite)
  ↓
Vite Dev Server (http://localhost:5173)
  ↓ [Proxy: /api → localhost:5000]
  ↓
Backend API (Express.js)
  ↓
MongoDB Database
```

---

## 🔐 Security Notes

- **JWT_SECRET**: Change from default in production
- **CORS_ORIGIN**: Update for your production domain
- **NODE_ENV**: Set to 'production' for production builds
- **Password Hashing**: Using bcryptjs (12 rounds)
- **Token Expiry**: 7 days

---

## 📱 Key Features Configured

✅ User registration with validation
✅ User login with JWT tokens
✅ "Remember Me" functionality
✅ Password reset functionality
✅ Protected API routes
✅ Token-based authentication
✅ Input validation (frontend & backend)
✅ Error handling & logging
✅ CORS configuration
✅ MongoDB integration

---

## 🎓 Next Steps

1. **Test the full auth flow** using the UI
2. **Implement email verification** (optional)
3. **Add password strength validation** (optional)
4. **Setup production deployment** (AWS, Heroku, etc.)
5. **Add additional user fields** as needed

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start backend with auto-reload |
| `npm start` | Start backend |
| `npm install` | Install dependencies |
| `mongod` | Start MongoDB |
| `curl http://localhost:5000` | Test API health |

---

## ✨ Success Indicators

Your setup is working correctly when:

1. ✅ Backend shows all startup messages
2. ✅ Frontend loads without errors
3. ✅ Signup form submits without network errors
4. ✅ New user appears in MongoDB
5. ✅ Login works with the new credentials
6. ✅ Token is saved in localStorage
7. ✅ Redirects to home page after login

---

**Happy coding! 🎉**
