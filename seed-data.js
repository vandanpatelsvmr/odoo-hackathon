// Seed Data for VendorBridge ERP
const SEED_DATA = {
  users: [
    { email: "officer@vendorbridge.com", password: "password", role: "officer", name: "Rohan Sharma", title: "Procurement Officer" },
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
