# UniONE Vercel Deployment Guide

## 🚀 Deploying to Vercel

### Frontend (Web App) Deployment

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import from GitHub: `Waqar080206/UniONE`

3. **Configure Frontend Deployment**
   ```
   Project Name: unione-frontend
   Framework Preset: Vite
   Root Directory: unione-platform/apps/web-app
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables**
   Add these environment variables in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app/api
   ```

### Backend (API) Deployment

1. **Create New Project**
   - Click "New Project" again
   - Import the same GitHub repository

2. **Configure Backend Deployment**
   ```
   Project Name: unione-backend
   Framework Preset: Other
   Root Directory: unione-platform/apps/backend
   Build Command: (leave empty)
   Output Directory: (leave empty)
   Install Command: npm install
   ```

3. **Environment Variables**
   Add these environment variables in Vercel dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key_here
   REDIS_URL=your_redis_connection_string (optional)
   PORT=3000
   ```

### Database Setup

#### MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist Vercel IPs (or use 0.0.0.0/0 for all IPs)
5. Get connection string and add to `MONGODB_URI`

#### Redis (Optional - for caching)
1. Go to [Upstash](https://upstash.com/) or [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
2. Create a free Redis database
3. Get connection URL and add to `REDIS_URL`

### Post-Deployment Steps

1. **Update Frontend API URL**
   - After backend is deployed, update `VITE_API_URL` in frontend environment variables
   - Redeploy frontend

2. **Test the Application**
   - Visit your frontend URL
   - Try logging in with different roles
   - Check if API calls are working

### Deployment Commands (Alternative CLI Method)

If you prefer using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Frontend
cd unione-platform/apps/web-app
vercel --prod

# Deploy Backend
cd ../backend
vercel --prod
```

### Troubleshooting

#### Common Issues:

1. **Build Failures**
   - Check if all dependencies are in package.json
   - Ensure Node.js version compatibility

2. **API Connection Issues**
   - Verify CORS settings in backend
   - Check environment variables
   - Ensure API URL is correct

3. **Database Connection**
   - Verify MongoDB connection string
   - Check network access settings in MongoDB Atlas

#### CORS Configuration
The backend already includes CORS configuration, but make sure your frontend URL is allowed:

```javascript
// In backend/src/app.js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true
}));
```

### Performance Optimization

1. **Enable Vercel Analytics** (optional)
2. **Configure caching headers**
3. **Optimize images and assets**
4. **Enable compression**

### Security Checklist

- ✅ Environment variables are set correctly
- ✅ JWT secret is strong and secure
- ✅ Database access is restricted
- ✅ CORS is properly configured
- ✅ Rate limiting is enabled
- ✅ Input validation is in place

### Monitoring

- Use Vercel's built-in analytics
- Monitor API response times
- Set up error tracking (optional: Sentry)
- Monitor database performance

---

## 📱 Quick Setup Summary

### For Frontend:
- **Root Directory**: `unione-platform/apps/web-app`
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### For Backend:
- **Root Directory**: `unione-platform/apps/backend`
- **Framework**: Other
- **Build Command**: (empty)
- **Output Directory**: (empty)

### Required Environment Variables:
**Frontend:**
- `VITE_API_URL`

**Backend:**
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `REDIS_URL` (optional)

That's it! Your UniONE platform should be live on Vercel! 🎉