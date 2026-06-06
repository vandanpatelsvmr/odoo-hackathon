// VendorBridge - Core ERP Logic and SPA Router

class VendorBridgeERP {
  constructor() {
    this.db = {
      users: [],
      vendors: [],
      rfqs: [],
      quotations: [],
      approvals: [],
      purchaseOrders: [],
      invoices: [],
      activityLogs: []
    };
    this.currentUser = null;
    this.currentView = "dashboard";
    this.notifications = [];
    
    // Bindings
    this.initSession();
    this.initEventListeners();
  }

  // 1. Database Initialization (Now handled by Backend)
  initDatabase() {
    // No-op for API version
  }

  saveDatabase() {
    // No-op for API version
  }

  // 2. Session & Auth Management
  async initSession() {
    const token = localStorage.getItem("vendorbridge_token");
    if (token) {
      try {
        const response = await ApiService.request("/auth/profile");
        this.currentUser = response.user;
      } catch (e) {
        console.error("Session initialization failed", e);
        this.currentUser = null;
        localStorage.removeItem("vendorbridge_token");
      }
    }
    
    // UI Setup based on auth status
    const appShell = document.getElementById("app-shell");
    const authWrapper = document.getElementById("auth-wrapper");
    
    if (this.currentUser) {
      appShell.style.display = "flex";
      authWrapper.style.display = "none";
      
      // Update header profile details
      document.getElementById("profile-name").textContent = this.currentUser.name;
      document.getElementById("profile-role").textContent = this.currentUser.title;
      document.getElementById("role-select").value = this.currentUser.role;
      
      // Avatar initials
      const initials = this.currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase();
      document.getElementById("avatar-letter").textContent = initials;
      
      // Sync navigation items based on role policies
      this.syncNavigation();
      this.navigate("dashboard");
    } else {
      appShell.style.display = "none";
      authWrapper.style.display = "flex";
      this.showLoginTab();
    }
  }

  syncNavigation() {
    const role = this.currentUser.role;
    const menuItems = document.querySelectorAll(".menu-item");
    
    menuItems.forEach(item => {
      const view = item.getAttribute("data-view");
      
      // Reset visibility
      item.parentElement.style.display = "block";
      
      // Vendor specific visibility blocks
      if (role === "vendor") {
        if (["vendors", "approvals", "reports"].includes(view)) {
          item.parentElement.style.display = "none";
        }
      }
      
      // Manager/Approver specific visibility adjustments
      if (role === "manager") {
        if (["reports"].includes(view)) {
          // Managers can see reports, but maybe not create RFQs. Let's keep it visible.
        }
      }
    });
  }

  // 3. Event Listeners Initialization
  initEventListeners() {
    // Nav Click Router
    document.querySelectorAll(".menu-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const view = item.getAttribute("data-view");
        
        // Check permissions
        if (this.currentUser.role === "vendor" && ["vendors", "approvals", "reports"].includes(view)) {
          this.showToast("Access Denied: Vendors do not have permission to access this screen.", "danger");
          return;
        }
        
        document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
        item.classList.add("active");
        this.navigate(view);
      });
    });

    // Role Switcher Event
    document.getElementById("role-select").addEventListener("change", async (e) => {
      const newRole = e.target.value;
      // In a real app, we might need to switch account or re-authenticate
      // For this hackathon, we'll just show a message
      this.showToast(`Role switching is currently simulation-only. Please login with a ${newRole} account.`, "info");
    });

    // Auth Form Tabs Switcher
    document.getElementById("tab-login").addEventListener("click", () => this.showLoginTab());
    document.getElementById("tab-signup").addEventListener("click", () => this.showSignupTab());

    // Submit Actions
    document.getElementById("login-form").addEventListener("submit", (e) => this.handleLogin(e));
    document.getElementById("signup-form").addEventListener("submit", (e) => this.handleSignup(e));
    
    // Quick login helper buttons
    document.querySelectorAll(".quick-login-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const email = btn.getAttribute("data-email");
        document.getElementById("login-email").value = email;
        document.getElementById("login-password").value = "password";
        this.handleLoginDirect(email, "password");
      });
    });

    // Logout function
    document.getElementById("logout-btn").addEventListener("click", () => this.handleLogout());
    
    // Profile widget toggle
    document.getElementById("user-profile-widget").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("profile-dropdown").classList.toggle("active");
    });

    document.addEventListener("click", () => {
      document.getElementById("profile-dropdown").classList.remove("active");
    });

    // Close Modal Button
    document.getElementById("modal-close").addEventListener("click", () => this.closeModal());
    document.getElementById("modal-overlay").addEventListener("click", (e) => {
      if (e.target === document.getElementById("modal-overlay")) this.closeModal();
    });

    // Notifications Dropdown toggle
    document.getElementById("notif-toggle").addEventListener("click", () => {
      this.renderNotificationModal();
    });

    // Search function
    document.getElementById("global-search").addEventListener("input", (e) => {
      this.handleGlobalSearch(e.target.value.toLowerCase());
    });
  }

  // Navigation Logic
  async navigate(view, params = {}) {
    this.currentView = view;
    // Clear search box on view transitions
    document.getElementById("global-search").value = "";
    
    // Update Active Menu State visually
    document.querySelectorAll(".menu-item").forEach(item => {
      if (item.getAttribute("data-view") === view) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
    
    await this.render(params);
  }

  // 4. View Render Routing Manager
  async render(params = {}) {
    if (!this.currentUser) return;
    
    this.setLoading(true, "Fetching data...");
    // Fetch fresh data before rendering
    try {
      const [vendors, rfqs, quotations, approvals, pos, invoices, logs] = await Promise.all([
        ApiService.getVendors(),
        ApiService.getRFQs(),
        ApiService.getQuotations(),
        ApiService.getApprovals(),
        ApiService.getPurchaseOrders(),
        ApiService.getInvoices(),
        ApiService.getLogs()
      ]);

      this.db.vendors = vendors.vendors;
      this.db.rfqs = rfqs.rfqs;
      this.db.quotations = quotations.quotations;
      this.db.approvals = approvals.approvals;
      this.db.purchaseOrders = pos.purchaseOrders;
      this.db.invoices = invoices.invoices;
      this.db.activityLogs = logs.logs;
    } catch (e) {
      console.error("Data fetch failed", e);
      this.showToast("Failed to fetch fresh data from server.", "danger");
    } finally {
      this.setLoading(false);
    }

    const container = document.getElementById("main-content");
    container.innerHTML = ""; // Clear existing elements

    switch (this.currentView) {
      case "dashboard":
        this.renderDashboard(container);
        break;
      case "vendors":
        this.renderVendors(container);
        break;
      case "rfqs":
        this.renderRFQs(container);
        break;
      case "quotations":
        this.renderQuotations(container, params);
        break;
      case "approvals":
        this.renderApprovals(container, params);
        break;
      case "po-invoices":
        this.renderPOAndInvoices(container, params);
        break;
      case "reports":
        this.renderReports(container);
        break;
      case "activity-logs":
        this.renderActivityLogs(container);
        break;
      default:
        container.innerHTML = `<h2>Page Not Found</h2>`;
    }
  }

  // 5. VIEW RENDERERS IMPLEMENTATIONS
  
  // ================== SCREEN 2: DASHBOARD ==================
  renderDashboard(container) {
    const role = this.currentUser.role;
    
    // Compute KPI metrics
    const totalRfqs = this.db.rfqs.length;
    const pendingApprovalsCount = this.db.approvals.filter(a => a.status === "Pending").length;
    const activeVendors = this.db.vendors.filter(v => v.status === "Active").length;
    
    const approvedSpend = this.db.purchaseOrders.reduce((sum, po) => sum + po.total, 0);
    const formattedSpend = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(approvedSpend * 85); // Convert simulation dollars to INR

    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1>Dashboard Overview</h1>
          <p class="page-subtitle">Welcome back, ${this.currentUser.name}. Monitor procurement pipelines and pending operations.</p>
        </div>
        <div style="display:flex; gap:10px;">
          ${role === "procurement_officer" ? `<button class="btn btn-primary" id="dash-create-rfq-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Create RFQ
          </button>` : ''}
          ${role === 'vendor' ? `<button class="btn btn-primary" id="dash-submit-bid-btn">Submit Bid</button>` : ''}
          ${role === 'manager' ? `<button class="btn btn-primary" id="dash-pending-appr-btn">Review Approvals (${pendingApprovalsCount})</button>` : ''}
        </div>
      </div>

      <!-- Metrics Row -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <div class="stat-info">
            <span class="stat-val">${totalRfqs}</span>
            <span class="stat-lbl">Total RFQs Created</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div class="stat-info">
            <span class="stat-val">${pendingApprovalsCount}</span>
            <span class="stat-lbl">Pending Approvals</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orders">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
          </div>
          <div class="stat-info">
            <span class="stat-val">${formattedSpend}</span>
            <span class="stat-lbl">Approved PO Value</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7" /></svg>
          </div>
          <div class="stat-info">
            <span class="stat-val">${activeVendors}</span>
            <span class="stat-lbl">Active Suppliers</span>
          </div>
        </div>
      </div>

      <!-- Dashboard Layout Columns -->
      <div class="analytics-grid">
        <!-- Main table -->
        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">Active RFQs & Quotation Responses</h3>
          </div>
          <div class="table-responsive">
            <table class="custom-table" id="dashboard-rfq-table">
              <thead>
                <tr>
                  <th>RFQ ID</th>
                  <th>Title</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Bids Recv</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.db.rfqs.map(rfq => {
                  const bidsCount = this.db.quotations.filter(q => q.rfqId === rfq.id).length;
                  let badgeClass = "badge-pending";
                  if (rfq.status === "Approved" || rfq.status === "Completed") badgeClass = "badge-success";
                  if (rfq.status === "Under Review") badgeClass = "badge-info";
                  
                  return `
                    <tr>
                      <td style="font-weight:600; color:var(--accent);">${rfq.id}</td>
                      <td>${rfq.title}</td>
                      <td>${rfq.deadline}</td>
                      <td><span class="badge ${badgeClass}">${rfq.status}</span></td>
                      <td style="text-align:center; font-weight:bold;">${bidsCount}</td>
                      <td>
                        <button class="btn btn-secondary btn-sm rfq-view-details" data-id="${rfq.id}">Details</button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Side Mini Audit log -->
        <div class="panel" style="display: flex; flex-direction: column;">
          <div class="panel-header">
            <h3 class="panel-title">Recent Activity</h3>
          </div>
          <div style="flex-grow:1; max-height: 280px; overflow-y: auto; padding-right:5px;">
            <div class="timeline-feed">
              ${this.db.activityLogs.slice(0, 5).map(log => {
                let timelineClass = "";
                if (log.type === "system") timelineClass = "system";
                if (log.type === "approval") timelineClass = "approval";
                if (log.type === "po") timelineClass = "po";
                
                return `
                  <div class="timeline-item ${timelineClass}">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <span style="font-weight: 600; color: var(--text-main);">${log.user}</span>: ${log.action}
                      <div class="timeline-time">${new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" style="width:100%; margin-top: 15px; justify-content:center;" id="dash-view-all-logs">View System Audit Trail</button>
        </div>
      </div>
    `;

    // Add Dynamic Actions bindings
    if (document.getElementById("dash-create-rfq-btn")) {
      document.getElementById("dash-create-rfq-btn").addEventListener("click", () => this.navigate("rfqs", { action: "create" }));
    }
    if (document.getElementById("dash-submit-bid-btn")) {
      document.getElementById("dash-submit-bid-btn").addEventListener("click", () => this.navigate("quotations"));
    }
    if (document.getElementById("dash-pending-appr-btn")) {
      document.getElementById("dash-pending-appr-btn").addEventListener("click", () => this.navigate("approvals"));
    }
    document.getElementById("dash-view-all-logs").addEventListener("click", () => this.navigate("activity-logs"));

    // Details clicks
    document.querySelectorAll(".rfq-view-details").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        this.openRFQDetailsModal(id);
      });
    });
  }

  // ================== SCREEN 3: VENDOR MANAGEMENT ==================
  renderVendors(container) {
    const role = this.currentUser.role;
    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1>Vendor Registry</h1>
          <p class="page-subtitle">Add, manage, and audit onboarding credentials of corporate suppliers.</p>
        </div>
        ${role === 'admin' || role === "procurement_officer" ? `<button class="btn btn-primary" id="add-vendor-btn">Onboard New Vendor</button>` : ''}
      </div>

      <!-- Filters Panel -->
      <div class="panel" style="padding: 16px; margin-bottom: 20px; display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
        <div style="font-size:0.9rem; color:var(--text-muted);">Filter Category:</div>
        <button class="btn btn-secondary btn-sm cat-filter-btn active" data-cat="all">All Categories</button>
        <button class="btn btn-secondary btn-sm cat-filter-btn" data-cat="Stationery & Office">Office Supplies</button>
        <button class="btn btn-secondary btn-sm cat-filter-btn" data-cat="IT & Hardware">IT & Hardware</button>
        <button class="btn btn-secondary btn-sm cat-filter-btn" data-cat="Infrastructure & Furnishing">Furniture</button>
        <button class="btn btn-secondary btn-sm cat-filter-btn" data-cat="Logistics">Logistics</button>
      </div>

      <div class="panel">
        <div class="table-responsive">
          <table class="custom-table" id="vendors-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Category</th>
                <th>GST Details</th>
                <th>Contact</th>
                <th>Rating</th>
                <th>Status</th>
                ${role === 'admin' ? `<th>Actions</th>` : ''}
              </tr>
            </thead>
            <tbody id="vendors-table-body">
              ${this.renderVendorRows("all")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Filter events
    document.querySelectorAll(".cat-filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".cat-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const category = btn.getAttribute("data-cat");
        document.getElementById("vendors-table-body").innerHTML = this.renderVendorRows(category);
        this.bindVendorRowActions();
      });
    });

    // Add Vendor Button click
    if (document.getElementById("add-vendor-btn")) {
      document.getElementById("add-vendor-btn").addEventListener("click", () => this.openVendorRegistrationModal());
    }

    this.bindVendorRowActions();
  }

  renderVendorRows(category) {
    const role = this.currentUser.role;
    let list = this.db.vendors;
    if (category !== "all") {
      list = list.filter(v => v.category === category);
    }

    if (list.length === 0) {
      return `<tr><td colspan="${role === 'admin' ? 7 : 6}" style="text-align:center; color:var(--text-muted); padding:30px;">No vendors matched category.</td></tr>`;
    }

    return list.map(v => {
      let badgeClass = "badge-success";
      if (v.status === "Pending Approval") badgeClass = "badge-pending";
      if (v.status === "Suspended") badgeClass = "badge-danger";
      
      return `
        <tr class="vendor-registry-row" data-name="${v.name.toLowerCase()}" data-cat="${v.category.toLowerCase()}">
          <td style="font-weight:600;">${v.name}</td>
          <td><span style="font-size:0.85rem; color:var(--text-muted);">${v.category}</span></td>
          <td><code style="color:var(--accent); font-weight:600; font-size:0.85rem;">${v.gst}</code></td>
          <td style="font-size:0.85rem;">${v.email}<br><span style="color:var(--text-muted);">${v.contact}</span></td>
          <td style="color:var(--warning); font-weight:bold;">★ ${v.rating.toFixed(1)}</td>
          <td><span class="badge ${badgeClass}">${v.status}</span></td>
          ${role === 'admin' ? `
            <td>
              <div style="display:flex; gap:6px;">
                ${v.status === 'Active' ? 
                  `<button class="btn btn-secondary btn-sm toggle-vendor-status" data-id="${v.id}" data-action="Suspended">Suspend</button>` : 
                  `<button class="btn btn-primary btn-sm toggle-vendor-status" data-id="${v.id}" data-action="Active">Approve</button>`
                }
              </div>
            </td>
          ` : ''}
        </tr>
      `;
    }).join("");
  }

  bindVendorRowActions() {
    document.querySelectorAll(".toggle-vendor-status").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const newStatus = e.target.getAttribute("data-action");
        
        const vendor = this.db.vendors.find(v => v.id === id);
        if (vendor) {
          vendor.status = newStatus;
          this.saveDatabase();
          
          this.logActivity("system", `Updated vendor ${vendor.name} status to ${newStatus}`);
          this.showToast(`Vendor status updated to: ${newStatus}`, "success");
          this.render();
        }
      });
    });
  }

  // ================== SCREEN 4: RFQ CREATION & REGISTRY ==================
  renderRFQs(container, params = {}) {
    const role = this.currentUser.role;
    
    if (params.action === "create" && role === "procurement_officer") {
      this.renderRFQCreationForm(container);
      return;
    }

    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1>Requests for Quotation (RFQs)</h1>
          <p class="page-subtitle">Create and distribute product specs to onboarded vendors for quotation bidding.</p>
        </div>
        ${role === "procurement_officer" ? `<button class="btn btn-primary" id="open-create-rfq-btn">Initiate RFQ Workflow</button>` : ''}
      </div>

      <div class="panel">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>RFQ ID</th>
                <th>RFQ Title</th>
                <th>Created Date</th>
                <th>Submission Deadline</th>
                <th>Vendors Assigned</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="rfq-table-body">
              ${this.db.rfqs.map(rfq => {
                let badgeClass = "badge-pending";
                if (rfq.status === "Approved" || rfq.status === "Completed") badgeClass = "badge-success";
                if (rfq.status === "Under Review") badgeClass = "badge-info";
                
                return `
                  <tr class="rfq-registry-row" data-title="${rfq.title.toLowerCase()}" data-desc="${rfq.description.toLowerCase()}">
                    <td style="font-weight:600; color:var(--accent);">${rfq.id}</td>
                    <td>
                      <div style="font-weight:600; color:var(--text-main);">${rfq.title}</div>
                      <div style="font-size:0.8rem; color:var(--text-muted); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${rfq.description}</div>
                    </td>
                    <td>${rfq.dateCreated}</td>
                    <td>${rfq.deadline}</td>
                    <td style="font-size:0.85rem;">${rfq.assignedVendors.map(vid => {
                      const v = this.db.vendors.find(vend => vend.id === vid);
                      return v ? v.name : vid;
                    }).join(", ")}</td>
                    <td><span class="badge ${badgeClass}">${rfq.status}</span></td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary btn-sm rfq-details-action" data-id="${rfq.id}">Details</button>
                        ${role === "procurement_officer" && rfq.status === 'Bidding Open' ? 
                          `<button class="btn btn-primary btn-sm compare-bids-btn" data-id="${rfq.id}">Compare Bids</button>` : ''
                        }
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (document.getElementById("open-create-rfq-btn")) {
      document.getElementById("open-create-rfq-btn").addEventListener("click", () => {
        this.navigate("rfqs", { action: "create" });
      });
    }

    document.querySelectorAll(".rfq-details-action").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        this.openRFQDetailsModal(id);
      });
    });

    document.querySelectorAll(".compare-bids-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        this.navigate("quotations", { rfqId: id, compare: true });
      });
    });
  }

  renderRFQCreationForm(container) {
    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1>Create Request for Quotation (RFQ)</h1>
          <p class="page-subtitle">Publish structured procurement requirements to vendors.</p>
        </div>
        <button class="btn btn-secondary" id="cancel-create-rfq">Back to RFQs</button>
      </div>

      <div class="panel" style="max-width: 800px; margin: 0 auto;">
        <form id="create-rfq-form">
          <div class="form-group">
            <label for="rfq-title">RFQ Title</label>
            <input type="text" id="rfq-title" class="form-control" placeholder="e.g. Office Desk Furnishings Branch II" required>
          </div>
          <div class="form-group">
            <label for="rfq-desc">Description & Technical Details</label>
            <textarea id="rfq-desc" class="form-control" placeholder="Specify technical requirements, materials, certification, and warranty standards..." required></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="rfq-deadline">Response Submission Deadline</label>
              <input type="date" id="rfq-deadline" class="form-control" required>
            </div>
            <div class="form-group">
              <label>Assign Supplier Category</label>
              <select id="rfq-category-select" class="form-control">
                <option value="Stationery & Office">Stationery & Office</option>
                <option value="IT & Hardware">IT & Hardware</option>
                <option value="Infrastructure & Furnishing">Infrastructure & Furnishing</option>
                <option value="Logistics">Logistics</option>
              </select>
            </div>
          </div>

          <!-- Items specifications dynamically built -->
          <div style="margin-top: 24px; margin-bottom: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-weight:600; font-size:0.9rem;">Requested Product/Service Items</span>
              <button type="button" class="btn btn-secondary btn-sm" id="rfq-add-item-row-btn">+ Add Item Row</button>
            </div>
            <div class="table-responsive">
              <table class="custom-table" style="background-color:rgba(0,0,0,0.08); border-radius:8px;">
                <thead>
                  <tr>
                    <th>Item Name & Specifications</th>
                    <th style="width: 120px;">Qty</th>
                    <th style="width: 100px;">Unit</th>
                    <th style="width: 150px;">Est. Target Unit Price ($)</th>
                    <th style="width: 60px;"></th>
                  </tr>
                </thead>
                <tbody id="rfq-items-table-body">
                  <tr>
                    <td><input type="text" class="form-control rfq-item-name" placeholder="Item name" required></td>
                    <td><input type="number" class="form-control rfq-item-qty" min="1" placeholder="25" required></td>
                    <td><input type="text" class="form-control rfq-item-unit" placeholder="pcs" required></td>
                    <td><input type="number" class="form-control rfq-item-target" min="0" placeholder="150" required></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Assign Onboarded Vendors -->
          <div class="form-group">
            <label>Assign Target Vendors (Check all that apply)</label>
            <div class="vendor-checklist" id="rfq-vendor-checklist">
              <!-- Dynamically populated from matching category -->
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px; margin-top:30px;">
            <button type="button" class="btn btn-secondary" id="form-cancel-btn">Discard RFQ</button>
            <button type="submit" class="btn btn-primary">Publish RFQ Invitation</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById("cancel-create-rfq").addEventListener("click", () => this.navigate("rfqs"));
    document.getElementById("form-cancel-btn").addEventListener("click", () => this.navigate("rfqs"));

    // Add item row event
    document.getElementById("rfq-add-item-row-btn").addEventListener("click", () => {
      const tbody = document.getElementById("rfq-items-table-body");
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="text" class="form-control rfq-item-name" placeholder="Item name" required></td>
        <td><input type="number" class="form-control rfq-item-qty" min="1" placeholder="25" required></td>
        <td><input type="text" class="form-control rfq-item-unit" placeholder="pcs" required></td>
        <td><input type="number" class="form-control rfq-item-target" min="0" placeholder="150" required></td>
        <td style="text-align:center;"><button type="button" class="btn btn-danger btn-sm delete-row-btn" style="padding:6px 8px;">✕</button></td>
      `;
      tbody.appendChild(tr);

      // delete button logic
      tr.querySelector(".delete-row-btn").addEventListener("click", () => {
        tbody.removeChild(tr);
      });
    });

    // Populate Vendors Checklist based on category select
    const categorySelector = document.getElementById("rfq-category-select");
    const updateVendors = () => {
      const category = categorySelector.value;
      const filteredVendors = this.db.vendors.filter(v => v.category === category && v.status === "Active");
      const checklistContainer = document.getElementById("rfq-vendor-checklist");
      checklistContainer.innerHTML = "";

      if (filteredVendors.length === 0) {
        checklistContainer.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); padding: 5px;">No active suppliers onboarded in this category.</p>`;
        return;
      }

      filteredVendors.forEach(v => {
        const item = document.createElement("label");
        item.className = "vendor-check-item";
        item.innerHTML = `
          <input type="checkbox" name="assigned-vendors" value="${v.id}" checked>
          <span>${v.name} (★ ${v.rating.toFixed(1)})</span>
        `;
        checklistContainer.appendChild(item);
      });
    };

    categorySelector.addEventListener("change", updateVendors);
    updateVendors(); // Initial call

    // Submit form logic
    document.getElementById("create-rfq-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const title = document.getElementById("rfq-title").value;
      const description = document.getElementById("rfq-desc").value;
      const deadline = document.getElementById("rfq-deadline").value;
      
      const checkedVendors = Array.from(document.querySelectorAll('input[name="assigned-vendors"]:checked')).map(cb => cb.value);
      if (checkedVendors.length === 0) {
        this.showToast("Verification Failed: You must assign at least one target vendor to publish the RFQ.", "warning");
        return;
      }

      // Collect line items
      const itemRows = document.querySelectorAll("#rfq-items-table-body tr");
      const items = [];
      itemRows.forEach(row => {
        const name = row.querySelector(".rfq-item-name").value;
        const qty = parseInt(row.querySelector(".rfq-item-qty").value, 10);
        const unit = row.querySelector(".rfq-item-unit").value;
        const targetPrice = parseFloat(row.querySelector(".rfq-item-target").value);
        items.push({ name, qty, unit, targetPrice });
      });

      try {
        const response = await ApiService.createRFQ({
          title, description, deadline, items, assignedVendors: checkedVendors
        });

        this.logActivity("rfq", `Created ${response.rfqId}: ${title}`);
        this.showToast(`Published ${response.rfqId} successfully!`, "success");
        await this.navigate("rfqs");
      } catch (e) {
        this.showToast(e.message, "danger");
      }
    });
  }

  // ================== SCREEN 5 & 6: VENDOR QUOTATION & COMPARISON ==================
  renderQuotations(container, params = {}) {
    const role = this.currentUser.role;

    // Check if compare action is requested (Screen 6)
    if (params.compare && params.rfqId) {
      this.renderQuotationComparison(container, params.rfqId);
      return;
    }

    if (role === "vendor") {
      // Screen 5: Vendor Quotation Submission Screen
      this.renderVendorQuotationPanel(container);
    } else {
      // General view: Procurement officer/Manager viewing bids summary
      container.innerHTML = `
        <div class="page-title-area">
          <div>
            <h1>Vendor Quotations</h1>
            <p class="page-subtitle">Track bids submitted by suppliers. Launch comparative matrices to process approvals.</p>
          </div>
        </div>

        <div class="panel">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>RFQ ID</th>
                  <th>RFQ Title</th>
                  <th>Closing Date</th>
                  <th>Quotes Received</th>
                  <th>Lowest Bid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.db.rfqs.map(rfq => {
                  const bids = this.db.quotations.filter(q => q.rfqId === rfq.id);
                  const bidsCount = bids.length;
                  
                  let minBidText = "-";
                  if (bidsCount > 0) {
                    const minBid = Math.min(...bids.map(b => b.total));
                    minBidText = `$${minBid.toLocaleString()}`;
                  }

                  return `
                    <tr>
                      <td style="font-weight:600; color:var(--accent);">${rfq.id}</td>
                      <td style="font-weight:600;">${rfq.title}</td>
                      <td>${rfq.deadline}</td>
                      <td style="text-align:center; font-weight:bold; color:var(--accent);">${bidsCount}</td>
                      <td style="font-weight:700; color:${bidsCount > 0 ? 'var(--text-main)' : 'var(--text-muted)'};">${minBidText}</td>
                      <td>
                        <div style="display:flex; gap:6px;">
                          <button class="btn btn-secondary btn-sm rfq-view-details" data-id="${rfq.id}">View RFQ</button>
                          ${bidsCount > 0 ? 
                            `<button class="btn btn-primary btn-sm compare-action-btn" data-rfqid="${rfq.id}">Compare Bids</button>` : 
                            `<span style="font-size:0.8rem; color:var(--text-muted); align-self:center;">Awaiting bids</span>`
                          }
                        </div>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Clicks
      document.querySelectorAll(".rfq-view-details").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.getAttribute("data-id");
          this.openRFQDetailsModal(id);
        });
      });

      document.querySelectorAll(".compare-action-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const rfqId = e.target.getAttribute("data-rfqid");
          this.navigate("quotations", { rfqId, compare: true });
        });
      });
    }
  }

  // SCREEN 5: Vendor Quotation Submission Screen
  renderVendorQuotationPanel(container) {
    const vendorEmail = this.currentUser.email;
    const vendorRecord = this.db.vendors.find(v => v.email === vendorEmail);
    
    if (!vendorRecord) {
      container.innerHTML = `<h2>Profile Error: Vendor Account not bound to registry.</h2>`;
      return;
    }

    // Filter RFQs assigned to this vendor
    const assignedRFQs = this.db.rfqs.filter(rfq => rfq.assignedVendors.includes(vendorRecord.id));

    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1>Vendor Quotation Submission</h1>
          <p class="page-subtitle">Welcome, ${vendorRecord.name}. Review invitations and submit pricing estimates.</p>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Assigned RFQs & Submission Status</h3>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>RFQ ID</th>
                <th>Project Title</th>
                <th>Deadline</th>
                <th>Your Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${assignedRFQs.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No RFQ invitations active for your category.</td></tr>` : 
                assignedRFQs.map(rfq => {
                  const submittedQuote = this.db.quotations.find(q => q.rfqId === rfq.id && q.vendorId === vendorRecord.id);
                  const isSubmitted = !!submittedQuote;
                  
                  return `
                    <tr>
                      <td style="font-weight:600; color:var(--accent);">${rfq.id}</td>
                      <td style="font-weight:600;">${rfq.title}</td>
                      <td>${rfq.deadline}</td>
                      <td>
                        <span class="badge ${isSubmitted ? 'badge-success' : 'badge-pending'}">
                          ${isSubmitted ? `Submitted ($${submittedQuote.total.toLocaleString()})` : 'Pending Estimate'}
                        </span>
                      </td>
                      <td>
                        <div style="display:flex; gap:6px;">
                          <button class="btn btn-secondary btn-sm rfq-view-details" data-id="${rfq.id}">View Requirements</button>
                          ${rfq.status === 'Bidding Open' ? 
                            `<button class="btn btn-primary btn-sm submit-quote-action" data-rfqid="${rfq.id}" data-quoteid="${isSubmitted ? submittedQuote.id : ''}">
                              ${isSubmitted ? 'Update Quotation' : 'Submit Bid'}
                            </button>` : 
                            `<span style="font-size:0.8rem; color:var(--text-muted); align-self:center;">Bidding closed</span>`
                          }
                        </div>
                      </td>
                    </tr>
                  `;
                }).join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.querySelectorAll(".rfq-view-details").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        this.openRFQDetailsModal(id);
      });
    });

    document.querySelectorAll(".submit-quote-action").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const rfqId = e.target.getAttribute("data-rfqid");
        const quoteId = e.target.getAttribute("data-quoteid");
        this.openQuotationFormModal(rfqId, quoteId, vendorRecord.id);
      });
    });
  }

  // Opens popup window to let Vendor submit quotation inputs
  openQuotationFormModal(rfqId, quoteId, vendorId) {
    const rfq = this.db.rfqs.find(r => r.id === rfqId);
    const existingQuote = quoteId ? this.db.quotations.find(q => q.id === quoteId) : null;
    
    let modalTitleText = `Submit Bid Estimate: ${rfqId}`;
    if (existingQuote) modalTitleText = `Update Bid Estimate: ${existingQuote.id}`;

    const modalTitle = document.getElementById("modal-title");
    const modalContent = document.getElementById("modal-content");
    
    modalTitle.textContent = modalTitleText;
    
    // Build pricing line items forms
    const itemsRowsHtml = rfq.items.map((item, index) => {
      let currentPrice = item.targetPrice;
      if (existingQuote && existingQuote.items[index]) {
        currentPrice = existingQuote.items[index].price;
      }

      return `
        <tr class="quote-item-row" data-name="${item.name}" data-qty="${item.qty}">
          <td><span style="font-weight:600;">${item.name}</span> <span style="font-size:0.8rem; color:var(--text-muted);">(${item.qty} ${item.unit})</span></td>
          <td style="font-size:0.85rem; color:var(--text-muted); text-align:right;">$${item.targetPrice}</td>
          <td>
            <input type="number" class="form-control quote-item-price" data-qty="${item.qty}" min="0.1" step="0.01" value="${currentPrice}" style="text-align:right;" required>
          </td>
          <td class="quote-item-line-total" style="font-weight:700; text-align:right;">
            $${(currentPrice * item.qty).toFixed(2)}
          </td>
        </tr>
      `;
    }).join("");

    modalContent.innerHTML = `
      <form id="submit-quote-form">
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom: 20px;">
          Provide competitive pricing for all requested items. Calculations include auto-compounded GST 18%.
        </p>

        <div class="table-responsive" style="margin-bottom: 20px;">
          <table class="custom-table" style="background-color:rgba(0,0,0,0.08); border-radius:8px;">
            <thead>
              <tr>
                <th>Item Specification</th>
                <th style="text-align:right;">Target Unit Price</th>
                <th style="width:140px; text-align:right;">Your Unit Bid ($)</th>
                <th style="text-align:right; width:120px;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="quote-delivery">Delivery Lead Time (Days)</label>
            <input type="number" id="quote-delivery" class="form-control" min="1" value="${existingQuote ? existingQuote.deliveryDays : 7}" required>
          </div>
          <div class="form-group" style="display:flex; flex-direction:column; align-items:flex-end; justify-content:center;">
            <div style="font-size:0.85rem; color:var(--text-muted);">Quote Subtotal: <span id="quote-calc-sub" style="font-weight:700; color:var(--text-main);">$0.00</span></div>
            <div style="font-size:0.85rem; color:var(--text-muted); margin: 4px 0;">GST @ 18%: <span id="quote-calc-gst" style="font-weight:700; color:var(--text-main);">$0.00</span></div>
            <div style="font-size:1.1rem; font-weight:700;">Grand Total: <span id="quote-calc-grand" style="color:var(--accent);">$0.00</span></div>
          </div>
        </div>

        <div class="form-group">
          <label for="quote-notes">Supplier Notes & Additional Warranties</label>
          <textarea id="quote-notes" class="form-control" placeholder="Specify warranty periods, logistics, terms, or product details..." required>${existingQuote ? existingQuote.notes : ''}</textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:24px;">
          <button type="button" class="btn btn-secondary" id="quote-discard">Discard</button>
          <button type="submit" class="btn btn-primary">Submit Estimate</button>
        </div>
      </form>
    `;

    this.openModal();

    // Event calculation binders
    const calcTotals = () => {
      let subtotal = 0;
      const rows = modalContent.querySelectorAll(".quote-item-row");
      
      rows.forEach(row => {
        const qty = parseInt(row.getAttribute("data-qty"), 10);
        const priceInput = row.querySelector(".quote-item-price");
        const price = parseFloat(priceInput.value) || 0;
        
        const lineTotal = price * qty;
        subtotal += lineTotal;
        
        row.querySelector(".quote-item-line-total").textContent = `$${lineTotal.toFixed(2)}`;
      });

      const gst = subtotal * 0.18;
      const grandTotal = subtotal + gst;

      document.getElementById("quote-calc-sub").textContent = `$${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      document.getElementById("quote-calc-gst").textContent = `$${gst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      document.getElementById("quote-calc-grand").textContent = `$${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    };

    modalContent.querySelectorAll(".quote-item-price").forEach(inp => {
      inp.addEventListener("input", calcTotals);
    });

    calcTotals(); // Run initially

    // Form buttons bindings
    document.getElementById("quote-discard").addEventListener("click", () => this.closeModal());
    
    document.getElementById("submit-quote-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const deliveryDays = parseInt(document.getElementById("quote-delivery").value, 10);
      const notes = document.getElementById("quote-notes").value;
      
      // Lines
      const items = [];
      modalContent.querySelectorAll(".quote-item-row").forEach(row => {
        const name = row.getAttribute("data-name");
        const qty = parseInt(row.getAttribute("data-qty"), 10);
        const price = parseFloat(row.querySelector(".quote-item-price").value);
        items.push({ name, qty, price });
      });

      try {
        if (existingQuote) {
          await ApiService.request(`/quotations/${existingQuote.id}`, {
            method: "PUT",
            body: JSON.stringify({ items, deliveryDays, notes })
          });
          this.showToast(`Updated quote estimate: ${existingQuote.id}`, "success");
        } else {
          const response = await ApiService.createQuotation({
            rfqId, vendorId, vendorName: vendorRecord.name, items, deliveryDays, notes
          });
          this.showToast(`New bid submitted! ID: ${response.quotationId}`, "success");
        }

        this.closeModal();
        await this.render();
      } catch (e) {
        this.showToast(e.message, "danger");
      }
    });
  }

  // ================== SCREEN 6: QUOTATION COMPARISON ==================
  renderQuotationComparison(container, rfqId) {
    const rfq = this.db.rfqs.find(r => r.id === rfqId);
    const quotes = this.db.quotations.filter(q => q.rfqId === rfqId);
    
    // Sort logic parameters
    const minQuotePrice = Math.min(...quotes.map(q => q.total));
    const minDeliveryTime = Math.min(...quotes.map(q => q.deliveryDays));

    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1 style="display:flex; align-items:center; gap:10px;">
            <span style="color:var(--text-muted); font-size: 1.2rem;">RFQ /</span> Quotation Comparison
          </h1>
          <p class="page-subtitle">Analyzing ${quotes.length} bids received for project: <strong>${rfq.title} (${rfq.id})</strong></p>
        </div>
        <button class="btn btn-secondary" id="back-to-quotes-list-btn">Back</button>
      </div>

      <div class="panel" style="padding:16px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:0.9rem;">
          Target Price Estimate: <span style="font-weight:700; color:var(--accent);">$${rfq.items.reduce((sum, item) => sum + (item.targetPrice * item.qty), 0).toLocaleString()}</span>
        </div>
        <div style="display:flex; gap:10px; align-items:center; font-size:0.85rem; color:var(--text-muted);">
          <span>Lowest Bid Highlight:</span>
          <span style="display:inline-block; width:12px; height:12px; background-color:var(--accent); border-radius:3px; box-shadow:var(--glow);"></span>
          <span style="color:var(--text-main); font-weight:600;">Active</span>
        </div>
      </div>

      <!-- Compare Matrices Cards Grid -->
      <div class="comparison-grid">
        ${quotes.map(q => {
          const isLowestPrice = q.total === minQuotePrice;
          const isFastestDelivery = q.deliveryDays === minDeliveryTime;
          const vendor = this.db.vendors.find(v => v.id === q.vendorId);
          
          return `
            <div class="comparison-card ${isLowestPrice ? 'best-price' : ''}">
              ${isLowestPrice ? `<div class="best-badge">Lowest Price</div>` : ''}
              
              <div class="comparison-vendor-name">${q.vendorName}</div>
              <div class="comparison-vendor-rating">
                ★ ${vendor ? vendor.rating.toFixed(1) : '4.5'} Vendor Rating
              </div>

              <!-- Lines comparison list -->
              <div style="border-top: 1px dashed var(--border); padding-top:12px; margin-bottom:16px;">
                <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Bid Breakdown:</span>
                <ul style="list-style:none; padding-top:6px; font-size:0.85rem;">
                  ${q.items.map(item => `
                    <li style="display:flex; justify-content:space-between; margin-bottom:6px;">
                      <span style="color:var(--text-muted);">${item.name} (${item.qty}x)</span>
                      <span>$${(item.price * item.qty).toLocaleString()}</span>
                    </li>
                  `).join("")}
                </ul>
              </div>

              <div class="comparison-metric">
                <span style="color:var(--text-muted);">Subtotal:</span>
                <span class="comparison-metric-val">$${q.subtotal.toLocaleString()}</span>
              </div>
              <div class="comparison-metric">
                <span style="color:var(--text-muted);">GST (18%):</span>
                <span class="comparison-metric-val">$${q.gst.toLocaleString()}</span>
              </div>
              
              <div class="comparison-price">
                $${q.total.toLocaleString()}
                <span>total bid</span>
              </div>

              <div class="comparison-metric" style="margin-bottom: 20px;">
                <span style="color:var(--text-muted);">Delivery Timeline:</span>
                <span class="comparison-metric-val" style="color:${isFastestDelivery ? 'var(--accent)' : 'inherit'};">
                  ${q.deliveryDays} Days ${isFastestDelivery ? '(Fastest)' : ''}
                </span>
              </div>

              <div class="comparison-notes" title="${q.notes}">
                <strong>Supplier Notes:</strong><br>
                ${q.notes}
              </div>

              ${this.currentUser.role === "procurement_officer" && rfq.status === 'Bidding Open' ? 
                `<button class="btn btn-primary select-quote-approval-btn" style="width:100%; justify-content:center;" data-qid="${q.id}">
                  Select for Approval
                </button>` : ''
              }
            </div>
          `;
        }).join("")}
      </div>
    `;

    document.getElementById("back-to-quotes-list-btn").addEventListener("click", () => this.navigate("quotations"));

    document.querySelectorAll(".select-quote-approval-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const qid = e.target.getAttribute("data-qid");
        this.initiateApprovalWorkflow(qid);
      });
    });
  }

  async initiateApprovalWorkflow(quoteId) {
    const quote = this.db.quotations.find(q => q.id === quoteId);
    const rfq = this.db.rfqs.find(r => r.id === quote.rfqId);

    try {
      // 1. Update RFQ status to Under Review
      await ApiService.request(`/rfqs/${rfq.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Under Review" })
      });

      // 2. Update Quotation status to Under Review
      await ApiService.request(`/quotations/${quote.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Under Review" })
      });

      // 3. Create Approval Record
      const response = await ApiService.createApproval({
        rfqId: rfq.id,
        rfqTitle: rfq.title,
        quotationId: quoteId,
        vendorName: quote.vendorName,
        amount: quote.total,
        requestedBy: this.currentUser.name
      });

      this.logActivity("approval", `Requested procurement approval ${response.approvalId} for quote ${quoteId} ($${quote.total.toLocaleString()})`);
      this.showToast(`Submitted approval request ${response.approvalId}`, "success");
      
      // Automatically redirect to workflow screen
      await this.navigate("approvals", { id: response.approvalId });
    } catch (e) {
      this.showToast(e.message, "danger");
    }
  }

  // ================== SCREEN 7: APPROVAL WORKFLOW ==================
  renderApprovals(container, params = {}) {
    const role = this.currentUser.role;

    // View specific approval request details
    if (params.id) {
      this.renderApprovalDetailScreen(container, params.id);
      return;
    }

    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1>Procurement Approvals Workflow</h1>
          <p class="page-subtitle">Track, review, and authorize purchase proposals and vendor budgets.</p>
        </div>
      </div>

      <div class="panel">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Approval ID</th>
                <th>RFQ Title</th>
                <th>Supplier Vendor</th>
                <th>Estimated Amount</th>
                <th>Requested By</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.db.approvals.length === 0 ? `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No approvals active in logs.</td></tr>` : 
                this.db.approvals.map(appr => {
                  let badgeClass = "badge-pending";
                  if (appr.status === "Approved") badgeClass = "badge-success";
                  if (appr.status === "Rejected") badgeClass = "badge-danger";

                  const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(appr.amount * 85);
                  
                  return `
                    <tr>
                      <td style="font-weight:600; color:var(--accent);">${appr.id}</td>
                      <td style="font-weight:600;">${appr.rfqTitle}</td>
                      <td>${appr.vendorName}</td>
                      <td style="font-weight:700;">${formattedAmount}</td>
                      <td>${appr.requestedBy}</td>
                      <td>${appr.dateRequested}</td>
                      <td><span class="badge ${badgeClass}">${appr.status}</span></td>
                      <td>
                        <button class="btn btn-secondary btn-sm open-appr-details-btn" data-id="${appr.id}">
                          ${role === 'manager' && appr.status === 'Pending' ? 'Action / Review' : 'View Workflow'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.querySelectorAll(".open-appr-details-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        this.navigate("approvals", { id });
      });
    });
  }

  renderApprovalDetailScreen(container, approvalId) {
    const appr = this.db.approvals.find(a => a.id === approvalId);
    const quote = this.db.quotations.find(q => q.id === appr.quotationId);
    const rfq = this.db.rfqs.find(r => r.id === appr.rfqId);
    const role = this.currentUser.role;

    // Determine current stepper progress index
    let step1Class = "completed"; // RFQ Created
    let step2Class = "completed"; // Bidding
    let step3Class = "active";    // Manager Review
    let step4Class = "";          // PO Generation
    let stepperWidth = "66%";

    if (appr.status === "Approved") {
      step3Class = "completed";
      step4Class = "completed";
      stepperWidth = "100%";
    } else if (appr.status === "Rejected") {
      step3Class = "completed"; // Ends in fail
      stepperWidth = "66%";
    }

    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1 style="display:flex; align-items:center; gap:10px;">
            <span style="color:var(--text-muted); font-size: 1.2rem;">Workflow /</span> ${appr.id} Detail
          </h1>
          <p class="page-subtitle">Review budget allocation, item scopes, and workflow history timeline.</p>
        </div>
        <button class="btn btn-secondary" id="back-to-appr-list-btn">Back to Registry</button>
      </div>

      <!-- Stepper Progress UI -->
      <div class="panel">
        <div class="stepper-container">
          <div class="stepper-progress" style="width: ${stepperWidth};"></div>
          
          <div class="step-node ${step1Class}">
            <div class="step-icon">1</div>
            <div class="step-label">RFQ Created<br><span style="font-size:0.7rem; color:var(--text-muted);">${rfq.dateCreated}</span></div>
          </div>
          <div class="step-node ${step2Class}">
            <div class="step-icon">2</div>
            <div class="step-label">Bids Compiled<br><span style="font-size:0.7rem; color:var(--text-muted);">${quote.dateSubmitted}</span></div>
          </div>
          <div class="step-node ${step3Class}">
            <div class="step-icon">3</div>
            <div class="step-label">Review Status<br><span style="font-size:0.7rem; color:var(--text-muted);">${appr.status}</span></div>
          </div>
          <div class="step-node ${step4Class}">
            <div class="step-icon">4</div>
            <div class="step-label">Purchase Order<br><span style="font-size:0.7rem; color:var(--text-muted);">${appr.status === 'Approved' ? 'Generated' : 'Awaiting'}</span></div>
          </div>
        </div>
      </div>

      <div class="analytics-grid" style="grid-template-columns: 3fr 2fr;">
        <!-- Left Side Sheet -->
        <div class="panel">
          <h3 class="panel-title" style="margin-bottom:20px;">Requested Bid Specifications</h3>
          
          <div style="margin-bottom:20px; font-size:0.9rem; line-height: 1.6;">
            <strong>RFQ Title:</strong> ${appr.rfqTitle} (${appr.rfqId})<br>
            <strong>Proposed Vendor:</strong> ${appr.vendorName}<br>
            <strong>Lead Time:</strong> ${quote.deliveryDays} Days<br>
            <strong>Initiated By:</strong> ${appr.requestedBy}
          </div>

          <div class="table-responsive" style="margin-bottom: 24px;">
            <table class="custom-table" style="background-color:rgba(0,0,0,0.06);">
              <thead>
                <tr>
                  <th>Line Item Description</th>
                  <th style="text-align:right;">Quantity</th>
                  <th style="text-align:right;">Unit Price ($)</th>
                  <th style="text-align:right;">Line Total ($)</th>
                </tr>
              </thead>
              <tbody>
                ${quote.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td style="text-align:right;">${item.qty}</td>
                    <td style="text-align:right;">$${item.price.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:700;">$${(item.price * item.qty).toLocaleString()}</td>
                  </tr>
                `).join("")}
                <tr>
                  <td colspan="3" style="text-align:right; font-weight:600; border-top:1.5px solid var(--border);">Subtotal:</td>
                  <td style="text-align:right; font-weight:600; border-top:1.5px solid var(--border);">$${quote.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align:right; font-weight:600;">GST @ 18%:</td>
                  <td style="text-align:right; font-weight:600;">$${quote.gst.toLocaleString()}</td>
                </tr>
                <tr style="font-size:1.05rem; color:var(--accent);">
                  <td colspan="3" style="text-align:right; font-weight:700; border-top:1.5px solid var(--border);">Grand Total:</td>
                  <td style="text-align:right; font-weight:700; border-top:1.5px solid var(--border);">$${quote.total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Manager Form actions -->
          ${role === 'manager' && appr.status === 'Pending' ? `
            <div style="border-top: 1px solid var(--border); padding-top:20px;">
              <h4 style="font-family:'Outfit'; margin-bottom:12px;">Authorize Procurement Request</h4>
              <form id="approval-decision-form">
                <div class="form-group">
                  <label for="approval-remarks">Manager Remarks / Decision Notes</label>
                  <textarea id="approval-remarks" class="form-control" placeholder="Provide reason for approval or rejection budget metrics..." required></textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                  <button type="submit" class="btn btn-danger" id="btn-reject-proposal">Reject Budget</button>
                  <button type="submit" class="btn btn-primary" id="btn-approve-proposal">Approve & Generate PO</button>
                </div>
              </form>
            </div>
          ` : `
            <div style="border-top:1px solid var(--border); padding-top:16px; font-size:0.9rem;">
              <strong>Remarks:</strong> ${appr.remarks || '<span style="color:var(--text-muted);">No decision notes provided yet.</span>'}
            </div>
          `}
        </div>

        <!-- Right Side History Timeline -->
        <div class="panel">
          <h3 class="panel-title" style="margin-bottom:16px;">Approval Audit Timeline</h3>
          <div class="timeline-feed">
            ${appr.history.map(hist => {
              let tClass = "";
              if (hist.status === "Approved") tClass = "completed";
              if (hist.status === "Rejected") tClass = "danger";
              
              return `
                <div class="timeline-item">
                  <div class="timeline-marker" style="border-color:${hist.status === 'Approved' ? 'var(--accent)' : (hist.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)')}"></div>
                  <div class="timeline-content">
                    <div style="font-weight:700; color:var(--text-main);">${hist.status}</div>
                    <div style="font-size:0.85rem; margin:2px 0;">Action by: ${hist.user}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${hist.remarks}</div>
                    <div class="timeline-time">${hist.date}</div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    document.getElementById("back-to-appr-list-btn").addEventListener("click", () => this.navigate("approvals"));

    if (role === 'manager' && appr.status === 'Pending') {
      let decision = "Approved";
      
      document.getElementById("btn-approve-proposal").addEventListener("click", () => {
        decision = "Approved";
      });
      document.getElementById("btn-reject-proposal").addEventListener("click", () => {
        decision = "Rejected";
      });

      document.getElementById("approval-decision-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const remarks = document.getElementById("approval-remarks").value;
        this.processApprovalDecision(approvalId, decision, remarks);
      });
    }
  }

  async processApprovalDecision(approvalId, decision, remarks) {
    try {
      const appr = this.db.approvals.find(a => a.id === approvalId);
      const quote = this.db.quotations.find(q => q.id === appr.quotationId);
      const rfq = this.db.rfqs.find(r => r.id === appr.rfqId);

      await ApiService.updateApproval(approvalId, {
        status: decision,
        approvedBy: this.currentUser.name,
        remarks
      });

      if (decision === "Approved") {
        // 1. Update RFQ and quote status via API
        await ApiService.request(`/rfqs/${rfq.id}`, {
          method: "PUT",
          body: JSON.stringify({ status: "Approved" })
        });

        await ApiService.request(`/quotations/${quote.id}`, {
          method: "PUT",
          body: JSON.stringify({ status: "Approved" })
        });

        // 2. Generate Purchase Order via API
        const poResponse = await ApiService.createPurchaseOrder({
          approvalId: appr.id,
          rfqId: rfq.id,
          quotationId: quote.id,
          vendorId: quote.vendorId,
          vendorName: quote.vendorName,
          items: quote.items,
          subtotal: quote.subtotal,
          gst: quote.gst,
          total: quote.total
        });
        
        this.logActivity("po", `Automatically generated ${poResponse.poId} linked to approved budget ${appr.id}`);

        // 3. Generate Invoice via API
        const invResponse = await ApiService.createInvoice({
          poId: poResponse.poId,
          vendorId: quote.vendorId,
          vendorName: quote.vendorName,
          items: quote.items,
          subtotal: quote.subtotal,
          gst: quote.gst,
          total: quote.total,
          notes: "Awaiting review and disbursement from accounts payable."
        });
        this.logActivity("invoice", `Automatically generated billing invoice ${invResponse.invoiceId} for PO ${poResponse.poId}`);

        this.showToast(`Approved! PO and Invoice auto-generated.`, "success");
      } else {
        // Rejected
        await ApiService.request(`/rfqs/${rfq.id}`, {
          method: "PUT",
          body: JSON.stringify({ status: "Bidding Open" })
        });
        await ApiService.request(`/quotations/${quote.id}`, {
          method: "PUT",
          body: JSON.stringify({ status: "Rejected" })
        });
        this.showToast(`Procurement request rejected.`, "warning");
      }

      await this.navigate("approvals", { id: approvalId });
    } catch (e) {
      this.showToast(e.message, "danger");
    }
  }

  // ================== SCREEN 8: PURCHASE ORDER & INVOICE GENERATION ==================
  renderPOAndInvoices(container, params = {}) {
    const role = this.currentUser.role;

    // View specific invoice sheet
    if (params.invId) {
      this.renderInvoiceSheet(container, params.invId);
      return;
    }

    // Default lists layout
    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1>Purchase Orders & Invoices</h1>
          <p class="page-subtitle">Examine auto-generated corporate purchase orders and billing invoice sheets.</p>
        </div>
      </div>

      <div class="analytics-grid" style="grid-template-columns: 1fr 1fr;">
        <!-- Left PO Panel -->
        <div class="panel">
          <h3 class="panel-title" style="margin-bottom:16px;">Corporate Purchase Orders (POs)</h3>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>PO ID</th>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${this.db.purchaseOrders.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No POs generated.</td></tr>` : 
                  this.db.purchaseOrders.map(po => {
                    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(po.total * 85);
                    return `
                      <tr>
                        <td style="font-weight:600; color:var(--accent);">${po.id}</td>
                        <td>${po.vendorName}</td>
                        <td style="font-weight:700;">${formattedAmount}</td>
                        <td style="font-size:0.85rem;">${po.dateGenerated}</td>
                        <td><span class="badge badge-success">${po.status}</span></td>
                      </tr>
                    `;
                  }).join("")
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Invoices Panel -->
        <div class="panel">
          <h3 class="panel-title" style="margin-bottom:16px;">Billing Invoices</h3>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>PO Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.db.invoices.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No Invoices generated.</td></tr>` : 
                  this.db.invoices.map(inv => {
                    let badgeClass = "badge-pending";
                    if (inv.status === "Paid") badgeClass = "badge-success";
                    
                    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inv.total * 85);
                    return `
                      <tr>
                        <td style="font-weight:600; color:var(--accent);">${inv.id}</td>
                        <td style="font-size:0.85rem; color:var(--text-muted);">${inv.poId}</td>
                        <td style="font-weight:700;">${formattedAmount}</td>
                        <td><span class="badge ${badgeClass}">${inv.status}</span></td>
                        <td>
                          <div style="display:flex; gap:6px;">
                            <button class="btn btn-secondary btn-sm open-invoice-btn" data-id="${inv.id}">View Sheet</button>
                            ${role === 'manager' && inv.status === 'Pending Payment' ? 
                              `<button class="btn btn-primary btn-sm pay-invoice-btn" data-id="${inv.id}">Pay</button>` : ''
                            }
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll(".open-invoice-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        this.navigate("po-invoices", { invId: id });
      });
    });

    document.querySelectorAll(".pay-invoice-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        const inv = this.db.invoices.find(i => i.id === id);
        if (inv) {
          try {
            const notes = `Payment cleared via Online Banking. Receipt #TXN-${Math.floor(10000000 + Math.random() * 90000000)}.`;
            await ApiService.payInvoice(id, notes);
            
            this.logActivity("invoice", `Disbursed funds for Invoice ${inv.id} ($${inv.total.toLocaleString()})`);
            this.showToast(`Invoice ${inv.id} successfully Paid!`, "success");
            await this.render();
          } catch (e) {
            this.showToast(e.message, "danger");
          }
        }
      });
    });
  }

  renderInvoiceSheet(container, invId) {
    const inv = this.db.invoices.find(i => i.id === invId);
    const vendor = this.db.vendors.find(v => v.id === inv.vendorId);
    
    // Tax calculations
    const formattedSub = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inv.subtotal * 85);
    const formattedGst = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inv.gst * 85);
    const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inv.total * 85);

    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1 style="display:flex; align-items:center; gap:10px;">
            <span style="color:var(--text-muted); font-size: 1.2rem;">PO & Invoices /</span> Billing Sheet ${inv.id}
          </h1>
          <p class="page-subtitle">Review official billing sheet layout. Export, print, or email document templates.</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-secondary" id="back-to-po-list-btn">Back</button>
          <button class="btn btn-secondary" id="print-invoice-btn">Print Document</button>
          <button class="btn btn-secondary" id="download-invoice-btn">Download PDF</button>
          <button class="btn btn-primary" id="email-invoice-btn">Send via Email</button>
        </div>
      </div>

      <!-- Printable Invoice Sheet Panel -->
      <div class="panel" style="padding: 24px;">
        <div class="invoice-sheet" id="invoice-sheet-print-area">
          <div class="invoice-header">
            <div>
              <div class="invoice-logo">VendorBridge</div>
              <div style="font-size: 0.8rem; color:#64748b; margin-top:4px;">Procurement ERP Platform</div>
            </div>
            <div class="invoice-title-block">
              <h2>TAX INVOICE</h2>
              <div class="invoice-meta-info">
                <strong>Invoice ID:</strong> ${inv.id}<br>
                <strong>Date Issued:</strong> ${inv.dateGenerated}<br>
                <strong>PO Reference:</strong> ${inv.poId}<br>
                <strong>Status:</strong> <span style="font-weight:700; color:${inv.status === 'Paid' ? '#059669' : '#d97706'};">${inv.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <!-- Billing Info Row -->
          <div class="invoice-billing-details">
            <div>
              <div class="invoice-billing-title">BILLED BY (SUPPLIER)</div>
              <p>
                <strong>${inv.vendorName}</strong><br>
                ${vendor ? vendor.address : 'Sector 15, Noida, UP'}<br>
                ${vendor ? vendor.country : 'India'}<br>
                <strong>GSTIN:</strong> ${vendor ? vendor.gst : '09AAAAA1111A1Z1'}<br>
                <strong>Contact:</strong> ${vendor ? vendor.contact : ''}
              </p>
            </div>
            <div>
              <div class="invoice-billing-title">BILLED TO (BUYER)</div>
              <p>
                <strong>VendorBridge Corporate Office</strong><br>
                DLF CyberCity, Phase III,<br>
                Gurugram, Haryana - 122002<br>
                <strong>GSTIN:</strong> 06AAAAA9999P1Z9<br>
                <strong>Email:</strong> finance@vendorbridge.com
              </p>
            </div>
          </div>

          <!-- Items list -->
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Product / Line Item Specification</th>
                <th style="text-align:right; width:80px;">Qty</th>
                <th style="text-align:right; width:120px;">Unit Price (INR)</th>
                <th style="text-align:right; width:150px;">Total (INR)</th>
              </tr>
            </thead>
            <tbody>
              ${inv.items.map(item => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td style="text-align:right;">${item.qty}</td>
                  <td style="text-align:right;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * 85)}</td>
                  <td style="text-align:right; font-weight:600;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.qty * 85)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <!-- Totals block -->
          <div class="invoice-totals">
            <table class="invoice-totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align:right; font-weight:600;">${formattedSub}</td>
              </tr>
              <tr>
                <td>GST (18%):</td>
                <td style="text-align:right; font-weight:600;">${formattedGst}</td>
              </tr>
              <tr class="grand-total">
                <td>Grand Total:</td>
                <td style="text-align:right; font-weight:800; color:#059669;">${formattedTotal}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 30px; font-size: 0.8rem; border-top: 1px solid #f1f5f9; padding-top: 15px;">
            <strong>Payment Status / Transaction Notes:</strong><br>
            <span style="color:#475569; font-style:italic;">${inv.notes}</span>
          </div>

          <div class="invoice-footer">
            <p>Thank you for doing business with VendorBridge. This is a computer-generated document and requires no physical signature.</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById("back-to-po-list-btn").addEventListener("click", () => this.navigate("po-invoices"));
    
    // Print logic
    document.getElementById("print-invoice-btn").addEventListener("click", () => {
      window.print();
    });

    // Send email logic
    document.getElementById("email-invoice-btn").addEventListener("click", () => {
      this.openEmailSimulatorModal(invId);
    });

    // Download PDF logic
    document.getElementById("download-invoice-btn").addEventListener("click", () => {
      this.simulatePDFDownload(invId);
    });
  }

  simulatePDFDownload(invId) {
    this.showToast(`Compiling elements for PDF generation...`, "info");
    
    setTimeout(() => {
      // Generate dummy text content and download it as a .txt / mock file
      const inv = this.db.invoices.find(i => i.id === invId);
      const content = `VendorBridge Invoice Report\n==========================\nInvoice ID: ${inv.id}\nPO Ref: ${inv.poId}\nVendor: ${inv.vendorName}\nGrand Total: INR ${(inv.total * 85).toLocaleString()}\nStatus: ${inv.status}\nGenerated: ${inv.dateGenerated}\n`;
      
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showToast(`Downloaded Invoice-${invId}.pdf successfully!`, "success");
      this.logActivity("invoice", `Downloaded PDF statement for ${invId}`);
    }, 1200);
  }

  // Opens simulated popup showing sent email
  openEmailSimulatorModal(invId) {
    const inv = this.db.invoices.find(i => i.id === invId);
    const vendor = this.db.vendors.find(v => v.id === inv.vendorId);
    const targetEmail = vendor ? vendor.email : 'vendor@supplier.com';

    const modalTitle = document.getElementById("modal-title");
    const modalContent = document.getElementById("modal-content");
    
    modalTitle.textContent = "SMTP Email Dispatcher";
    
    modalContent.innerHTML = `
      <div style="font-family:'Courier New', monospace; background-color:#0b0f19; border: 1px solid var(--border); padding: 16px; border-radius: 8px; font-size:0.85rem; margin-bottom: 20px;">
        <div style="color:var(--accent); font-weight:bold; margin-bottom:10px;">[SMTP OUTBOUND CLIENT TRIGGERED]</div>
        <strong>To:</strong> ${targetEmail}<br>
        <strong>From:</strong> accounts-payable@vendorbridge.com<br>
        <strong>Subject:</strong> Tax Invoice Disbursal Notification - ${invId} (PO Ref: ${inv.poId})<br>
        <hr style="border:none; border-top: 1px solid var(--border); margin: 10px 0;">
        Dear Supplier Partner,<br><br>
        This email notifies you that transaction reference <strong>${invId}</strong> for <strong>INR ${(inv.total * 85).toLocaleString()}</strong> has been generated in the system. The transaction is currently marked as: <strong>${inv.status.toUpperCase()}</strong>.<br><br>
        Please review your billing sheets or log into your vendor portal to trace disbursement status.<br><br>
        Regards,<br>
        VendorBridge Finance Department
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button class="btn btn-secondary" id="email-simulator-close">Cancel</button>
        <button class="btn btn-primary" id="email-simulator-send">Send Email</button>
      </div>
    `;

    this.openModal();

    document.getElementById("email-simulator-close").addEventListener("click", () => this.closeModal());
    
    document.getElementById("email-simulator-send").addEventListener("click", () => {
      this.showToast("Broadcasting SMTP email payload...", "info");
      
      setTimeout(() => {
        this.logActivity("invoice", `Dispatched email statement ${invId} notification to ${targetEmail}`);
        this.showToast(`Email dispatched to ${targetEmail} successfully!`, "success");
        this.closeModal();
      }, 1000);
    });
  }

  // ================== SCREEN 9: ACTIVITY LOGS & AUDITS ==================
  renderActivityLogs(container) {
    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1>Global Activity Logs</h1>
          <p class="page-subtitle">Track immutable system audits and transactions in chronological order.</p>
        </div>
        <button class="btn btn-secondary" id="clear-audit-logs-btn">Reset seed state</button>
      </div>

      <div class="panel" style="padding: 16px; margin-bottom: 20px; display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
        <div style="font-size:0.9rem; color:var(--text-muted);">Filter Log Actions:</div>
        <button class="btn btn-secondary btn-sm log-filter-btn active" data-type="all">All Audits</button>
        <button class="btn btn-secondary btn-sm log-filter-btn" data-type="rfq">RFQs</button>
        <button class="btn btn-secondary btn-sm log-filter-btn" data-type="quotation">Quotations</button>
        <button class="btn btn-secondary btn-sm log-filter-btn" data-type="approval">Approvals</button>
        <button class="btn btn-secondary btn-sm log-filter-btn" data-type="po">PO & Invoices</button>
      </div>

      <div class="panel">
        <div class="timeline-feed" id="logs-timeline-container" style="padding-left:15px;">
          ${this.renderActivityItems("all")}
        </div>
      </div>
    `;

    // Filter events
    document.querySelectorAll(".log-filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".log-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const type = btn.getAttribute("data-type");
        document.getElementById("logs-timeline-container").innerHTML = this.renderActivityItems(type);
      });
    });

    document.getElementById("clear-audit-logs-btn").addEventListener("click", () => {
      if (confirm("Are you sure you want to reset the database back to original seed data? This deletes custom RFQs, quotations, approvals, and invoices.")) {
        this.seedDatabase();
        this.showToast("Database seeded successfully!", "success");
        this.render();
      }
    });
  }

  renderActivityItems(type) {
    let list = this.db.activityLogs;
    if (type !== "all") {
      list = list.filter(l => l.type === type || (type === 'po' && l.type === 'invoice'));
    }

    if (list.length === 0) {
      return `<p style="color:var(--text-muted); padding:20px; text-align:center;">No activity items matched.</p>`;
    }

    return list.slice().reverse().map(log => {
      let timelineClass = "";
      if (log.type === "system") timelineClass = "system";
      if (log.type === "approval") timelineClass = "approval";
      if (log.type === "po" || log.type === "invoice") timelineClass = "po";

      const timeText = new Date(log.timestamp).toLocaleString();
      
      return `
        <div class="timeline-item ${timelineClass}" style="margin-bottom:20px;">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <span style="font-weight: 700; color: var(--accent);">${log.user}</span> &mdash; ${log.action}
            <div class="timeline-time">${timeText}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  // ================== SCREEN 10: REPORTS & ANALYTICS ==================
  renderReports(container) {
    // Math statistics
    const totalVendors = this.db.vendors.length;
    const totalApprovedPOValue = this.db.purchaseOrders.reduce((sum, po) => sum + po.total, 0) * 85; // convert to INR
    const totalInvoicePendingValue = this.db.invoices.filter(i => i.status === "Pending Payment").reduce((sum, i) => sum + i.total, 0) * 85;

    // Spending breakdown by Category
    const categoryTotals = {
      "IT & Hardware": 0,
      "Infrastructure & Furnishing": 0,
      "Stationery & Office": 0,
      "Logistics": 0
    };

    // Calculate spend per category
    this.db.purchaseOrders.forEach(po => {
      const vendor = this.db.vendors.find(v => v.id === po.vendorId);
      if (vendor && categoryTotals[vendor.category] !== undefined) {
        categoryTotals[vendor.category] += po.total * 85;
      }
    });

    container.innerHTML = `
      <div class="page-title-area">
        <div>
          <h1>Reports & Procurement Analytics</h1>
          <p class="page-subtitle">Examine company budgets, category-wise allocations, and supplier performance stats.</p>
        </div>
        <button class="btn btn-secondary" id="export-excel-report-btn">Export CSV Report</button>
      </div>

      <!-- Overview Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /></svg>
          </div>
          <div class="stat-info">
            <span class="stat-val">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalApprovedPOValue)}</span>
            <span class="stat-lbl">Total Approved Spend</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2" /></svg>
          </div>
          <div class="stat-info">
            <span class="stat-val">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalInvoicePendingValue)}</span>
            <span class="stat-lbl">Outstanding Liabilities</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orders">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div class="stat-info">
            <span class="stat-val">${this.db.purchaseOrders.length}</span>
            <span class="stat-lbl">Purchase Orders Raised</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>
          </div>
          <div class="stat-info">
            <span class="stat-val">${totalVendors}</span>
            <span class="stat-lbl">Active Bidder Database</span>
          </div>
        </div>
      </div>

      <!-- Charts layout -->
      <div class="analytics-grid">
        <!-- SVG Spend Trends -->
        <div class="panel">
          <h3 class="panel-title" style="margin-bottom:20px;">Procurement Spending Summary (Monthly Trends)</h3>
          <div class="graph-container">
            <div class="graph-axis-y">
              <span>20L</span>
              <span>15L</span>
              <span>10L</span>
              <span>5L</span>
              <span>0</span>
            </div>
            <div class="graph-bars">
              <div class="graph-bar-group">
                <div class="graph-bar" style="height: 15%"></div>
                <div class="graph-bar-label">Jan</div>
              </div>
              <div class="graph-bar-group">
                <div class="graph-bar" style="height: 35%"></div>
                <div class="graph-bar-label">Feb</div>
              </div>
              <div class="graph-bar-group">
                <div class="graph-bar" style="height: 20%"></div>
                <div class="graph-bar-label">Mar</div>
              </div>
              <div class="graph-bar-group">
                <div class="graph-bar" style="height: 55%"></div>
                <div class="graph-bar-label">Apr</div>
              </div>
              <div class="graph-bar-group">
                <div class="graph-bar" style="height: 80%"></div>
                <div class="graph-bar-label">May</div>
              </div>
              <div class="graph-bar-group">
                <div class="graph-bar" style="height: 95%"></div>
                <div class="graph-bar-label">Jun</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Category allocation panel -->
        <div class="panel">
          <h3 class="panel-title" style="margin-bottom:20px;">Allocation by Category</h3>
          <div style="display:flex; flex-direction:column; gap:16px;">
            ${Object.keys(categoryTotals).map(cat => {
              const val = categoryTotals[cat];
              const percent = totalApprovedPOValue > 0 ? (val / totalApprovedPOValue) * 100 : 0;
              
              return `
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                    <span style="font-weight:600;">${cat}</span>
                    <span style="color:var(--accent); font-weight:700;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)} (${percent.toFixed(0)}%)</span>
                  </div>
                  <div style="height:8px; background-color:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;">
                    <div style="width:${percent}%; height:100%; background-color:var(--accent); border-radius:4px; box-shadow:var(--glow);"></div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>

      <!-- Supplier Performance Ranking -->
      <div class="panel" style="margin-top:24px;">
        <h3 class="panel-title" style="margin-bottom:16px;">Vendor Performance Analytics</h3>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Supplier Vendor</th>
                <th>Category Scope</th>
                <th>Avg Rating</th>
                <th>Orders Completed</th>
                <th>Total Value Earned (INR)</th>
                <th>Timeliness score</th>
              </tr>
            </thead>
            <tbody>
              ${this.db.vendors.map(v => {
                const poList = this.db.purchaseOrders.filter(p => p.vendorId === v.id);
                const ordersCount = poList.length;
                const valueEarned = poList.reduce((sum, p) => sum + p.total, 0) * 85;
                
                return `
                  <tr>
                    <td style="font-weight:600;">${v.name}</td>
                    <td>${v.category}</td>
                    <td style="color:var(--warning); font-weight:bold;">★ ${v.rating.toFixed(1)}</td>
                    <td style="font-weight:bold; text-align:center;">${ordersCount}</td>
                    <td style="font-weight:700;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(valueEarned)}</td>
                    <td><span class="badge badge-success">98.2%</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("export-excel-report-btn").addEventListener("click", () => {
      this.simulateCSVExport();
    });
  }

  simulateCSVExport() {
    this.showToast("Assembling CSV tables...", "info");
    
    setTimeout(() => {
      let csv = "Vendor,Category,Rating,Orders,TotalValueINR\n";
      this.db.vendors.forEach(v => {
        const poList = this.db.purchaseOrders.filter(p => p.vendorId === v.id);
        const value = poList.reduce((sum, p) => sum + p.total, 0) * 85;
        csv += `"${v.name}","${v.category}",${v.rating},${poList.length},${value}\n`;
      });
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Vendor-Performance-Report.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showToast("Downloaded Vendor-Performance-Report.csv!", "success");
      this.logActivity("system", "Exported CSV database report summary");
    }, 1200);
  }

  // ================== OTHER MODALS & POPUPS ==================

  // 1. RFQ Details Modal
  openRFQDetailsModal(rfqId) {
    const rfq = this.db.rfqs.find(r => r.id === rfqId);
    if (!rfq) return;

    const modalTitle = document.getElementById("modal-title");
    const modalContent = document.getElementById("modal-content");

    modalTitle.textContent = `${rfq.id}: Details`;
    
    modalContent.innerHTML = `
      <div style="font-size:0.9rem; line-height: 1.6;">
        <h4 style="font-family:'Outfit'; font-size:1.1rem; color:var(--text-main); margin-bottom:6px;">${rfq.title}</h4>
        <p style="color:var(--text-muted); margin-bottom: 15px;">${rfq.description}</p>
        
        <div class="form-row" style="margin-bottom: 20px;">
          <div>
            <strong>Created:</strong> ${rfq.dateCreated}
          </div>
          <div>
            <strong>Deadline:</strong> ${rfq.deadline}
          </div>
          <div>
            <strong>Status:</strong> <span class="badge badge-info">${rfq.status}</span>
          </div>
        </div>

        <h4 style="font-family:'Outfit'; margin-bottom:8px;">Requested Items Checklist:</h4>
        <div class="table-responsive" style="margin-bottom: 20px;">
          <table class="custom-table" style="background-color:rgba(0,0,0,0.08); border-radius:8px;">
            <thead>
              <tr>
                <th>Item Specification</th>
                <th style="text-align:right;">Quantity</th>
                <th style="text-align:right;">Unit</th>
                <th style="text-align:right;">Target Price ($)</th>
              </tr>
            </thead>
            <tbody>
              ${rfq.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align:right; font-weight:bold;">${item.qty}</td>
                  <td style="text-align:right; color:var(--text-muted);">${item.unit}</td>
                  <td style="text-align:right; color:var(--accent); font-weight:600;">$${item.targetPrice}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <h4>Target Distribution:</h4>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom: 20px;">
          ${rfq.assignedVendors.map(vid => {
            const v = this.db.vendors.find(vend => vend.id === vid);
            return v ? v.name : vid;
          }).join(", ")}
        </p>

        <div style="display:flex; justify-content:flex-end;">
          <button class="btn btn-secondary" id="rfq-details-close-btn">Close Panel</button>
        </div>
      </div>
    `;

    this.openModal();
    document.getElementById("rfq-details-close-btn").addEventListener("click", () => this.closeModal());
  }

  // 2. Onboard Vendor Form Modal
  openVendorRegistrationModal() {
    const modalTitle = document.getElementById("modal-title");
    const modalContent = document.getElementById("modal-content");

    modalTitle.textContent = "Onboard Corporate Vendor";

    modalContent.innerHTML = `
      <form id="onboard-vendor-form">
        <div class="form-group">
          <label for="reg-vendor-name">Company Legal Name</label>
          <input type="text" id="reg-vendor-name" class="form-control" placeholder="e.g. Acme Supplies Pvt Ltd" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="reg-vendor-cat">Supply Category</label>
            <select id="reg-vendor-cat" class="form-control">
              <option value="Stationery & Office">Stationery & Office</option>
              <option value="IT & Hardware">IT & Hardware</option>
              <option value="Infrastructure & Furnishing">Infrastructure & Furnishing</option>
              <option value="Logistics">Logistics</option>
            </select>
          </div>
          <div class="form-group">
            <label for="reg-vendor-gst">GSTIN Registration Number</label>
            <input type="text" id="reg-vendor-gst" class="form-control" placeholder="27AAAAA1111A1Z1" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="reg-vendor-email">Contact Email</label>
            <input type="email" id="reg-vendor-email" class="form-control" placeholder="contact@acme.com" required>
          </div>
          <div class="form-group">
            <label for="reg-vendor-phone">Contact Phone</label>
            <input type="text" id="reg-vendor-phone" class="form-control" placeholder="+91 99999 88888" required>
          </div>
        </div>

        <div class="form-group">
          <label for="reg-vendor-addr">Operational Address</label>
          <input type="text" id="reg-vendor-addr" class="form-control" placeholder="Office block, Sector 63, Noida" required>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="btn btn-secondary" id="reg-vendor-close">Cancel</button>
          <button type="submit" class="btn btn-primary">Authorize Registry</button>
        </div>
      </form>
    `;

    this.openModal();

    document.getElementById("reg-vendor-close").addEventListener("click", () => this.closeModal());
    
    document.getElementById("onboard-vendor-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const name = document.getElementById("reg-vendor-name").value;
      const category = document.getElementById("reg-vendor-cat").value;
      const gst = document.getElementById("reg-vendor-gst").value;
      const email = document.getElementById("reg-vendor-email").value;
      const contact = document.getElementById("reg-vendor-phone").value;
      const address = document.getElementById("reg-vendor-addr").value;
      
      try {
        await ApiService.createVendor({
          name, category, email, contact, address, gst, rating: 4.0, status: "Active", country: "India"
        });

        this.logActivity("system", `Onboarded new supplier vendor ${name}`);
        this.showToast(`Vendor ${name} onboarded successfully!`, "success");
        
        this.closeModal();
        await this.render();
      } catch (e) {
        this.showToast(e.message, "danger");
      }
    });
  }

  // 3. System Notifications modal list
  renderNotificationModal() {
    const modalTitle = document.getElementById("modal-title");
    const modalContent = document.getElementById("modal-content");

    modalTitle.textContent = "Recent System Alerts";
    
    // Notifications compiles from recent logs
    const recentLogs = this.db.activityLogs.slice(-10).reverse();

    modalContent.innerHTML = `
      <ul style="list-style:none; display:flex; flex-direction:column; gap:12px;">
        ${recentLogs.map(log => {
          let dotColor = "var(--accent)";
          if (log.type === "approval") dotColor = "var(--warning)";
          if (log.type === "po") dotColor = "#3b82f6";
          
          return `
            <li style="display:flex; gap:12px; font-size:0.85rem; border-bottom: 1px solid var(--border); padding-bottom:8px;">
              <span style="display:inline-block; width:8px; height:8px; background-color:${dotColor}; border-radius:50%; margin-top:5px; flex-shrink:0;"></span>
              <div>
                <strong>${log.user}</strong>: ${log.action}
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${new Date(log.timestamp).toLocaleString()}</div>
              </div>
            </li>
          `;
        }).join("")}
      </ul>
      <div style="display:flex; justify-content:flex-end; margin-top:20px;">
        <button class="btn btn-secondary" id="notif-close-btn">Close Notifications</button>
      </div>
    `;

    this.openModal();
    document.getElementById("notif-close-btn").addEventListener("click", () => this.closeModal());
  }

  // ================== SEARCH FILTERING IMPLEMENTATION ==================
  handleGlobalSearch(query) {
    if (!query) {
      this.render();
      return;
    }

    // Filters visible rows of elements currently inside panels dynamically
    if (this.currentView === "vendors") {
      document.querySelectorAll(".vendor-registry-row").forEach(row => {
        const name = row.getAttribute("data-name");
        const cat = row.getAttribute("data-cat");
        if (name.includes(query) || cat.includes(query)) {
          row.style.display = "table-row";
        } else {
          row.style.display = "none";
        }
      });
    }

    if (this.currentView === "rfqs") {
      document.querySelectorAll(".rfq-registry-row").forEach(row => {
        const title = row.getAttribute("data-title");
        const desc = row.getAttribute("data-desc");
        if (title.includes(query) || desc.includes(query)) {
          row.style.display = "table-row";
        } else {
          row.style.display = "none";
        }
      });
    }
  }

  // ================== HELPER UI UTILS ==================
  
  openModal() {
    document.getElementById("modal-overlay").classList.add("active");
  }

  closeModal() {
    document.getElementById("modal-overlay").classList.remove("active");
  }

  setLoading(isLoading, text = "Processing...") {
    const loader = document.getElementById("global-loader");
    if (loader) {
      if (isLoading) {
        loader.querySelector(".loader-text").textContent = text;
        loader.classList.add("active");
      } else {
        loader.classList.remove("active");
      }
    }
  }

  async logActivity(type, action) {
    try {
      await ApiService.createLog({ type, action });
    } catch (e) {
      console.error("Failed to log activity", e);
    }
  }

  handleLogout() {
    localStorage.removeItem("vendorbridge_token");
    this.currentUser = null;
    this.initSession();
    this.showToast("Logged out safely.", "info");
  }

  showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:18px; height:18px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    if (type === "warning" || type === "danger") {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:18px; height:18px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-message">${message}</div>
      <button class="toast-close">✕</button>
    `;

    container.appendChild(toast);

    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      setTimeout(() => container.removeChild(toast), 300);
    });

    // Auto-remove toast
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        setTimeout(() => {
          if (toast.parentElement) container.removeChild(toast);
        }, 300);
      }
    }, 4000);
  }

  // Auth Layout Handlers
  showLoginTab() {
    document.getElementById("tab-login").classList.add("active");
    document.getElementById("tab-signup").classList.remove("active");
    document.getElementById("login-form").style.display = "block";
    document.getElementById("signup-form").style.display = "none";
  }

  showSignupTab() {
    document.getElementById("tab-signup").classList.add("active");
    document.getElementById("tab-login").classList.remove("active");
    document.getElementById("signup-form").style.display = "block";
    document.getElementById("login-form").style.display = "none";
  }

  async handleLoginDirect(email, password) {
    this.setLoading(true, "Authenticating...");
    try {
      const response = await ApiService.login(email, password);
      localStorage.setItem("vendorbridge_token", response.token);
      this.currentUser = response.user;
      await this.initSession();
      this.showToast(`Logged in successfully as ${this.currentUser.name}!`, "success");
      this.logActivity("system", "User logged in");
    } catch (e) {
      this.showToast(e.message, "danger");
    } finally {
      this.setLoading(false);
    }
  }

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value;
    this.handleLoginDirect(email, pass);
  }

  async handleSignup(e) {
    e.preventDefault();
    this.setLoading(true, "Creating account...");
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const role = document.getElementById("signup-role").value;
    const password = document.getElementById("signup-password").value;

    const names = name.split(" ");
    const first_name = names[0];
    const last_name = names.slice(1).join(" ") || "";

    try {
      await ApiService.register({ first_name, last_name, email, password, role });
      this.showToast("Account created successfully! Please login.", "success");
      this.showLoginTab();
    } catch (e) {
      this.showToast(e.message, "danger");
    } finally {
      this.setLoading(false);
    }
  }
}

// Instantiate App on content load
document.addEventListener("DOMContentLoaded", () => {
  window.app = new VendorBridgeERP();
});
