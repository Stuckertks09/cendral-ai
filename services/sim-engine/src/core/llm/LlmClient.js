// src/core/llm/LlmClient.js
import OpenAI from "openai";

export default class LlmClient {
  constructor({ apiKey, model = "gpt-4.1-mini" }) {
    if (!apiKey) throw new Error("LlmClient: Missing OpenAI API key");

    // RAW OpenAI V4 Client
    this.raw = new OpenAI({ apiKey });

    // Default model for wrapper generate()
    this.model = model;
  }

  async generate({ system, user, temperature = 0.7 }) {
    const result = await this.raw.chat.completions.create({
      model: this.model,
      temperature,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: user }
      ]
    });

    return result.choices[0].message.content;
  }
}
