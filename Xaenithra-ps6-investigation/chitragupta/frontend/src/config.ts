const config = {
    // Auto-detects if running on localhost or a real domain
    // But defaults to localhost ports for the backend services since they run locally
    INDRJAAL_API: "http://localhost:5000",   // Extraction Engine
    SUDARSHANA_API: "http://localhost:8000", // Threat Engine (Python)
    CHITRAGUPTA_API: "http://localhost:8000", // Report Engine (Python)

    // Websockets
    SUDARSHANA_WS: "ws://localhost:8000/ws/sudarshana",
};

export default config;
