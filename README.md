# IntelliCare Support - HelpDesk Ticketing System

A modern helpdesk ticketing system built with React and Node.js.

## 🏗️ Project Structure

```
├── client/          # React Frontend (Vite)
└── server/          # Node.js Backend (Express)
```

## 🚀 Tech Stack

### Frontend
- React 18
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- shadcn/ui components

### Backend
- Node.js
- Express.js
- MySQL/MariaDB
- Sequelize ORM
- JWT Authentication
- bcrypt

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MySQL/MariaDB

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd LAN-Based-HelpDesk-Tickting-System-main
```

2. **Install Backend Dependencies**
```bash
cd server
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../client
npm install
```

4. **Configure Environment Variables**

Backend (.env):
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=intellicare_support
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
```

Frontend (.env):
```env
VITE_API_URL=http://localhost:5000/api
```

5. **Setup Database**
```bash
cd server
npm run db:create
npm run db:migrate
```

6. **Run the Application**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:5000

## 📋 Features

- ✅ User Authentication (Login/Register)
- ✅ Role-based Access Control (User/Admin)
- ✅ Dashboard with Statistics
- ✅ Ticket Management (Create, View, Update, Delete)
- ✅ User Management (Admin only)
- ✅ Knowledge Base
- ✅ Real-time Status Updates
- ✅ Responsive Design

## 🔐 Default Admin Account

After running migrations, create an admin account through the register page and manually update the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
```

## 📁 Project Structure Details

### Client (React)
```
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   └── ui/
│   ├── layouts/
│   ├── pages/
│   │   ├── auth/
│   │   ├── admin/
│   │   └── user/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

### Server (Node.js)
```
server/
├── config/
│   └── database.js
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── server.js
└── package.json
```

## 🛠️ Available Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:create` - Create database
- `npm run db:migrate` - Run migrations

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📄 License

MIT

## 👨‍💻 Author

Your Name

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
