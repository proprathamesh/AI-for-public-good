# AI Co-Pilot for MSME Inventory Management 🚀

An intelligent dashboard and inventory management system designed to automate manual stock entry and provide actionable business insights. Built to solve the real-world operational bottlenecks faced by small and medium enterprises, this platform features an AI-powered scanner to instantly log complex incoming shipments—like bulk decorative brass lights—eliminating the need for tedious spreadsheet updates.

---

## 🌟 Key Features

*   **AI-Powered Inventory Scanner:** Automates stock entry by intelligently extracting product details from shipment logs or manifests using the Gemini API.
*   **Live Operations Dashboard:** Provides real-time visibility into stock levels, pending orders, and potential stock-outs.
*   **Custom Authentication:** Secure, lightweight user access handled entirely through robust custom session management.
*   **Cross-Origin Ready:** Fully configured to seamlessly bridge serverless frontend deployments with dedicated backend environments.

---

## 💻 Tech Stack

*   **Frontend:** Vercel (Serverless UI)
*   **Backend:** Node.js & Express (Deployed on Render)
*   **Database:** MongoDB 
*   **Authentication:** Custom Session Management
*   **AI Integration:** Google Gemini API 

---

## 🔐 Test Account Credentials

To evaluate the live dashboard and features, please use the following test credentials:

*   **Email:** `abc@gmail.com`
*   **Password:** `123456789`

---

## 🛠️ Local Setup & Installation

Follow these steps to run the project on your local machine.

### 1. Clone the Repository
Run the standard git clone command for this repository and navigate into the project folder.

### 2. Backend Configuration
Navigate to the `Backend` directory and install the required dependencies.
`npm install`

Create a `.env` file in the root of the `Backend` directory and add the following variables:
*   `MONGO_URI` = Your MongoDB connection string
*   `GEMINI_API_KEY` = Your Google Gemini API key
*   `PORT` = 8080 (or your preferred local port)

Start the backend development server:
`npm run dev`

### 3. Frontend Configuration
Navigate to your frontend directory and install the required dependencies.
`npm install`

Create a `.env` file in the frontend directory and add your backend API URL:
*   `VITE_API_BASE_URL` = `http://localhost:8080` (or your chosen backend port)

Start the frontend development server:
`npm run dev`

---

## 🚀 Deployment Architecture

This project utilizes a split-deployment architecture for maximum stability and performance:
*   **Frontend Edge Delivery:** Hosted on Vercel for lightning-fast, globally distributed static asset delivery.
*   **Backend Web Service:** Hosted on Render using a native Node.js runtime to ensure stable, long-lived API processes and uninterrupted AI integrations.
