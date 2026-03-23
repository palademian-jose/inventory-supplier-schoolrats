import client from "./client";

export const loginRequest = async (payload) => {
  const { data } = await client.post("/auth/login", payload);
  return data;
};

export const fetchSummary = async () => {
  const { data } = await client.get("/dashboard/summary");
  return data;
};

export const fetchResource = async (endpoint, params) => {
  const { data } = await client.get(endpoint, { params });
  return data;
};

export const createResource = async (endpoint, payload) => {
  const { data } = await client.post(endpoint, payload);
  return data;
};

export const updateResource = async (endpoint, id, payload) => {
  const { data } = await client.put(`${endpoint}/${id}`, payload);
  return data;
};

export const deleteResource = async (endpoint, id) => {
  const { data } = await client.delete(`${endpoint}/${id}`);
  return data;
};

export const patchResource = async (endpoint, id, payload) => {
  const { data } = await client.patch(`${endpoint}/${id}`, payload);
  return data;
};
