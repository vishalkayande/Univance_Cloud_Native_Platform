# 🎓 UniVance

UniVance is a comprehensive academic event management platform designed to streamline event coordination within educational institutions. It provides dedicated interfaces for Students, Organizers, and Administrators to manage everything from event discovery to registration and certificates.

## 🚀 Key Features

### 👨‍🎓 Student Features
- **Event Discovery**: Browse events by level (Department, Institute, Club).
- **Smart Sorting**: Events are prioritized by status (Live > Registered > Completed > Closed).
- **Registration System**: One-click enrollment with confirmation popups.
- **Flexibility**: Ability to unregister from events before deadlines.
- **Leaderboards**: View winners and rankings for completed events.
- **Complete Profiles**: Add branch, year, roll number, and mobile number for a professional profile.

### 🏢 Organizer Features
- **Unified Dashboard**: Admin-style home page with specialized tools.
- **Event Management**: Create and manage events with detailed information.
- **Participant Visibility**: Real-time tracking of student registrations.
- **Status Control**: Automatic event lifecycle management (Live/Closed).
- **Account Approval**: Organizer accounts require admin approval before use.

### 🔑 Admin Features
- **Global Oversight**: Command center for all campus activities and users.
- **Transparency**: Detailed event cards showing creation dates, deadlines, and organizer info.
- **Approval System**: Manage and approve organizer account requests.
- **Data Export**: Download registration lists in CSV format for offline processing.
- **Full Control**: Ability to moderate events and users across all colleges.

### 🔐 Security & Account Features
- **Robust Authentication**: JWT-based secure login system.
- **OTP Password Reset**: 6-digit OTP verification system via Brevo SMTP.
- **Strong Password Policy**: Enforced complexity requirements (8+ chars, Uppercase, Lowercase, Number, Special Symbol).
- **Input Validation**: Real-time feedback for better user experience.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide React, Framer Motion
- **Backend**: Node.js, Express.js, Nodemailer
- **Email Service**: Brevo (formerly Sendinblue) SMTP
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io for instant updates
- **Auth**: JSON Web Tokens (JWT) & Bcryptjs
- **Containerization**: Docker & Docker Compose

---

## 🏁 Getting Started

### 🐋 Method 1: Docker (Fastest & Recommended)
1.  **Install Docker Desktop** (https://www.docker.com/get-started).
2.  **Create a `.env` file** in the root directory (use the template below).
3.  **Run the application**:
    ```bash
    docker-compose up --build
    ```
4.  **Access the application**: Open `http://localhost` in your browser.

---

### 🛠️ Method 2: Manual Setup (Local Development)

#### 1. Clone the Repository
```bash
git clone <your-github-repo-url>
cd UniVance
```

#### 2. Backend Setup
1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file in the `backend` folder (use the template below).
3. Start the backend server:
   ```bash
   npm run dev
   ```

#### 3. Frontend Setup
1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the frontend development server:
   ```bash
   npm run dev
   ```
3. Access the application at the URL shown in the terminal (usually http://localhost:3000 or http://localhost:3001).

---

## ⚙️ Environment Variables

### Root .env (for Docker)
Create a `.env` file in the root directory:
```env
PORT=5002
MONGODB_URI=mongodb://mongodb:27017/univance
JWT_SECRET=your_secure_random_jwt_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_smtp_user
SMTP_PASS=your_brevo_smtp_password
FROM_NAME=UniVance
FROM_EMAIL=your_verified_sender_email@example.com
```

### Backend .env (for Local Development)
Create a `.env` file in the `backend` directory:
```env
PORT=5003
MONGODB_URI=mongodb://localhost:27017/univance
JWT_SECRET=your_secure_random_jwt_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_smtp_user
SMTP_PASS=your_brevo_smtp_password
FROM_NAME=UniVance
FROM_EMAIL=your_verified_sender_email@example.com
```

---

## 📧 Setting Up Brevo SMTP for OTP Emails
1. Go to Brevo.com (https://www.brevo.com/) and sign up for a free account.
2. Verify your email address.
3. Go to **Settings** → **SMTP & API**.
4. Under the **SMTP** tab:
   - Copy your **SMTP User** (login)
   - Click **Generate a new SMTP key** to create your **SMTP Password**
5. Go to **Senders** → **Domains & Senders** and add/verify a sender email (this will be your FROM_EMAIL).
6. Add your **public IP address** (for local development) or **EC2 public IP** (for deployment) to Brevo's authorized IP list (from the note on the SMTP & API page).
7. Update your .env file with these Brevo credentials!

---

## 🚢 Deployment Steps

### AWS EC2 Deployment (Docker)
For a detailed, step-by-step guide, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

Quick Steps:
1. Launch an EC2 instance (Ubuntu 24.04 LTS, t2.micro or larger).
2. Connect to your EC2 instance via SSH.
3. Install Docker and Docker Compose.
4. Clone this repository to your EC2 instance.
5. Create a root .env file with production values.
6. Run:
   ```bash
   sudo docker-compose up -d --build
   ```
7. Update your EC2 security group to allow inbound HTTP (port 80) traffic.
8. Access your application at your EC2 public IP address!

---
## Screenshots:
<img width="1919" height="1138" alt="Screenshot 2026-06-05 134814" src="https://github.com/user-attachments/assets/33306e65-c301-4dbf-b0bd-f7c30a31fb25" />
<img width="1919" height="1088" alt="Screenshot 2026-06-05 135140" src="https://github.com/user-attachments/assets/e62ff2f4-a36e-4f2a-803b-635940e9400e" />
<img width="1919" height="1094" alt="Screenshot 2026-06-05 135219" src="https://github.com/user-attachments/assets/581b01d0-0ffe-41d7-9063-3e471ce44c6c" />
<img width="1917" height="1040" alt="Screenshot 2026-06-05 135259" src="https://github.com/user-attachments/assets/d959085f-344d-47e4-b6c2-acd540e378ab" />
<img width="1919" height="1049" alt="Screenshot 2026-06-05 135319" src="https://github.com/user-attachments/assets/f59a085d-8301-438f-9b80-0f16205b475d" />


## 📜 License
This project is licensed under the ISC License.
