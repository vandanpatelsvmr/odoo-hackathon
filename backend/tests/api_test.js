/**
 * Manual API Test Script for VendorBridge ERP
 * Run this while the server is running to verify endpoints.
 */

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("🚀 Starting API Tests...");
  let token = "";

  try {
    // 1. Test Auth - Register
    console.log("\n1. Testing Register...");
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: "Test",
        last_name: "User",
        email: `test_${Date.now()}@example.com`,
        password: "Password123",
        role: "procurement_officer"
      })
    });
    const regData = await regRes.json();
    if (regRes.ok) console.log("✅ Register Success");
    else console.log("❌ Register Failed:", regData.message);

    // 2. Test Auth - Login
    console.log("\n2. Testing Login...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@vendorbridge.com",
        password: "password"
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.ok) {
      token = loginData.token;
      console.log("✅ Login Success");
    } else {
      console.log("❌ Login Failed:", loginData.message);
      return;
    }

    // 3. Test Vendors - List
    console.log("\n3. Testing Get Vendors...");
    const vendorRes = await fetch(`${BASE_URL}/vendors`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const vendorData = await vendorRes.json();
    if (vendorRes.ok) console.log(`✅ Get Vendors Success (${vendorData.vendors.length} found)`);
    else console.log("❌ Get Vendors Failed");

    // 4. Test RFQs - List
    console.log("\n4. Testing Get RFQs...");
    const rfqRes = await fetch(`${BASE_URL}/rfqs`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const rfqData = await rfqRes.json();
    if (rfqRes.ok) console.log(`✅ Get RFQs Success (${rfqData.rfqs.length} found)`);
    else console.log("❌ Get RFQs Failed");

    // 5. Test Logs - List
    console.log("\n5. Testing Get Logs...");
    const logRes = await fetch(`${BASE_URL}/logs`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const logData = await logRes.json();
    if (logRes.ok) console.log(`✅ Get Logs Success (${logData.logs.length} found)`);
    else console.log("❌ Get Logs Failed");

    console.log("\n🏁 All basic API tests completed!");
  } catch (error) {
    console.error("\n💥 Test Suite Crashed:", error.message);
    console.log("Make sure the server is running on http://localhost:5000");
  }
}

runTests();