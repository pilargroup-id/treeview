export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('authToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.href = '/';
    return null;
  }

  return response;
}