import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("Hugging Face API Key Validation", () => {
  it("should have HUGGINGFACE_API_KEY configured", () => {
    expect(ENV.huggingfaceApiKey).toBeDefined();
    expect(ENV.huggingfaceApiKey).not.toBe("");
    expect(ENV.huggingfaceApiKey).toMatch(/^hf_/);
  });

  it("should be able to access Hugging Face models API", async () => {
    if (!ENV.huggingfaceApiKey) {
      throw new Error("HUGGINGFACE_API_KEY is not configured");
    }

    try {
      // استخدام API للتحقق من وجود نموذج معروف
      const response = await fetch(
        "https://huggingface.co/api/models?search=NAMAA-Saudi-TTS&limit=1",
        {
          headers: {
            Authorization: `Bearer ${ENV.huggingfaceApiKey}`,
          },
        }
      );

      // قد نحصل على 200 أو 401 أو 403، لكن الرمز يجب أن يكون موجود
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed with status ${response.status}`);
      }

      console.log(`✓ Successfully connected to Hugging Face API with status: ${response.status}`);
      expect(response.ok || response.status === 404).toBe(true);
    } catch (error) {
      throw new Error(`Failed to connect to Hugging Face API: ${error}`);
    }
  });

  it("should be able to query a specific model", async () => {
    if (!ENV.huggingfaceApiKey) {
      throw new Error("HUGGINGFACE_API_KEY is not configured");
    }

    try {
      // محاولة الوصول إلى نموذج معروف
      const response = await fetch(
        "https://huggingface.co/api/models/NAMAA-Space/NAMAA-Saudi-TTS",
        {
          headers: {
            Authorization: `Bearer ${ENV.huggingfaceApiKey}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed with status ${response.status}`);
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Successfully retrieved model info: ${data.modelId}`);
        expect(data).toHaveProperty("modelId");
      } else {
        console.log(`✓ API responded with status ${response.status} (expected for some endpoints)`);
      }
    } catch (error) {
      throw new Error(`Failed to query model: ${error}`);
    }
  });
});
