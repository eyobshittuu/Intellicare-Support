# IntelliCare Support - Ticketing System

A professional full-stack ticketing system built for IntelliCare healthcare facilities to manage IT support requests efficiently.

![IntelliCare Support](https://img.shields.io/badge/Version-1.0.0-teal)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-v18-blue)
![MySQL](https://img.shields.io/badge/MySQL-v8+-orange)

## 🎯 Features

### User Management
- **Three-tier role system**: User, Admin, Super Admin
- Secure authentication with JWT tokens
- User registration and login
- Profile management

### Ticket Management
- Create, view, and track support tickets
- 31+ hospital/clinic locations supported
- Three categories: Technical Issue, Training Request, Other
- Four priority levels: Low, Medium, High, Urgent
- Real-time ticket status tracking (Pending, In Progress, Completed, Rejected)
- Professional card-based ticket list view

### Admin Features
- Comprehensive admin work log system with 4 sections:
  - Admin Notes (internal documentation)
  - Problem Diagnosis (root cause analysis)
  - Actions Taken (work performed)
  - Resolution Steps (step-by-step solution)
- Ticket status and priority management
- Work log locking after finalization
- Ticket finalization with user-facing summary

### Super Admin Features
- Create and manage admin users
- View all users with filtering
- Delete users (with protection against self-deletion)
- Real-time ticket statistics dashboard
- Full system oversight

### UI/UX
- Modern, responsive design with Tailwind CSS
- Collapsible sidebar with hamburger menu
- Card-based ticket view (no horizontal scrolling)
- Color-coded status and priority badges
- Professional login page with branding
- Teal/black/white color scheme

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Relational database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn package manager

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/eyobshittuu/Intellicare-Support.git
cd Intellicare-Support
```

### 2. Install dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 3. Database Setup

#### Create MySQL Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE intellicare_ticketing;
exit;
```

#### Run Database Migration
```bash
cd server
node scripts/createDatabase.js
node scripts/migrate.js
```

### 4. Environment Configuration

#### Backend (.env)
Create `server/.env` file:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=intellicare_ticketing
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d

# CORS
CLIENT_URL=http://localhost:5173
```

#### Frontend (.env)
Create `client/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Start the Application

#### Start Backend Server
```bash
cd server
npm run dev
```
Server runs on: http://localhost:5000

#### Start Frontend
```bash
cd client
npm run dev
```
Frontend runs on: http://localhost:5173

## 👥 Default Credentials

### Super Admin Account
```
Email: admin@intellicare.com
Password: admin123
```

⚠️ **Important**: Change the default password after first login in production!

## 📁 Project Structure

```
Intellicare-Support/
├── client/                    # Frontend React application
│   ├── public/               # Static assets
│   │   ├── logo.png         # Header logo
│   │   └── login.png        # Login page logo
│   ├── src/
│   │   ├── context/         # React context (Auth)
│   │   ├── layouts/         # Layout components
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin pages
│   │   │   └── auth/        # Auth pages
│   │   ├── services/        # API services
│   │   └── App.jsx          # Main app component
│   └── package.json
│
├── server/                   # Backend Express application
│   ├── config/              # Configuration files
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Express middleware
│   ├── models/              # Sequelize models
│   ├── routes/              # API routes
│   ├── scripts/             # Database scripts
│   └── server.js            # Entry point
│
└── README.md
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Protected API routes
- Input validation and sanitization
- CORS configuration
- SQL injection prevention (Sequelize ORM)
- XSS protection

## 🎨 User Interface

### Login Page
- Professional branding with logo
- Clean, modern design
- Blue color scheme (#4A90E2)
- Forgot password link
- Responsive layout

### Dashboard
- Real-time statistics (Admin/Super Admin)
- Quick action buttons
- Account information display
- Role-based content

### Tickets View
- Card-based layout (no horizontal scrolling)
- Color-coded status badges
- Priority indicators
- Search and filter functionality
- Hospital/location display
- User information (admin view)

### Ticket Detail
- Two-tab interface: Details + Admin Work Log
- Complete ticket information
- Status and priority management
- Four-section admin work log
- Work log locking after finalization

### User Management (Super Admin)
- User list with avatars
- Role badges with icons
- Search and filter by role
- Delete functionality
- Ticket statistics overview

## 🏥 Supported Facilities

The system supports 31 healthcare facilities including:
- General Hospitals (18)
- Medium Clinics (8)
- Specialty Centers (3)
- Diagnostic Centers (1)
- Multispecialty Centers (1)

See `client/src/pages/CreateTicket.jsx` for the complete list.

## 📊 Database Schema

### Users Table
- id, email, password (hashed)
- first_name, middle_name, last_name
- role (user/admin/super_admin)
- is_active, timestamps

### Tickets Table
- id, ticket_number, title, description
- category, hospital, priority, status
- user_id (creator)
- admin_notes, diagnosis, actions_taken, resolution_steps
- started_at, resolved_at
- summary, finalized_by, finalized_at
- timestamps

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tickets
- `GET /api/tickets` - Get all tickets (filtered by role)
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `PUT /api/tickets/:id/finalize` - Finalize ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `GET /api/tickets/stats` - Get statistics

### Users (Admin/Super Admin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/create-admin` - Create admin (Super Admin only)
- `GET /api/users/stats` - Get user statistics

## 🚦 Ticket Workflow

1. **User Creates Ticket**
   - Selects hospital, category, priority
   - Provides title and description
   - System generates ticket number (TKT-XXXXX)
   - Status: Pending

2. **Admin Reviews Ticket**
   - Views ticket details
   - Clicks "Start Working"
   - Status changes to: In Progress

3. **Admin Works on Ticket**
   - Fills admin work log (4 sections)
   - Updates status/priority as needed
   - Can save progress multiple times

4. **Admin Finalizes Ticket**
   - Writes user-facing summary
   - Clicks "Finalize Ticket"
   - Status: Completed
   - Work log locks (read-only)

## 🎯 Role Permissions

### User
- ✅ Create tickets
- ✅ View own tickets
- ✅ View ticket details
- ❌ Cannot edit status/priority
- ❌ Cannot access admin panel

### Admin
- ✅ View all tickets
- ✅ Update ticket status/priority
- ✅ Add admin work logs
- ✅ Finalize tickets
- ❌ Cannot create admin users
- ❌ Cannot delete users

### Super Admin
- ✅ All admin permissions
- ✅ Create new admin users
- ✅ View all users
- ✅ Delete users
- ✅ View system statistics

## 🔄 Development

### Run Backend in Development Mode
```bash
cd server
npm run dev
```
Uses nodemon for auto-restart on file changes.

### Run Frontend in Development Mode
```bash
cd client
npm run dev
```
Vite dev server with hot module replacement.

### Build for Production

#### Frontend
```bash
cd client
npm run build
```
Creates optimized build in `client/dist/`

#### Backend
```bash
cd server
npm start
```
Runs production server.

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists: `intellicare_ticketing`
- Run migration scripts

### Port Already in Use
- Backend: Change `PORT` in `server/.env`
- Frontend: Change port in `vite.config.js`

### CORS Errors
- Verify `CLIENT_URL` in `server/.env` matches frontend URL
- Check CORS configuration in `server/server.js`

## 📝 Documentation

Detailed documentation available in the repository:
- `PROJECT-SUMMARY.md` - Complete project overview
- `DATABASE-SETUP.md` - Database configuration
- `QUICK-START.md` - Getting started guide
- `ADMIN-WORKLOG-SYSTEM.md` - Admin work log details
- `SUPER-ADMIN-FEATURES-UPDATE.md` - Super admin features
- `TICKETS-LIST-REDESIGN.md` - UI redesign details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for IntelliCare.

## 👨‍💻 Developer

**Developed by Bit Weavers PLC**

## 📞 Support

For support and questions, please contact your system administrator.

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅
