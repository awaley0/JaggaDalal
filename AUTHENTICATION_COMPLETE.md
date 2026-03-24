# Authentication System - Complete Guide

## What Was Fixed

### 1. **Route Protection** ✅
- Created `ProtectedRoute` component for authenticated routes
- Created `AdminRoute` component for admin-only routes
- Admin routes (`/admin/*`) now require both authentication AND admin role
- Unauthorized users are redirected to login

### 2. **Global Auth Context** ✅
- Created `AuthContext` for centralized user state management
- No need to read from localStorage in every component
- Shared auth state across entire app
- Automatic token and user synchronization

### 3. **Login Flow** ✅
- Updated `Login.jsx` to use `useAuth()` hook
- Automatically redirects logged-in users to home
- Uses context login function for state management
- Token and user properly stored and synced

### 4. **Signup Flow** ✅
- Updated `Signup.jsx` to use `useAuth()` hook
- Auto-redirects logged-in users
- Uses context login function after signup
- Consistent authentication handling

### 5. **Navbar Updates** ✅
- Updated `Navbar.jsx` to use `useAuth()` hook
- Gets user from context (not localStorage)
- Logout function from context properly clears state
- User info automatically updates across app

## File Structure

```
Frontend/src/
├── context/
│   └── AuthContext.jsx          (NEW - Global auth state)
├── components/
│   ├── ProtectedRoute.jsx       (NEW - Auth guard)
│   ├── AdminRoute.jsx           (NEW - Admin guard)
│   └── Navbar.jsx               (UPDATED - Uses AuthContext)
├── auth/
│   ├── Login.jsx                (UPDATED - Uses AuthContext)
│   └── Signup.jsx               (UPDATED - Uses AuthContext)
└── App.jsx                      (UPDATED - Wrapped with AuthProvider)
```

## How It Works

### Authentication Flow

```
User Signs Up/Logs In
        ↓
Backend generates JWT token
        ↓
Frontend receives token & user data
        ↓
AuthContext.login() stores in localStorage AND updates state
        ↓
All components get user from useAuth() hook
        ↓
Axios interceptor auto-injects token in headers
        ↓
Protected routes check token and redirect if unauthorized
```

### Access Control

```
Public Routes (/home, /buy, /rent, /sell)
        ↓
Anyone can access

Protected Routes (/admin, /admin/properties, /admin/users)
        ↓
Must have valid token → Use <AdminRoute> wrapper
        ↓
Must have role === "admin" → AdminRoute checks this
        ↓
Unauthorized users redirected to /login
```

## Testing the Authentication System

### Prerequisites
1. Backend running: `npm run dev` in `Backend/` folder
2. Frontend running: `npm run dev` in `Frontend/` folder
3. MongoDB running

### Test Scenario 1: User Registration & Login

**Step 1: Signup with Admin Role**
1. Navigate to `http://localhost:5173/signup`
2. Fill in:
   - Name: `Admin User`
   - Email: `admin@test.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - Role: Select "Admin" from dropdown
3. Click "Sign Up"
4. You should be auto-logged in and redirected to home
5. Check navbar - should show "Admin User" name and dropdown with "Admin Panel" link

**Step 2: Verify Admin Panel Access**
1. Click on admin name in navbar → dropdown appears
2. Click "Admin Panel" link
3. Should see AdminDashboard page
4. Check browser URL → should be `http://localhost:5173/admin`

**Step 3: Logout**
1. Click admin name in navbar dropdown
2. Click "Logout"
3. You should be redirected to `/login`
4. Token and user data cleared from localStorage

### Test Scenario 2: Non-Admin User Cannot Access Admin

**Step 1: Signup with Buyer Role**
1. Navigate to `http://localhost:5173/signup`
2. Fill in:
   - Name: `Regular User`
   - Email: `buyer@test.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - Role: Select "Buyer"
3. Click "Sign Up"
4. Should be redirected to home as logged-in user

**Step 2: Try to Access Admin Directly**
1. Manually navigate to `http://localhost:5173/admin`
2. Should be redirected back to home (`/`)
3. No admin panel access for non-admin users

### Test Scenario 3: Unauthenticated User Cannot Access Protected Routes

**Step 1: Logout if logged in**
1. If you have logged-in user, click logout

**Step 2: Try to Access Admin**
1. Manually navigate to `http://localhost:5173/admin`
2. Should be redirected to `/login`
3. Must log in first

### Test Scenario 4: Token Persistence Across Page Refresh

**Step 1: Login**
1. Go to `/login`
2. Enter: `admin@test.com` / `password123`
3. After login redirect, check:
   - Browser DevTools → Application → localStorage
   - Should see `token` and `user` keys

**Step 2: Refresh Page**
1. Press F5 or Ctrl+R to refresh
2. You should still be logged in
3. Navbar should still show admin name
4. Token and user loaded from localStorage by AuthContext

**Step 3: Browser DevTools**
1. Open DevTools → Network tab
2. Try to load any API endpoint
3. Check Authorization header → should contain `Bearer ${token}`

## Common Issues & Solutions

### Issue: "Login button still visible after login"
**Solution:** Navbar wasn't updated. Should show user dropdown instead.
- Check: Is navbar using `useAuth()` hook?
- Try: Hard refresh (Ctrl+Shift+R)

### Issue: "Admin can't access admin panel"
**Solution:** 
- Check MongoDB for user document: `db.users.findOne({email: "admin@test.com"})`
- Verify `role: "admin"` is set
- Check localStorage → user object should have `"role":"admin"`

### Issue: "Protected route redirects to login immediately"
**Solution:**
- Check if backend is running
- Verify token in localStorage is valid
- Check axios interceptor is configured
- Test with Postman: POST `/api/auth/profile` with Authorization header

### Issue: "Page refresh loses user"
**Solution:** AuthContext initialization might be failing
- Check browser console for errors
- Verify localStorage has token and user data
- Restart frontend: `npm run dev`

## Backend Requirements

Make sure backend has:

1. **Proper JWT secret in .env**
   ```
   JWT_SECRET=your_secret_key_here
   ```

2. **Auth middleware in place**
   ```javascript
   app.use(bodyParser.json({ limit: '50mb' }));
   app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
   ```

3. **Protected routes configured**
   ```javascript
   router.get('/profile', authMiddleware, getUserProfile);
   ```

4. **User model has role field**
   ```javascript
   role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' }
   ```

## API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|----------------|-------------|
| POST | `/api/auth/signup` | No | Create new user account |
| POST | `/api/auth/login` | No | Login and get JWT token |
| GET | `/api/auth/profile` | Yes | Get authenticated user profile |
| GET | `/api/auth/users` | Yes | Get all users (admin only) |
| POST | `/api/auth/forgot-password` | No | Initiate password reset |
| POST | `/api/auth/reset-password` | No | Complete password reset |

## Next Steps

1. **Test all scenarios above** to verify authentication works
2. **Verify MongoDB integration** - check that users are created with proper roles
3. **Test token injection** - use Postman to verify Authorization header
4. **Test logout flow** - ensure clean state cleanup
5. **Test page refresh** - ensure token persistence works
6. **Check browser console** - look for any React render errors

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a secure random string
- [ ] Update CORS_ORIGIN to production domain
- [ ] Enable HTTPS only for token transmission
- [ ] Implement refresh token rotation
- [ ] Add email verification for new signups
- [ ] Add password reset email confirmation
- [ ] Implement rate limiting on auth endpoints
- [ ] Add audit logging for admin access
- [ ] Test on multiple browsers
- [ ] Setup automated tests for auth flow
