# IntelliCare Support System - Technical Overview

## Project Summary
A comprehensive support ticketing system built for healthcare facilities to manage IT support requests, track issues, and facilitate communication between users and administrators.

---

## Technology Stack

### **Frontend** 🎨
- **Framework**: React 18 (JavaScript library for building user interfaces)
- **Build Tool**: Vite (Fast modern build tool)
- **Routing**: React Router v6 (Client-side routing)
- **Styling**: Tailwind CSS (Utility-first CSS framework)
- **UI Components**: 
  - Lucide React (Modern icon library)
  - Custom-built components
- **State Management**: React Context API (for auth, socket connections)
- **HTTP Client**: Axios (Promise-based HTTP requests)
- **Notifications**: Sonner (Toast notifications)
- **Real-time**: Socket.IO Client (WebSocket communication)
- **Document Viewers**: 
  - react-pdf (PDF rendering)
  - mammoth (Word document conversion)
  - xlsx (Excel/CSV parsing)

### **Backend** ⚙️
- **Runtime**: Node.js (JavaScript runtime)
- **Framework**: Express.js (Web application framework)
- **Database**: PostgreSQL (Relational database)
- **ORM**: Sequelize (Object-Relational Mapping)
- **Authentication**: 
  - JWT (JSON Web Tokens)
  - bcryptjs (Password hashing)
- **Real-time**: Socket.IO (WebSocket server)
- **File Upload**: 
  - Multer (File upload middleware)
  - Cloudinary (Cloud storage)
- **Logging**: Winston + Morgan (Application logging)
- **Validation**: Express Validator
- **Security**: 
  - CORS (Cross-Origin Resource Sharing)
  - Helmet (Security headers)
  - Rate limiting

### **Database** 🗄️
- **Primary**: PostgreSQL 14+
- **Hosting**: Render (Cloud database)
- **Features Used**:
  - JSONB fields for flexible data (attachments)
  - Foreign keys and relationships
  - Indexes for performance
  - Transactions for data integrity

### **File Storage** 📁
- **Service**: Cloudinary
- **Features**:
  - Image optimization and transformation
  - Raw file storage (PDF, Word, Excel, ZIP)
  - Signed URLs for secure access
  - CDN delivery
  - 10MB file size limit

### **Deployment** 🚀

#### Frontend:
- **Platform**: Vercel
- **Features**:
  - Automatic deployments from GitHub
  - CDN distribution
  - Zero-config deployment
  - Environment variables
  - Custom domain support

#### Backend:
- **Platform**: Render
- **Features**:
  - Automatic deployments from GitHub
  - Environment variables
  - Free SSL certificates
  - Continuous deployment
  - Web service hosting

### **Version Control** 📚
- **Git**: Version control system
- **GitHub**: Code repository and collaboration
- **Branches**: Main branch with CI/CD

---

## Architecture

### **Frontend Architecture**
```
client/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── layouts/         # Layout wrappers
│   ├── context/         # React Context providers
│   ├── services/        # API service layers
│   └── main.jsx         # Entry point
```

### **Backend Architecture**
```
server/
├── controllers/         # Business logic
├── models/             # Database models (Sequelize)
├── routes/             # API routes
├── middleware/         # Custom middleware
├── config/             # Configuration files
├── socket/             # Socket.IO handlers
└── server.js           # Entry point
```

### **Database Schema**

#### Users Table:
- id, email, password, first_name, middle_name, last_name
- role (user, admin, super_admin)
- is_active, created_at, updated_at

#### Tickets Table:
- id, ticket_number, title, description
- category, hospital, priority, status
- user_id (foreign key to Users)
- assigned_to (foreign key to Users)
- attachments (JSONB - stores file metadata)
- admin_notes, diagnosis, actions_taken, resolution_steps
- finalized_by, finalized_at, summary
- created_at, updated_at, started_at, resolved_at

#### Messages Table (Chat):
- id, sender_id, recipient_id, content
- is_read, read_at
- created_at, updated_at

---

## Key Features

### 1. **Authentication & Authorization** 🔐
- JWT-based authentication
- Role-based access control (User, Admin, Super Admin)
- Secure password hashing with bcrypt
- Protected routes and API endpoints

### 2. **Ticket Management** 🎫
- Create, view, update, delete tickets
- File attachments (images, PDFs, documents, archives)
- Priority levels (Low, Medium, High, Urgent)
- Status tracking (Pending, In Progress, Completed, Rejected)
- Admin work logs and diagnosis
- Ticket finalization with summary

### 3. **Real-time Chat System** 💬
- One-on-one messaging between users
- Online/offline status indicators
- Typing indicators
- Read receipts (✓✓)
- Unread message counter
- User search functionality

### 4. **Admin Dashboard** 📊
- Ticket statistics (total, pending, in-progress, completed, rejected)
- Tabbed interface for ticket filtering
- User management
- System logs viewer

### 5. **Document Viewer** 📄
- In-app PDF viewer (all pages scrollable)
- Word document preview (converted to HTML)
- Excel/CSV viewer (rendered as tables)
- Image lightbox
- Zoom controls
- Download option

### 6. **System Logging** 📝
- User activity logging (login, registration, profile updates)
- Admin actions logging (ticket updates, user management)
- Ticket lifecycle logging (creation, updates, finalization)
- Failed login attempts tracking
- Searchable and filterable logs
- Log rotation (5MB max per file, keeps 5 files)

### 7. **File Upload System** 📤
- Multiple file types supported
- Drag & drop interface
- File validation (type, size)
- Progress indication
- Preview before upload
- Cloudinary integration for cloud storage

---

## API Architecture

### **RESTful API Endpoints**

#### Authentication:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

#### Tickets:
- `GET /api/tickets` - Get all tickets (filtered by role)
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create ticket (with file upload)
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket (admin only)
- `GET /api/tickets/stats` - Get ticket statistics (admin only)
- `PUT /api/tickets/:id/finalize` - Finalize ticket (admin only)

#### Chat:
- `GET /api/chat/users` - Get all users for chat
- `GET /api/chat/conversations/:userId` - Get conversation
- `POST /api/chat/messages` - Send message
- `PUT /api/chat/messages/:messageId/read` - Mark as read

#### Users (Admin):
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user/admin (super admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (super admin only)

#### Logs:
- `GET /api/logs` - Get system logs (super admin only)
- `GET /api/logs/stats` - Get log statistics (super admin only)
- `DELETE /api/logs/:type` - Clear logs (super admin only)
- `GET /api/logs/download/:type` - Download logs (super admin only)

### **WebSocket Events (Socket.IO)**

#### Chat Events:
- `user:online` - User comes online
- `user:offline` - User goes offline
- `message:send` - Send message
- `message:receive` - Receive message
- `typing:start` - User starts typing
- `typing:stop` - User stops typing
- `message:read` - Message marked as read

---

## Security Features

### **Authentication**
- JWT tokens with expiration
- Secure HTTP-only cookies (optional)
- Password hashing with bcrypt (10 rounds)
- Token refresh mechanism

### **Authorization**
- Role-based access control (RBAC)
- Protected routes on frontend
- Protected API endpoints on backend
- Middleware-based authorization checks

### **Data Security**
- Input validation on all forms
- SQL injection prevention (Sequelize ORM)
- XSS prevention (React automatic escaping)
- CORS configuration
- Environment variables for secrets
- Secure file upload validation

### **File Security**
- File type validation (whitelist)
- File size limits (10MB)
- Cloudinary secure storage
- Signed URLs for sensitive files
- Virus scanning recommended (not implemented)

---

## Performance Optimization

### **Frontend**
- Code splitting with Vite
- Lazy loading of routes
- Image optimization
- Minification and bundling
- CDN delivery via Vercel

### **Backend**
- Connection pooling (PostgreSQL)
- Efficient database queries
- Indexed database columns
- Caching headers
- Compression middleware

### **Database**
- Indexes on foreign keys
- Indexes on frequently queried fields
- JSONB for flexible data
- Connection pooling

---

## Development Tools

### **Code Quality**
- ESLint (JavaScript linting)
- Prettier (Code formatting)
- Git hooks (pre-commit)

### **Development**
- Nodemon (Auto-restart backend)
- Vite HMR (Hot Module Replacement)
- Environment variables (.env files)

### **Testing** (Recommended, not implemented)
- Jest (Unit testing)
- React Testing Library (Component testing)
- Supertest (API testing)
- Cypress (End-to-end testing)

---

## Environment Variables

### **Frontend (.env)**
```
VITE_API_URL=https://intellicare-support-1.onrender.com/api
```

### **Backend (.env)**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=agdlf1rg
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Deployment Process

### **Continuous Deployment**
1. Code pushed to GitHub (main branch)
2. Vercel automatically builds and deploys frontend
3. Render automatically builds and deploys backend
4. Database migrations run automatically (if configured)
5. Environment variables injected from platform

### **Frontend Build**
```bash
npm run build
# Outputs to dist/ directory
# Vercel serves static files
```

### **Backend Deployment**
```bash
npm start
# Runs server.js
# Connects to PostgreSQL
# Listens on PORT from environment
```

---

## System Requirements

### **Production**
- Node.js 18+
- PostgreSQL 14+
- 512MB RAM minimum
- 10GB storage minimum

### **Development**
- Node.js 18+
- PostgreSQL 14+ (or local)
- Git
- Modern web browser

---

## Scalability Considerations

### **Current Setup** (Suitable for)
- Small to medium organizations
- 100-1000 concurrent users
- 1000-10000 tickets/month

### **Scaling Options**
1. **Database**: Upgrade PostgreSQL plan or use replica
2. **Backend**: Add more Render instances with load balancer
3. **Frontend**: Vercel scales automatically with CDN
4. **File Storage**: Cloudinary scales with usage
5. **Caching**: Add Redis for sessions and caching
6. **Queue**: Add job queue (Bull/Redis) for heavy tasks

---

## Cost Breakdown (Approximate)

### **Current Setup**
- Vercel: Free tier (Hobby plan)
- Render: $7-25/month (Starter plan)
- PostgreSQL: $7-15/month (Render database)
- Cloudinary: Free tier (up to 25 GB storage)
- **Total**: ~$15-40/month

### **Production Scale**
- Vercel: $20/month (Pro plan)
- Render: $25-100/month (depends on usage)
- PostgreSQL: $25-200/month (depends on size)
- Cloudinary: $89+/month (depends on usage)
- **Total**: ~$150-400/month

---

## Future Enhancements (Recommendations)

### **Technical**
1. Add automated testing (Jest, Cypress)
2. Implement caching layer (Redis)
3. Add job queue for email notifications
4. Implement full-text search (Elasticsearch)
5. Add monitoring and analytics (Sentry, Google Analytics)
6. Implement rate limiting per user
7. Add database backups and disaster recovery

### **Features**
1. Email notifications (SendGrid/Mailgun)
2. Mobile app (React Native)
3. Advanced reporting and analytics
4. Export data (CSV, PDF reports)
5. Multi-language support (i18n)
6. Dark mode
7. Advanced search and filters
8. Knowledge base integration
9. SLA tracking
10. Customer satisfaction surveys

---

## Documentation & Resources

### **Project Documentation**
- README.md - Project setup instructions
- API documentation (consider Swagger/OpenAPI)
- Database schema documentation
- Deployment guides

### **Learning Resources**
- React: https://react.dev
- Node.js: https://nodejs.org
- Express: https://expressjs.com
- PostgreSQL: https://postgresql.org
- Sequelize: https://sequelize.org
- Socket.IO: https://socket.io

---

## Support & Maintenance

### **Monitoring**
- Application logs via Winston
- Server logs via Render dashboard
- Error tracking (consider Sentry)
- Performance monitoring (consider New Relic)

### **Backup Strategy**
- Database: Automated daily backups (Render)
- Code: GitHub repository
- Files: Cloudinary automatic storage

### **Updates**
- NPM packages updated regularly
- Security patches applied promptly
- Node.js version updated annually
- Database migrations tracked in code

---

## Summary

The IntelliCare Support System is a modern, full-stack web application built with industry-standard technologies:

**Frontend**: React + Vite + Tailwind CSS  
**Backend**: Node.js + Express + PostgreSQL  
**Real-time**: Socket.IO  
**Storage**: Cloudinary  
**Deployment**: Vercel + Render  

The system provides comprehensive ticket management, real-time chat, document viewing, and admin tools for healthcare IT support operations.

**Status**: Production-ready, actively maintained
**License**: MIT (or specify your license)
**Version**: 1.0.0
**Last Updated**: July 29, 2026
