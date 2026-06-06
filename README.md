# VendorBridge ERP - Procurement & Vendor Management System

VendorBridge is a comprehensive ERP solution designed for efficient procurement workflows, vendor management, and automated financial documentation.

## 🚀 Features

- **Vendor Management**: Onboard suppliers, track ratings, and manage categories.
- **RFQ Workflow**: Create and publish Requests for Quotations to targeted vendors.
- **Bid Comparison**: Compare supplier bids based on price, delivery time, and notes.
- **Approval Engine**: Multi-role approval workflow for budget authorization.
- **Automated Financials**: Auto-generation of Purchase Orders (POs) and Invoices.
- **Audit Logs**: Chronological tracking of all system activities.
- **Role-Based Access**: Specialized interfaces for Officers, Managers, and Vendors.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (SPA architecture).
- **Backend**: Node.js, Express.js.
- **Database**: MySQL.
- **Authentication**: JWT (JSON Web Tokens).
- **Deployment**: Docker & Docker Compose.

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL Server
- Docker (Optional, for containerized setup)

### Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/odoo-hackathon.git
   cd odoo-hackathon
   ```

2. **Backend Configuration**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=vendorbridge
   PORT=5000
   JWT_SECRET=your_secret_key
   ```

3. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

4. **Seed the Database**:
   ```bash
   node seed.js
   ```

5. **Start the Server**:
   ```bash
   npm start
   ```

6. **Access the App**:
   Open your browser and navigate to `http://localhost:5000`

### 🐳 Running with Docker

1. **Start the containers**:
   ```bash
   docker-compose up --build
   ```

2. **Access the App**:
   The application will be available at `http://localhost:5000`

## 🧪 Testing

To verify the API endpoints, ensure the server is running and execute:
```bash
node backend/tests/api_test.js
```

## 👥 User Roles (Sample Credentials)

| Role | Email | Password |
|------|-------|----------|
| Procurement Officer | officer@vendorbridge.com | password |
| Finance Manager | manager@vendorbridge.com | password |
| System Admin | admin@vendorbridge.com | password |
| Vendor | vendor1@supplier.com | password |

## 📄 License

This project is licensed under the ISC License.
