const API_URL = 'http://localhost:5000/api';  // Update with your backend URL

export const inferenceService = {
  async performInference(model, file) {
    try {
      const formData = new FormData();
      formData.append('model', model);
      formData.append('file', file);

      const response = await fetch(`${API_URL}/inference`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error during inference:', error);
      throw error;
    }
  },

  async getModelInfo(modelName) {
    try {
      const response = await fetch(`${API_URL}/models/${modelName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching model info:', error);
      throw error;
    }
  }
};