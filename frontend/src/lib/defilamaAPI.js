// Simple DefiLlama API wrapper
export class DefiLlamaAPI {
  static async getAllProtocolsData() {
    try {
      const response = await fetch('https://api.llama.fi/protocols');
      if (!response.ok) {
        throw new Error('Failed to fetch protocols data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching DefiLlama data:', error);
      return [];
    }
  }
}