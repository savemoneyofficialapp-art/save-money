export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    authorization: token || ""
  };

  return fetch(url, {
    ...options,
    headers
  });
}