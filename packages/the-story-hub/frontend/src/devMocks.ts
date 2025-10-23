// Lightweight dev-mock loader for TheStoryHub frontend
// Usage (async): const users = await loadMockUsers()

export async function loadMockUsers(): Promise<unknown[]> {
  if (process.env.NODE_ENV !== "development") return [];
  try {
    // dynamic import of the frontend-local dev-mocks JSON file
    const mod = await import("./dev-mocks/mockUsers.json");
    return mod?.default || [];
  } catch {
    return [];
  }
}

export default { loadMockUsers };
