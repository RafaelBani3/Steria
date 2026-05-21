import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const userId = '3bd528ed-c5ab-4acd-96a2-d7838ad551f3';
const token = jwt.sign({ userId }, process.env.JWT_SECRET);

console.log("Token:", token);

async function testApi() {
  try {
    const res = await fetch('http://localhost:5001/api/accounts/summary', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const json = await res.json();
    console.log("Response status:", res.status);
    console.log("Response structure keys:", Object.keys(json));
    console.log("First account details:", json.accounts?.[0]);
  } catch (error) {
    console.error("Test API error:", error);
  }
}

testApi();
