const db = require("./config/db");
const { hashPassword } = require("./utils/auth");

const SEED_DATA = {
  users: [
    { email: "officer@vendorbridge.com", password: "password", role: "procurement_officer", name: "Rohan Sharma", title: "Procurement Officer" },
    { email: "manager@vendorbridge.com", password: "password", role: "manager", name: "Ananya Iyer", title: "Finance Manager" },
    { email: "admin@vendorbridge.com", password: "password", role: "admin", name: "Vikram Malhotra", title: "System Administrator" },
    { email: "vendor1@supplier.com", password: "password", role: "vendor", name: "Suresh Gupta", title: "EcoSupplies Ltd" },
    { email: "vendor2@supplier.com", password: "password", role: "vendor", name: "Rajesh Patel", title: "PrimeBuilders Ltd" },
    { email: "vendor3@supplier.com", password: "password", role: "vendor", name: "David Miller", title: "TechCorp Inc" }
  ],
  vendors: [
    { id: "eco-supplies", name: "EcoSupplies Ltd", category: "Stationery & Office", email: "vendor1@supplier.com", contact: "+91 98765 43210", address: "Sector 15, Noida, UP", gst: "09AAAAA1111A1Z1", rating: 4.8, status: "Active", country: "India" },
    { id: "prime-builders", name: "PrimeBuilders Ltd", category: "Infrastructure & Furnishing", email: "vendor2@supplier.com", contact: "+91 87654 32109", address: "MG Road, Bengaluru, Karnataka", gst: "29BBBBB2222B1Z2", rating: 4.5, status: "Active", country: "India" },
    { id: "tech-corp", name: "TechCorp Inc", category: "IT & Hardware", email: "vendor3@supplier.com", contact: "+91 76543 21098", address: "Hitec City, Hyderabad, Telangana", gst: "36CCCCC3333C1Z3", rating: 4.9, status: "Active", country: "India" },
    { id: "alpha-logistics", name: "AlphaLogistics Ltd", category: "Logistics", email: "vendor4@supplier.com", contact: "+91 65432 10987", address: "GIDC, Ahmedabad, Gujarat", gst: "24DDDDD4444D1Z4", rating: 4.2, status: "Pending Approval", country: "India" }
  ],
  rfqs: [
    {
      id: "RFQ-2026-001",
      title: "Office Furniture Procurement",
      description: "Provide executive desks and ergonomic chairs for the new corporate branch.",
      dateCreated: "2026-06-01",
      deadline: "2026-06-12",
      status: "Bidding Open",
      items: [
        { name: "Ergonomic Office Chairs", qty: 25, unit: "pcs", targetPrice: 150 },
        { name: "Executive Desks (Solid Wood)", qty: 10, unit: "pcs", targetPrice: 400 }
      ],
      assignedVendors: ["eco-supplies", "prime-builders"]
    },
    {
      id: "RFQ-2026-002",
      title: "Laptops for Engineering Team",
      description: "Developer laptops with 32GB RAM, 1TB SSD, and latest Intel/AMD processor.",
      dateCreated: "2026-06-03",
      deadline: "2026-06-15",
      status: "Bidding Open",
      items: [
        { name: "Developer Laptops (16-inch)", qty: 15, unit: "pcs", targetPrice: 1300 }
      ],
      assignedVendors: ["tech-corp"]
    },
    {
      id: "RFQ-2026-003",
      title: "Eco-Friendly Delivery Packaging",
      description: "Recyclable cardboard shipping boxes with custom brand logo printing.",
      dateCreated: "2026-05-10",
      deadline: "2026-05-20",
      status: "Approved",
      items: [
        { name: "Logo Branded Shipping Boxes (M)", qty: 1000, unit: "pcs", targetPrice: 1.5 }
      ],
      assignedVendors: ["eco-supplies"]
    }
  ],
  quotations: [
    {
      id: "QT-2026-001",
      rfqId: "RFQ-2026-001",
      vendorId: "eco-supplies",
      vendorName: "EcoSupplies Ltd",
      items: [
        { name: "Ergonomic Office Chairs", qty: 25, price: 180 },
        { name: "Executive Desks (Solid Wood)", qty: 10, price: 420 }
      ],
      deliveryDays: 7,
      subtotal: 8700,
      gst: 1566,
      total: 10266,
      notes: "Executive desks are constructed from premium walnut wood. Offers an additional 1-year product warranty.",
      status: "Submitted",
      dateSubmitted: "2026-06-02"
    },
    {
      id: "QT-2026-002",
      rfqId: "RFQ-2026-001",
      vendorId: "prime-builders",
      vendorName: "PrimeBuilders Ltd",
      items: [
        { name: "Ergonomic Office Chairs", qty: 25, price: 160 },
        { name: "Executive Desks (Solid Wood)", qty: 10, price: 450 }
      ],
      deliveryDays: 10,
      subtotal: 8500,
      gst: 1530,
      total: 10030,
      notes: "Heavy-duty steel-frame ergonomic chairs. Extended 3-year warranty included on structures.",
      status: "Submitted",
      dateSubmitted: "2026-06-03"
    },
    {
      id: "QT-2026-003",
      rfqId: "RFQ-2026-002",
      vendorId: "tech-corp",
      vendorName: "TechCorp Inc",
      items: [
        { name: "Developer Laptops (16-inch)", qty: 15, price: 1250 }
      ],
      deliveryDays: 5,
      subtotal: 18750,
      gst: 3375,
      total: 22125,
      notes: "Includes premium onsite support. Free tech-bundle carrying cases included.",
      status: "Submitted",
      dateSubmitted: "2026-06-04"
    },
    {
      id: "QT-2026-004",
      rfqId: "RFQ-2026-003",
      vendorId: "eco-supplies",
      vendorName: "EcoSupplies Ltd",
      items: [
        { name: "Logo Branded Shipping Boxes (M)", qty: 1000, price: 1.2 }
      ],
      deliveryDays: 4,
      subtotal: 1200,
      gst: 216,
      total: 1416,
      notes: "Recycled biodegradable material.",
      status: "Approved",
      dateSubmitted: "2026-05-12"
    }
  ],
  approvals: [
    {
      id: "APP-2026-001",
      rfqId: "RFQ-2026-003",
      rfqTitle: "Eco-Friendly Delivery Packaging",
      quotationId: "QT-2026-004",
      vendorName: "EcoSupplies Ltd",
      amount: 1416,
      status: "Approved",
      requestedBy: "Rohan Sharma",
      approvedBy: "Ananya Iyer",
      dateRequested: "2026-05-13",
      dateApproved: "2026-05-14",
      remarks: "Price is well within target margins. Delivery timeline of 4 days is acceptable.",
      history: [
        { status: "Pending Review", user: "Rohan Sharma", date: "2026-05-13", remarks: "Submitting EcoSupplies quote for approval." },
        { status: "Approved", user: "Ananya Iyer", date: "2026-05-14", remarks: "Price is well within target margins. Delivery timeline of 4 days is acceptable." }
      ]
    }
  ],
  purchaseOrders: [
    {
      id: "PO-2026-001",
      approvalId: "APP-2026-001",
      rfqId: "RFQ-2026-003",
      quotationId: "QT-2026-004",
      vendorId: "eco-supplies",
      vendorName: "EcoSupplies Ltd",
      dateGenerated: "2026-05-15",
      status: "Completed",
      items: [
        { name: "Logo Branded Shipping Boxes (M)", qty: 1000, price: 1.2 }
      ],
      subtotal: 1200,
      gst: 216,
      total: 1416
    }
  ],
  invoices: [
    {
      id: "INV-2026-001",
      poId: "PO-2026-001",
      vendorId: "eco-supplies",
      vendorName: "EcoSupplies Ltd",
      dateGenerated: "2026-05-16",
      dueDate: "2026-06-16",
      status: "Paid",
      items: [
        { name: "Logo Branded Shipping Boxes (M)", qty: 1000, price: 1.2 }
      ],
      subtotal: 1200,
      gst: 216,
      total: 1416,
      notes: "Payment cleared via Corporate Bank Transfer. Receipt #TXN-9021482."
    }
  ],
  activityLogs: [
    { id: 1, type: "system", user: "Vikram Malhotra", action: "Seeded initial ERP master records", timestamp: "2026-05-09T09:00:00Z" },
    { id: 2, type: "rfq", user: "Rohan Sharma", action: "Created RFQ-2026-003: Eco-Friendly Delivery Packaging", timestamp: "2026-05-10T10:30:00Z" },
    { id: 3, type: "quotation", user: "Suresh Gupta (EcoSupplies Ltd)", action: "Submitted QT-2026-004 for RFQ-2026-003", timestamp: "2026-05-12T14:15:00Z" },
    { id: 4, type: "approval", user: "Rohan Sharma", action: "Initiated approval workflow for QT-2026-004", timestamp: "2026-05-13T11:00:00Z" },
    { id: 5, type: "approval", user: "Ananya Iyer", action: "Approved quotation QT-2026-004 (EcoSupplies Ltd)", timestamp: "2026-05-14T16:45:00Z" },
    { id: 6, type: "po", user: "Rohan Sharma", action: "Generated PO-2026-001 from Approved Quote QT-2026-004", timestamp: "2026-05-15T10:00:00Z" },
    { id: 7, type: "invoice", user: "Suresh Gupta (EcoSupplies Ltd)", action: "Generated INV-2026-001 linked to PO-2026-001", timestamp: "2026-05-16T11:30:00Z" },
    { id: 8, type: "invoice", user: "Ananya Iyer", action: "Marked INV-2026-001 as Paid", timestamp: "2026-05-25T15:20:00Z" },
    { id: 9, type: "rfq", user: "Rohan Sharma", action: "Created RFQ-2026-001: Office Furniture Procurement", timestamp: "2026-06-01T11:20:00Z" },
    { id: 10, type: "quotation", user: "Suresh Gupta (EcoSupplies Ltd)", action: "Submitted QT-2026-001 for RFQ-2026-001", timestamp: "2026-06-02T13:40:00Z" },
    { id: 11, type: "rfq", user: "Rohan Sharma", action: "Created RFQ-2026-002: Laptops for Engineering Team", timestamp: "2026-06-03T09:15:00Z" },
    { id: 12, type: "quotation", user: "Rajesh Patel (PrimeBuilders Ltd)", action: "Submitted QT-2026-002 for RFQ-2026-001", timestamp: "2026-06-03T16:00:00Z" },
    { id: 13, type: "quotation", user: "David Miller (TechCorp Inc)", action: "Submitted QT-2026-003 for RFQ-2026-002", timestamp: "2026-06-04T10:10:00Z" }
  ]
};

const seed = async () => {
  try {
    // We'll use a transaction for safety if possible, or just truncate tables
    console.log("Resetting database...");
    
    // Disable foreign key checks for truncation
    await db.promise().query("SET FOREIGN_KEY_CHECKS = 0");
    
    const tables = [
      "invoice_items", "invoices", 
      "po_items", "purchase_orders", 
      "approvals", 
      "quotation_items", "quotations", 
      "rfq_items", "rfq_assigned_vendors", "rfqs", 
      "vendors", "users", "activity_logs"
    ];

    for (const table of tables) {
      await db.promise().query(`TRUNCATE TABLE ${table}`);
    }

    await db.promise().query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Seeding users...");
    for (const user of SEED_DATA.users) {
      const hashedPassword = hashPassword(user.password);
      await db.promise().query(
        "INSERT INTO users (email, password, role, name, title) VALUES (?, ?, ?, ?, ?)",
        [user.email, hashedPassword, user.role, user.name, user.title]
      );
    }

    console.log("Seeding vendors...");
    for (const vendor of SEED_DATA.vendors) {
      await db.promise().query(
        "INSERT INTO vendors (id, name, category, email, contact, address, gst, rating, status, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [vendor.id, vendor.name, vendor.category, vendor.email, vendor.contact, vendor.address, vendor.gst, vendor.rating, vendor.status, vendor.country]
      );
    }

    console.log("Seeding RFQs...");
    for (const rfq of SEED_DATA.rfqs) {
      await db.promise().query(
        "INSERT INTO rfqs (id, title, description, date_created, deadline, status) VALUES (?, ?, ?, ?, ?, ?)",
        [rfq.id, rfq.title, rfq.description, rfq.dateCreated, rfq.deadline, rfq.status]
      );

      for (const item of rfq.items) {
        await db.promise().query(
          "INSERT INTO rfq_items (rfq_id, item_name, quantity, unit, target_price) VALUES (?, ?, ?, ?, ?)",
          [rfq.id, item.name, item.qty, item.unit, item.targetPrice]
        );
      }

      for (const vendorId of rfq.assignedVendors) {
        await db.promise().query(
          "INSERT INTO rfq_assigned_vendors (rfq_id, vendor_id) VALUES (?, ?)",
          [rfq.id, vendorId]
        );
      }
    }

    console.log("Seeding quotations...");
    for (const quote of SEED_DATA.quotations) {
      await db.promise().query(
        "INSERT INTO quotations (id, rfq_id, vendor_id, vendor_name, delivery_days, subtotal, gst, total, notes, status, date_submitted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [quote.id, quote.rfqId, quote.vendorId, quote.vendorName, quote.deliveryDays, quote.subtotal, quote.gst, quote.total, quote.notes, quote.status, quote.dateSubmitted]
      );

      for (const item of quote.items) {
        await db.promise().query(
          "INSERT INTO quotation_items (quotation_id, item_name, quantity, price) VALUES (?, ?, ?, ?)",
          [quote.id, item.name, item.qty, item.price]
        );
      }
    }

    console.log("Seeding approvals...");
    for (const appr of SEED_DATA.approvals) {
      await db.promise().query(
        "INSERT INTO approvals (id, rfq_id, rfq_title, quotation_id, vendor_name, amount, status, requested_by, approved_by, date_requested, date_approved, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [appr.id, appr.rfqId, appr.rfqTitle, appr.quotationId, appr.vendorName, appr.amount, appr.status, appr.requestedBy, appr.approvedBy, appr.dateRequested, appr.dateApproved, appr.remarks]
      );
    }

    console.log("Seeding purchase orders...");
    for (const po of SEED_DATA.purchaseOrders) {
      await db.promise().query(
        "INSERT INTO purchase_orders (id, approval_id, rfq_id, quotation_id, vendor_id, vendor_name, date_generated, status, subtotal, gst, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [po.id, po.approvalId, po.rfqId, po.quotationId, po.vendorId, po.vendorName, po.dateGenerated, po.status, po.subtotal, po.gst, po.total]
      );
      
      for (const item of po.items) {
        await db.promise().query(
          "INSERT INTO po_items (po_id, item_name, quantity, price) VALUES (?, ?, ?, ?)",
          [po.id, item.name, item.qty, item.price]
        );
      }
    }

    console.log("Seeding invoices...");
    for (const inv of SEED_DATA.invoices) {
      await db.promise().query(
        "INSERT INTO invoices (id, po_id, vendor_id, vendor_name, date_generated, due_date, status, subtotal, gst, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [inv.id, inv.poId, inv.vendorId, inv.vendorName, inv.dateGenerated, inv.dueDate, inv.status, inv.subtotal, inv.gst, inv.total, inv.notes]
      );
      
      for (const item of inv.items) {
        await db.promise().query(
          "INSERT INTO invoice_items (invoice_id, item_name, quantity, price) VALUES (?, ?, ?, ?)",
          [inv.id, item.name, item.qty, item.price]
        );
      }
    }

    console.log("Seeding activity logs...");
    for (const log of SEED_DATA.activityLogs) {
      await db.promise().query(
        "INSERT INTO activity_logs (id, type, user, action, timestamp) VALUES (?, ?, ?, ?, ?)",
        [log.id, log.type, log.user, log.action, log.timestamp]
      );
    }

    console.log("Seeding completed successfully!");
    return true;
  } catch (err) {
    console.error("Seeding failed:", err);
    throw err;
  }
};

// Check if run directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };