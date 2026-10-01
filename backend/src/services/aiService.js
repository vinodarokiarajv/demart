const config = require("../config");

async function generateResponse(prompt, options = {}) {
    if (!prompt || typeof prompt !== "string") {
        throw new Error("AI prompt is required");
    }

    const provider = config.ai.provider;

    if (provider === "ollama") {
        return await generateWithOllama(prompt, options);
    }

    throw new Error(
        `Unsupported AI provider: ${provider}`
    );
}

async function generateWithOllama(prompt, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, config.ai.timeoutMs);

    try {
        const response = await fetch(
            `${config.ai.ollama.baseUrl}/api/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: config.ai.ollama.model,
                    prompt,
                    stream: false,
                    think: options.think ??
                        config.ai.ollama.think
                }),
                signal: controller.signal
            }
        );

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                `Ollama request failed (${response.status}): ${errorText}`
            );
        }

        const data = await response.json();

        if (
            !data ||
            typeof data.response !== "string"
        ) {
            throw new Error(
                "Ollama returned an invalid AI response"
            );
        }

        return {
            text: data.response.trim(),
            model: data.model || config.ai.ollama.model,
            provider: "ollama",
            done: data.done === true
        };
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(
                "AI request timed out"
            );
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = {
    generateResponse
};