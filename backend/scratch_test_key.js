// No import needed for fetch in Node 18+
import dotenv from 'dotenv';
dotenv.config();

async function testKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
      console.log('Success! Available models:');
      data.models.forEach(m => console.log(m.name));
    } else {
      console.error('Error:', data);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testKey();
