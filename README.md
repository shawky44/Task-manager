# 📌 Task Manager API  

## 📖 Overview  
Task Manager is a **Node.js + Express + MongoDB** based project for managing tasks with authentication, authorization, file uploads, email notifications, dashboards, and reports.  

---

## 🚀 Features  
- 📝 CRUD operations for tasks  
- 👤 User authentication with JWT and email verification  
- 🔐 Role-based authorization (Admin / User)  
- 📊 Dashboard analytics  
- 📧 Email notifications for account activation  
- 📂 File uploads using Multer  
- 📑 Export tasks and users to Excel (ExcelJS)  

---

## 🛠 Tech Stack  
- **Backend:** Node.js, Express  
- **Database:** MongoDB + Mongoose  
- **Authentication:** JWT, Bcrypt  
- **Utilities:** Multer, Nodemailer, ExcelJS  

---

## ⚙️ Installation  

```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
npm install
```

---

## 🔑 Environment Variables  

Create a `.env` file in the project root:  

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=yourjwtsecret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

---

## ▶️ Run the Project  

```bash
npm run dev
```
---
## 📂 Project Structure
.
├── backend
│   ├── controllers
│   │   ├── authController.js       
│   │   ├── reportController.js     
│   │   ├── taskController.js       
│   │   └── userController.js        
│   │
│   ├── middlewares
│   │   ├── authMiddleware.js        # Auth middleware (JWT validation, etc.)
│   │   ├── identification.js        # Custom identification logic
│   │   ├── sendMail.js              # Utility for sending emails
│   │   ├── uploadMiddleware.js      # File upload handling (Multer, etc.)
│   │   └── validator.js             # Request validation middleware
│   │
│   ├── models
│   │   ├── Task.js                  # Task schema/model
│   │   └── User.js                  # User schema/model
│   │
│   ├── routes
│   │   ├── authRoutes.js            # Auth routes (login, register, etc.)
│   │   ├── reportRoutes.js          # Routes for generating/exporting reports
│   │   ├── taskRoutes.js            # Routes for task management
│   │   └── userRoutes.js            # Routes for user management
│   │
│   ├── uploads                      # Uploaded files (images, etc.)
│   │   └── ... 
│   │
│   └── Utils
│       └── hashing.js               # Password hashing utility
│
├── .env                             # Environment variables
├── package.json                     # Project metadata & dependencies
├── package-lock.json                # Dependency lock file
├── server.js                        # Main server entry point
└── README.md                        # Documentation

---

## 📡 API Documentation  

### 1️⃣ Auth Routes  

#### Register  
**POST** `/api/auth/register`  

**Request:**  
```json
{
  "name": "Shawky",
  "email": "shawky@example.com",
  "password": "123456"
}
```

**Response:**  
```json
{
  "message": "User registered successfully, please check your email to verify."
}
```

---

#### Login  
**POST** `/api/auth/login`  

**Request:**  
```json
{
  "email": "shawky@example.com",
  "password": "123456"
}
```

**Response:**  
```json
{
  "token": "jwt_token_here"
}
```

---

### 2️⃣ Task Routes  

#### Get All Tasks  
**GET** `/api/tasks`  

Headers:  
`Authorization: Bearer <jwt_token>`  

**Response:**  
```json
[
  {
    "_id": "651234abc",
    "title": "Finish backend",
    "description": "Write controllers",
    "priority": "High",
    "status": "Pending",
    "dueDate": "2025-09-30",
    "assignedTo": [
      {
        "_id": "123",
        "name": "Shawky"
      }
    ]
  }
]
```

---

#### Create Task  
**POST** `/api/tasks`  

**Request:**  
```json
{
  "title": "Study Node.js",
  "description": "Finish course",
  "priority": "Medium",
  "dueDate": "2025-10-01"
}
```

**Response:**  
```json
{
  "message": "Task created successfully",
  "task": {
    "_id": "65abc123",
    "title": "Study Node.js",
    "status": "Pending"
  }
}
```

---

#### Update Task  
**PUT** `/api/tasks/:id`  

**Request:**  
```json
{
  "status": "In Progress"
}
```

**Response:**  
```json
{
  "message": "Task updated successfully"
}
```

---

#### Delete Task  
**DELETE** `/api/tasks/:id`  

**Response:**  
```json
{
  "message": "Task deleted successfully"
}
```

---

### 3️⃣ Reports  

#### Export Tasks to Excel  
**GET** `/api/reports/export/tasks`  
📤 Returns an `.xlsx` file with all tasks.  

#### Export Users to Excel  
**GET** `/api/reports/export/users`  
📤 Returns an `.xlsx` file with all users and task stats.  

---

### 4️⃣ Dashboard  

#### Get User Dashboard Data  
**GET** `/api/dashboard/user/:id`  

**Response:**  
```json
{
  "totalTasks": 15,
  "pending": 5,
  "inProgress": 7,
  "completed": 3
}
```

---

## 🧪 Testing  
- Use **Postman** for API testing.  
- Import the provided Postman Collection (`Task Manager APIs.postman_collection.json`).  
- Share the collection file with teammates so they can test the same routes.  

---

## 🚀 Future Improvements  
- Real-time notifications with Socket.io  
- Export reports to PDF  
- Advanced filtering and search for tasks

---

- ## 👨‍💻 Author

Created by **Shawky ✨**

## 📜 License

This project is licensed under the **MIT License**.

