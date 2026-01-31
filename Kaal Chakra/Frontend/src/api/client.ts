import type { MasterEvent } from "../types";

const API_BASE_URL = "http://localhost:8000/api";

const fetchEndpoint = async (endpoint: string, limit: number = 1000, offset: number = 0): Promise<MasterEvent[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}?limit=${limit}&offset=${offset}`);
        if (!response.ok) {
            console.warn(`Failed to fetch ${endpoint}: ${response.statusText}`);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return [];
    }
};

export const fetchLogs = (limit = 1000, offset = 0) => fetchEndpoint("logs", limit, offset);
export const fetchCalls = (limit = 1000, offset = 0) => fetchEndpoint("calls", limit, offset);
export const fetchSMS = (limit = 1000, offset = 0) => fetchEndpoint("sms", limit, offset);
export const fetchFiles = (limit = 1000, offset = 0) => fetchEndpoint("files", limit, offset);
