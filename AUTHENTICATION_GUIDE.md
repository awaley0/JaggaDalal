# Authentication System - Setup & Implementation Guide

## 🎨 Modern Login & Signup System

A complete, production-ready authentication system with JWT, password recovery, and modern Tailwind CSS UI.

---

## ✨ Features Implemented

### ✅ Authentication
- **JWT-based authentication** (7-day token expiry)
- **User registration** with full validation
- **User login** with "Remember Me" functionality
- **Password reset flow** with secure tokens
- **Forgot password** recovery
- **Protected API endpoints** with middleware

### ✅ Frontend Components
- **Modern Login Page** with:
  - Email & password inputs
  - Show/hide password toggle
  - Remember me checkbox
  - Forgot password link
  - Social login UI (Google, GitHub)
  - Form validation & error messages
  - Loading states
  
- **Multi-step Signup Form** with:
  - Step 1: Name, Email, Role Selection
  - Step 2: Password, Confirm Password
  - Progress indicator
  - Password visibility toggles
  - Form validation
  - Social login UI

- **Forgot Password Page**
  - Email verification
  - Success/error feedback
  - Auto-redirect to login

- **Reset Password Page**
  - Token validation
  - New password input
  - Confirm password input
  - Success/error handling

### ✅ Backend Implementation
- Complete auth controller with all operations
- Secure password hashing with bcryptjs
- JWT token generation & verification
- Password reset with time-limited tokens
- User model with verification fields
- Protected routes with authentication middleware

### 🎨 UI Design
- Dark gradient background (slate-900, purple-900)
- Glass-morphism effect with backdrop blur
- Smooth animations & transitions
- Tailwind CSS utilities
- Eye-pleasing color scheme (purple & pink gradients)
- Responsive design for all screen sizes

---

## 🚀 Getting Started

### 1. Environment Setup

**Backend .env file** (`Backend/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/fyp
JWT_SECRET=your_super_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
```

### 2. Install Dependencies

```bash
# Backend
cd Backend
npm install

# Frontend
cd Frontend
npm install
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd Backend
npm start          # or npm run dev (with nodemon)
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

The backend will run on `http://localhost:5000`
The frontend will run on `http://localhost:5173` (or another port if 5173 is in use)

---

## 📋 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| GET | `/api/auth/profile` | Get authenticated user profile | Yes |
| GET | `/api/auth/users` | Get all users | No |

### Request Examples

**Signup:**
```json
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "buyer",
  "phone": "1234567890",
  "bio": "Optional bio",
  "rememberMe": true
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**Forgot Password:**
```json
POST /api/auth/forgot-password
{
  "email": "john@example.com"
}
```

**Reset Password:**
```json
POST /api/auth/reset-password
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

---

## 🔐 Token Management

### How Tokens Work

1. **Login/Signup**: Server generates JWT token that's valid for 7 days
2. **Storage**: Token is stored in localStorage
3. **API Requests**: Token is automatically included in Authorization header
4. **Token Expiry**: If token expires, user is redirected to login

### Token Format
```
Authorization: Bearer <jwt_token>
```

---

## 🛠️ Customization Guide

### Change Colors
Edit the gradient in component files:
```jsx
// Login.jsx, Signup.jsx
from-slate-900 via-purple-900 to-slate-900  // Background
from-purple-400 to-pink-400                  // Text gradient
from-purple-500 to-pink-500                  // Button gradient
```

### Change JWT Expiry
In `authController.js`:
```javascript
{ expiresIn: "7d" }  // Change this value
```

### Change Password Requirements
In `authController.js`, update validation:
```javascript
if (password.length < 6) {  // Change minimum length
  return res.status(400).json({ msg: "Password too short" });
}
```

---

## ⚠️ Important Notes

### Password Reset Flow (Currently)
In development, the reset token is logged to the console:
```
Password reset token for user@example.com: abc123def456...
```

Use this token in the URL: `/reset-password?token=abc123def456...`

**For Production**: Integrate with email service (nodemailer, SendGrid, etc.)

### Social Login
Social login buttons are UI-ready but not yet connected. To implement:
1. Set up OAuth apps (Google, GitHub)
2. Install OAuth libraries
3. Implement OAuth flow
4. Connect to backend

### Frontend Local Storage
Tokens are stored in localStorage with keys:
- `token` - JWT authentication token
- `rememberToken` - Remember me token
- `user` - User object (JSON)

---

## 🔄 File Structure

```
Frontend/src/
├── auth/
│   ├── Login.jsx                  # Login page
│   ├── Signup.jsx                 # Signup page
│   ├── ForgotPassword.jsx         # Password recovery
│   └── ResetPassword.jsx          # Password reset
├── api/
│   └── auth.js                    # API calls & interceptors
└── App.jsx                        # Routes configuration

Backend/src/
├── controllers/
│   └── authController.js          # Auth logic
├── models/
│   └── User.js                    # User schema
├── routes/
│   └── authRoutes.js              # Auth endpoints
├── middleware/
│   └── authMiddleware.js          # JWT verification
└── config/
    └── db.js                      # MongoDB connection
```

---

## 🎯 Next Steps

### Immediate (For Testing)
- [ ] Set up MongoDB connection
- [ ] Configure JWT_SECRET in .env
- [ ] Test login/signup on http://localhost:5173
- [ ] Test password reset flow

### Short Term (Enhancement)
- [ ] Update Navbar to show logged-in user
- [ ] Add logout button to Navbar
- [ ] Create protected routes (buyer/seller/admin only)
- [ ] Create user profile page
- [ ] Add profile update functionality

### Medium Term (Production Ready)
- [ ] Integrate email service for password reset
- [ ] Add email verification on signup
- [ ] Implement social login (Google OAuth)
- [ ] Add rate limiting to auth endpoints
- [ ] Add HTTPS/SSL support
- [ ] Set up proper error logging
- [ ] Add refresh token mechanism

### Advanced
- [ ] Two-factor authentication
- [ ] Session management
- [ ] Audit logging
- [ ] Security headers

---

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
# Reinstall dependencies
npm install

# Clear cache
npm cache clean --force
npm install
```

### Token not working
- Check if token is in localStorage
- Verify JWT_SECRET matches in backend
- Check token expiry time
- Ensure Authorization header format is correct

### MongoDB connection fails
- Verify MongoDB is running
- Check MONGODB_URI in .env
- Ensure network access if using Atlas

### CORS errors
- Backend CORS is enabled in index.js
- Verify frontend points to correct backend URL
- Check if ports match configuration

---

## 📚 Dependencies Used

### Backend
- **express** - Web framework
- **mongoose** - MongoDB ORM
- **jsonwebtoken** - JWT generation/verification
- **bcryptjs** - Password hashing
- **cors** - CORS handling
- **dotenv** - Environment variables

### Frontend
- **react** - UI framework
- **react-router-dom** - Routing
- **axios** - HTTP client
- **tailwindcss** - Styling

---

## 🎓 Learning Resources

- [JWT Documentation](https://jwt.io)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)

---

## 📝 Notes for Future Development

- Add email verification verification tokens stored in DB
- Implement rate limiting on auth endpoints
- Add comprehensive audit logging
- Add user role-based access control checks
- Create API documentation with Swagger
- Add unit tests for auth controller
- Implement refresh token rotation

---

**Last Updated**: March 2026
**Status**: ✅ Ready for Testing
