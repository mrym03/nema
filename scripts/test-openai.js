/**
 * Test script for OpenAI API integration
 *
 * Run with: node scripts/test-openai.js
 * Make sure you have a valid EXPO_PUBLIC_OPENAI_API_KEY in your .env file
 */

// Load environment variables from .env file
require("dotenv").config();

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

async function testOpenAIConnection() {
  console.log("Testing OpenAI API connection...");

  if (!OPENAI_API_KEY) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "Error: No OpenAI API key found in your .env file.\n" +
        "Please add your API key to the .env file like this:\n" +
        "EXPO_PUBLIC_OPENAI_API_KEY=your-api-key-here"
    );
    return false;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful meal planning assistant.",
          },
          {
            role: "user",
            content:
              "Please provide a simple test response in JSON format with a success field set to true.",
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("\x1b[31m%s\x1b[0m", "API Error:", errorText);
      return false;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const parsedResponse = JSON.parse(content);
      console.log(
        "\x1b[32m%s\x1b[0m",
        "✅ Success! OpenAI API connection works correctly."
      );
      console.log("API Response:", parsedResponse);
      return true;
    } catch (e) {
      console.error("\x1b[31m%s\x1b[0m", "Error parsing JSON response:", e);
      console.log("Raw response:", content);
      return false;
    }
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "Error calling OpenAI API:", error);
    return false;
  }
}

// Run the test
testOpenAIConnection();
