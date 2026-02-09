const API_KEY = "AIzaSyD0dKR5xmfPv-CLzj73STdx7qIZZFlXBO8";

async function listModels() {
    try {
        // Use native fetch (Node 18+)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);

        if (!response.ok) {
            const text = await response.text();
            console.error(`Error ${response.status}: ${text}`);
            return;
        }

        const data = await response.json();
        console.log("Available Models:");

        if (data.models) {
            // Filter and print models that support content generation
            const textModels = data.models.filter(m =>
                m.supportedGenerationMethods &&
                m.supportedGenerationMethods.includes("generateContent")
            );

            textModels.forEach(model => {
                console.log(model.name);
            });
        } else {
            console.log("No models found in response.");
        }
    } catch (error) {
        console.error("Script execution failed:", error);
    }
}

listModels();
