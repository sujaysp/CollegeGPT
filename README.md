🎓 CollegeGPT

An AI-powered college assistant designed to help students interact with academic information through conversational AI, document uploads, and personalized chat history.












📌 Overview

CollegeGPT is a full-stack AI-powered college assistant built to provide students with an interactive conversational interface for asking questions and accessing academic information.

The application combines a modern Next.js frontend, a Node.js/Express backend, MongoDB Atlas for persistent storage, and Groq-powered AI responses.

Users can create an account, sign in using email/password or Google, start conversations with the AI assistant, manage previous conversations, upload PDF documents, and interact with their uploaded academic content.

The project is designed with a modular backend architecture and a production deployment workflow using GitHub, Render, and Vercel.

✨ Features
🔐 Authentication
User registration and login
Secure password hashing using bcryptjs
JWT-based authentication
Google Sign-In integration
Forgot password functionality
Protected API routes
Persistent authentication on the frontend
💬 AI Chat
Conversational AI interface
AI-powered responses using Groq
Real-time-style response generation
Markdown and GitHub-Flavored Markdown support
Regenerate AI responses
Stop response generation
Copy messages
Edit user messages
Conversation persistence
🗂️ Conversation Management
Automatically saved conversations
Recent chats displayed in the sidebar
Open previous conversations
Rename conversations
Delete conversations
Start a new conversation
📄 PDF Documents
Upload PDF documents
Store uploaded documents
Display uploaded documents in the application
Open uploaded PDFs
Delete uploaded documents
Backend support for processing uploaded PDF content
🎨 User Interface
Modern dark-themed interface
ChatGPT-inspired conversational layout
Responsive design
Sidebar navigation
Welcome screen
AI suggestion cards
Chat status indicators
Custom modal interactions
Mobile-friendly layout
🚀 Production Deployment
Frontend deployed on Vercel
Backend deployed on Render
Database hosted on MongoDB Atlas
Source code managed with Git/GitHub
Production CORS configuration
Environment-based configuration
🏗️ Tech Stack
Frontend
Technology	Purpose
Next.js	React-based frontend framework
React	UI development
JavaScript	Application logic
CSS	Styling and responsive UI
React Markdown	Rendering AI responses
remark-gfm	GitHub-Flavored Markdown
Backend
Technology	Purpose
Node.js	JavaScript runtime
Express.js	REST API framework
MongoDB	Database
Mongoose	MongoDB object modeling
JWT	Authentication
bcryptjs	Password hashing
Groq	AI inference
Google Auth Library	Google authentication
Multer	File uploads
pdf-parse	PDF text extraction
CORS	Cross-origin request handling
dotenv	Environment configuration
Deployment
Platform	Usage
Vercel	Frontend deployment
Render	Backend deployment
MongoDB Atlas	Cloud database
GitHub	Source control
🧠 System Architecture
                        ┌──────────────────────┐
                        │       User           │
                        │   Web Browser        │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │      Next.js         │
                        │      Frontend        │
                        │       Vercel         │
                        └──────────┬───────────┘
                                   │
                     REST API / JWT Authentication
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │    Express.js API    │
                        │       Render         │
                        └──────────┬───────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
       ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
       │   MongoDB      │ │     Groq       │ │  PDF Processing│
       │     Atlas      │ │   AI Service   │ │   Multer +     │
       │                │ │                │ │   pdf-parse    │
       └────────────────┘ └────────────────┘ └────────────────┘
📁 Project Structure
CollegeGPT/
│
├── backend/
│   │
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   │
│   │   ├── controllers/
│   │   │
│   │   ├── middleware/
│   │   │
│   │   ├── models/
│   │   │
│   │   ├── routes/
│   │   │
│   │   ├── services/
│   │   │
│   │   ├── utils/
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── frontend/
│   │
│   ├── components/
│   ├── pages/
│   ├── public/
│   ├── styles/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md

The project follows a modular backend structure separating routes, controllers, models, middleware, services, configuration, and utilities.

🔑 Authentication Flow

CollegeGPT supports both traditional authentication and Google authentication.

Email / Password
User
  │
  ▼
Registration
  │
  ▼
Password hashed with bcryptjs
  │
  ▼
MongoDB
  │
  ▼
Login
  │
  ▼
JWT generated
  │
  ▼
Frontend stores authentication token
Google Authentication
User
  │
  ▼
Google Sign-In
  │
  ▼
Google Identity Services
  │
  ▼
Google credential
  │
  ▼
CollegeGPT Backend
  │
  ▼
Google token verification
  │
  ▼
Find/Create user in MongoDB
  │
  ▼
JWT generated
  │
  ▼
Authenticated user
💬 AI Chat Flow
User enters question
        │
        ▼
Next.js Frontend
        │
        ▼
POST /api/chat/message
        │
        ▼
JWT Authentication
        │
        ▼
Express Controller
        │
        ▼
Conversation retrieved/created
        │
        ▼
Groq AI
        │
        ▼
AI Response
        │
        ▼
Conversation saved in MongoDB
        │
        ▼
Response returned to frontend
        │
        ▼
Rendered as Markdown
📄 PDF Processing Flow
User selects PDF
        │
        ▼
Frontend
        │
        ▼
Multipart Form Upload
        │
        ▼
Multer
        │
        ▼
PDF Processing
        │
        ▼
Text Extraction
        │
        ▼
Document stored in MongoDB
        │
        ▼
Available inside CollegeGPT
🔌 API Overview
Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
Chat
POST /api/chat/message
POST /api/chat/regenerate
Conversations
GET    /api/conversations
GET    /api/conversations/:id
PATCH  /api/conversations/:id
DELETE /api/conversations/:id
Documents
POST   /api/documents
GET    /api/documents
DELETE /api/documents/:id
Health
GET /api/health
🛡️ Security

The application implements several security practices:

Passwords are hashed using bcryptjs
JWT tokens are used for authenticated API requests
Protected backend routes use authentication middleware
Google credentials are verified server-side
Environment variables are used for sensitive configuration
Production CORS restricts requests to approved frontend origins
Secrets are excluded from version control using .gitignore
Environment Variables

Backend:

MONGO_URI=
JWT_SECRET=
GROQ_API_KEY=
GOOGLE_CLIENT_ID=

Frontend:

NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

Never commit .env files or API keys to GitHub.

🚀 Running Locally
1. Clone the repository
git clone https://github.com/sujaysp/CollegeGPT.git
cd CollegeGPT
2. Backend Setup
cd backend
npm install

Create a .env file:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=your_google_client_id

Start the backend:

npm start

Backend runs on:

http://localhost:5000
3. Frontend Setup

Open another terminal:

cd frontend
npm install

Create the frontend environment file:

NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

Start the frontend:

npm run dev

Frontend runs on:

http://localhost:3000
🌐 Live Application
Production Frontend

👉 https://collegegpt-ai.vercel.app

Backend API

👉 https://collegegpt-backend-xurq.onrender.com

📸 Screenshots

You can add screenshots of the application here.

For example:

screenshots/
├── login.png
├── dashboard.png
├── chat.png
├── conversations.png
└── documents.png

Then reference them:

## Screenshots

### Login

![CollegeGPT Login](screenshots/login.png)

### AI Chat

![CollegeGPT Chat](screenshots/chat.png)

### Documents

![CollegeGPT Documents](screenshots/documents.png)
🧪 Testing

The production deployment was tested for:

User registration
User login
Google authentication
JWT authentication
AI chat requests
Conversation persistence
Conversation management
PDF upload
PDF management
Production frontend/backend communication
CORS preflight requests

Production CORS was specifically verified using an OPTIONS request from the Vercel production origin.

📈 Future Improvements

Potential future improvements include:

Retrieval-Augmented Generation (RAG) improvements
Semantic document search
Vector database integration
Better contextual document questioning
Streaming AI responses
Conversation search
User profile management
Improved PDF preview
Rate limiting
Advanced API validation
Automated testing
CI/CD pipelines
Analytics and usage monitoring
🎯 Project Goals

CollegeGPT was built to demonstrate the practical implementation of:

Full-stack web development
REST API architecture
Authentication and authorization
Database design
AI API integration
File upload and document processing
State management
Cloud deployment
Production CORS configuration
Git/GitHub workflow
👨‍💻 Author

Sujay

Built as a full-stack AI application combining modern web technologies with generative AI.

⭐ Support

If you found this project useful or interesting, consider giving the repository a ⭐ on GitHub.

📄 License

This project is intended for educational and portfolio purposes.
