# RetinoScan Backend Setup Guide

## 🚀 Quick Setup

### 1. Environment Configuration
Copy the `.env.example` file to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 2. MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Get your connection string
4. Replace `MONGODB_URI` in `.env`

Example:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/retinoscan?retryWrites=true&w=majority
```

### 3. Cloudinary Setup
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Get your credentials from dashboard
4. Add to `.env`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Firebase Setup
1. Go to Firebase Console
2. Generate service account key
3. Add credentials to `.env`:

```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 5. Start the Server
```bash
npm run start:dev
```

## 📡 API Endpoints

### Authentication
All endpoints require Firebase JWT token in Authorization header:
```
Authorization: Bearer <firebase_jwt_token>
```

### Available Endpoints:

#### Upload Analysis
```
POST /api/analysis/upload
Content-Type: multipart/form-data

Body:
- image: [image file]
- patientName: string
- patientAge?: number
- patientGender?: 'male' | 'female' | 'other'
- patientNotes?: string
```

#### Get User's Analyses
```
GET /api/analysis
```

#### Get Specific Analysis
```
GET /api/analysis/:id
```

#### Delete Analysis
```
DELETE /api/analysis/:id
```

## 🔧 Next Steps

1. **Configure your .env file** with real credentials
2. **Test the API** with Postman or similar
3. **Connect from Frontend** - update Angular services
4. **Add ML integration** when ready

## 🧪 Testing

Test with curl:
```bash
curl -X POST http://localhost:3000/api/analysis/upload \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "image=@retinal_scan.jpg" \
  -F "patientName=John Doe"
```
