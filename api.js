const API_BASE_URL = "http://localhost:5000/api";

class ApiService {
  static getHeaders() {
    const token = localStorage.getItem("vendorbridge_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: { ...this.getHeaders(), ...options.headers },
      });
    } catch (networkError) {
      throw new Error("Network error: Unable to connect to the server.");
    }

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}`);
      }
      return text;
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || "Something went wrong");
    }
    return data;
  }

  static async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  static async getVendors() {
    return this.request("/vendors");
  }

  static async createVendor(vendorData) {
    return this.request("/vendors", {
      method: "POST",
      body: JSON.stringify(vendorData),
    });
  }

  static async getRFQs() {
    return this.request("/rfqs");
  }

  static async createRFQ(rfqData) {
    return this.request("/rfqs", {
      method: "POST",
      body: JSON.stringify(rfqData),
    });
  }

  static async getQuotations(rfqId) {
    const endpoint = rfqId ? `/quotations?rfqId=${rfqId}` : "/quotations";
    return this.request(endpoint);
  }

  static async createQuotation(quotationData) {
    return this.request("/quotations", {
      method: "POST",
      body: JSON.stringify(quotationData),
    });
  }

  static async getApprovals() {
    return this.request("/approvals");
  }

  static async createApproval(approvalData) {
    return this.request("/approvals", {
      method: "POST",
      body: JSON.stringify(approvalData),
    });
  }

  static async updateApproval(id, decisionData) {
    return this.request(`/approvals/${id}`, {
      method: "PUT",
      body: JSON.stringify(decisionData),
    });
  }

  static async getPurchaseOrders() {
    return this.request("/purchase-orders");
  }

  static async createPurchaseOrder(poData) {
    return this.request("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(poData),
    });
  }

  static async getInvoices() {
    return this.request("/invoices");
  }

  static async createInvoice(invoiceData) {
    return this.request("/invoices", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });
  }

  static async payInvoice(id, notes) {
    return this.request(`/invoices/${id}/pay`, {
      method: "PUT",
      body: JSON.stringify({ notes }),
    });
  }

  static async getLogs() {
    return this.request("/logs");
  }

  static async createLog(logData) {
    return this.request("/logs", {
      method: "POST",
      body: JSON.stringify(logData),
    });
  }
}

window.ApiService = ApiService;