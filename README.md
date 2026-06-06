# VendorBridge ERP

VendorBridge ERP is a modern procurement and vendor management platform designed to streamline the complete procurement lifecycle, from RFQ creation to invoice payment tracking.

## Features

### RFQ Management
- Create and manage Request For Quotations (RFQs)
- Assign RFQs to multiple vendors
- Define procurement items, quantities, and target pricing
- Track RFQ status throughout the procurement process

### Vendor Management
- Maintain supplier database
- Categorize vendors by business domain
- Track vendor performance and ratings
- Manage supplier participation in procurement activities

### Quotation Management
- Vendors can submit competitive quotations
- Compare vendor bids side-by-side
- Evaluate pricing, delivery timelines, and supplier notes
- Support bid revisions and updates

### Approval Workflow
- Multi-stage procurement approval process
- Manager review and approval system
- Approval history tracking
- Automated workflow notifications

### Purchase Orders & Invoices
- Automatic Purchase Order generation after approval
- Invoice generation and management
- Payment tracking system
- Outstanding liability monitoring

### Reporting & Analytics
- Procurement spending analysis
- Category-wise expenditure breakdown
- Vendor performance analytics
- Purchase order and invoice reporting
- Export reports to CSV

### Audit Logs
- Complete procurement activity history
- Approval and workflow tracking
- System-wide audit trail
- User action monitoring

---

## User Roles

### Procurement Officer
- Create RFQs
- Manage procurement requests
- Review vendor responses
- Initiate approval workflows

### Vendor (Supplier)
- View assigned RFQs
- Submit quotations
- Track purchase orders
- Manage invoices

### Approver (Manager)
- Review procurement requests
- Approve or reject quotations
- Monitor procurement activities
- Authorize purchase orders

---

## Technology Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- Node.js
- Express.js

### Database
- MySQL

---

## Workflow

1. Procurement Officer creates RFQ
2. RFQ assigned to vendors
3. Vendors submit quotations
4. Officer compares bids
5. Approval request generated
6. Manager approves procurement
7. Purchase Order created automatically
8. Invoice generated
9. Payment processed
10. Activity logged for auditing

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd vendorbridge
```

### Install Dependencies

```bash
npm install
```

### Configure Database

Update database configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vendorbridge
```

### Run Backend

```bash
npm start
```

### Open Application

```text
http://localhost:5000
```

---

## Project Highlights

- End-to-end procurement lifecycle management
- Multi-role access control
- Automated approval workflows
- Purchase order automation
- Invoice tracking system
- Procurement analytics dashboard
- Vendor performance monitoring
- Audit logging and compliance tracking

---

## Team

Hackathon Project Submission

VendorBridge ERP © 2026
