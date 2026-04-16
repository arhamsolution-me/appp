/**
 * EduAI API Utility
 * Handles 12 Groq Keys Rotation & Tavily Search
 */

const GROQ_KEYS = (process.env.EXPO_PUBLIC_GROQ_API_KEYS || "").split(",");
let currentKeyIndex = 0;

/**
 * Returns a Groq API Key and rotates the index
 */
const getNextGroqKey = () => {
    if (GROQ_KEYS.length === 0) return null;
    const key = GROQ_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
    return key;
};

/**
 * Main function to get AI response with rotation support
 */
export const getAIResponse = async (prompt, systemMessage = "You are an educational assistant.", base64Data = "", mimeType = "image/jpeg") => {
    const key = getNextGroqKey();
    if (!key) throw new Error("No API Keys found in .env");

    try {
        const messages: any = [
            { role: "system", content: systemMessage },
        ];

        if (base64Data) {
            let cleanedBase64 = base64Data;
            if (base64Data.includes(',')) cleanedBase64 = base64Data.split(',').pop() || "";
            
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { 
                      type: "image_url", 
                      image_url: { url: `data:${mimeType};base64,${cleanedBase64}` } 
                    }
                ]
            });
        } else {
            messages.push({ role: "user", content: prompt });
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            },
            body: JSON.stringify({
                model: base64Data ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.error && (data.error.code === "rate_limit_exceeded" || response.status === 429)) {
            console.warn("Groq Rate Limit - Rotating Key...");
            return getAIResponse(prompt, systemMessage, base64Data, mimeType);
        }

        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        }
        
        throw new Error("Groq Parse Error");
    } catch (error) {
        console.error("Groq API Error:", error);
        if (currentKeyIndex < GROQ_KEYS.length) {
            return getAIResponse(prompt, systemMessage, base64Data, mimeType);
        }
        return await getGeminiResponse(prompt, base64Data, mimeType);
    }
};

/**
 * Gemini API Fallback
 */
export const getGeminiResponse = async (prompt, base64Data = "", mimeType = "image/jpeg") => {
    const apiKey = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || "").trim();
    if (!apiKey) return "Thinking error. Please retry.";

    try {
        const body: any = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        if (base64Data) {
            let cleanedBase64 = base64Data;
            if (base64Data.includes(',')) cleanedBase64 = base64Data.split(',').pop() || "";
            
            body.contents[0].parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: cleanedBase64
                }
            });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        }
        return "Thinking error (Gemini). Please retry.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Thinking error. Please retry.";
    }
};

/**
 * Tavily Search for Web Research
 */
export const searchWeb = async (query) => {
    const apiKey = (process.env.EXPO_PUBLIC_TAVILY_API_KEY || "").trim();
    if (!apiKey) {
        console.warn("Tavily API Key missing - falling back to direct AI thinking.");
        return null;
    }

    try {
        console.log("Researching via Tavily Protocol (Search/POST/JSON)...");
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "basic",
                max_results: 3
            })
        });

        if (!response.ok) {
            console.error("Tavily API responded with status:", response.status);
            return null;
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        // Log protocol failure without crashing the pipeline
        console.warn("Tavily Network Connection Protocol Failed:", query);
        return null;
    }
};

/**
 * 🎓 Academic Studio Core
 * Processes document scans using a zero-cost OCR-to-Text pipeline.
 * Powered by Groq Llama 3.3 (12-Key Rotation).
 */
export const getAcademicStudioAI = async (prompt, base64Data = "", mimeType = "image/jpeg") => {
    try {
        let extractedText = "";
        const isImage = mimeType?.startsWith('image/');
        
        let cleanedBase64 = base64Data;
        if (base64Data.includes(',')) {
            cleanedBase64 = base64Data.split(',').pop() || "";
        }

        // 🔍 PHASE 1: OCR Extraction (FREE OCR.space Engine 2)
        if (cleanedBase64 && isImage) {
            console.log("Analyzing academic scan via OCR.space...");
            
            const formData = new FormData();
            formData.append('base64Image', `data:${mimeType};base64,${cleanedBase64}`);
            formData.append('language', 'eng');
            formData.append('isOverlayRequired', 'false');
            formData.append('filetype', mimeType.split('/')[1] || 'jpg');
            formData.append('apikey', 'K87768568588957'); 
            formData.append('OCREngine', '2'); // Engine 2: Optimized for dense academic text

            const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
                method: "POST",
                body: formData
            });

            const ocrData = await ocrResponse.json();
            
            if (ocrData.OCRExitCode === 1 && ocrData.ParsedResults?.length > 0) {
                extractedText = ocrData.ParsedResults[0].ParsedText;
            } else {
                const ocrError = ocrData.ErrorMessage?.[0] || "";
                console.error("Studio Scan Error:", ocrError);
                if (ocrError.includes("exceeds the maximum size limit")) return "Scan too big (max 1MB). Lowering resolution—try again!";
                return "Scanning engine busy. Please try again in 5 seconds.";
            }
        } else {
            extractedText = base64Data; // Direct text handling for Writer/Grammar Canvas
        }

        if (!extractedText && isImage) {
            console.log("OCR.space yielded no results. Re-probing via Groq Llama 3.2 Vision...");
            return await getAIResponse(prompt, "You are a professional Academic Studio Engine.", cleanedBase64, mimeType);
        }

        if (!extractedText && !isImage) return "No text provided for analysis.";

        // 🧠 PHASE 2: Deep Analysis (Strictly Groq-Llama)
        const academicPrompt = `
        STUDIO CONTEXT:
        ${extractedText}
        
        TASK: ${prompt}
        
        REQUIREMENTS: 
        1. Base your entire answer ON THE TEXT ABOVE.
        2. Deliver the final professional solution immediately.
        3. Use formatting marks (** and [HIGHLIGHT]) for key points.
        `;

        return await getAIResponse(academicPrompt, "You are a professional Academic Studio Engine.");

    } catch (error) {
        console.error("Studio Pipeline Error:", error);
        return "Network connection issue. Please check your signal and retry.";
    }
};
