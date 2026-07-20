# 🚀 Quick Start Guide - IntelliCare Support

## ✅ What's Created

A complete React + Node.js helpdesk system with:
- ✅ Backend API (Express + MySQL + Sequelize)
- ✅ Frontend (React + Vite + Tailwind CSS)
- ✅ Authentication (JWT-based)
- ✅ User Management
- ✅ Ticket Management
- ✅ Role-based Access Control

## 📦 Installation Steps

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Setup Environment Variables
```bash
# Create .env file in server folder
cp .env.example .env

# Edit .env and set your MySQL password
```

### 3. Create Database
```bash
cd server
npm run db:create
npm run db:migrate
```

This will:
- Create `intellicare_support` database
- Create all tables (users, tickets)
- Create default admin account:
  - Email: admin@intellicare.com
  - Password: admin123

### 4. Start Backend Server
```bash
cd server
npm run dev
```

Server runs on: **http://localhost:5000**

### 5. Install Frontend Dependencies
```bash
cd client
npm install
```

### 6. Setup Frontend Environment
```bash
# Create .env file in client folder
cp .env.example .env
```

### 7. Start Frontend
```bash
cd client
npm run dev
```

Frontend runs on: **http://localhost:5173**

## 🎯 Test the Application

1. Open browser: **http://localhost:5173**
2. Login with:
   - Email: admin@intellicare.com
   - Password: admin123
3. ⚠️ Change password immediately after first login!

## 📁 Project Structure

```
├── server/               # Backend (Node.js + Express)
│   ├── config/          # Database config
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth & validation
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── scripts/         # DB scripts
│   └── server.js        # Entry point
│
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Auth context
│   │   ├── layouts/     # Layout components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── App.jsx      # Main app
│   │   └── main.jsx     # Entry point
│   └── index.html
│
└── README.md
```

## 🔧 Next Steps

1. **Complete the Frontend Pages** (I'll continue creating these)
2. **Test all features**
3. **Customize branding and colors**
4. **Add your logo**

## 🆘 Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify .env credentials
- Ensure database is created

### Frontend can't connect to backend
- Check backend is running on port 5000
- Verify VITE_API_URL in client/.env

### Database connection error
- Verify MySQL credentials
- Check if database exists
- Run `npm run db:create` again

## 📚 API Endpoints

### Auth
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/profile` - Update profile
- PUT `/api/auth/password` - Change password

### Tickets
- GET `/api/tickets` - Get all tickets
- POST `/api/tickets` - Create ticket
- GET `/api/tickets/:id` - Get ticket
- PUT `/api/tickets/:id` - Update ticket
- DELETE `/api/tickets/:id` - Delete ticket (admin)
- GET `/api/tickets/stats` - Get statistics (admin)

### Users (Admin only)
- GET `/api/users` - Get all users
- GET `/api/users/:id` - Get user
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user
- GET `/api/users/stats` - Get user statistics

## 🎨 Features to Implement

Still need to create the React pages:
- [x] Auth pages (Login, Register)
- [ ] Dashboard with statistics
- [ ] Tickets list page
- [ ] Create ticket page
- [ ] Ticket detail page
- [ ] User management (admin)
- [ ] Profile page

**I will continue creating these pages now!**
