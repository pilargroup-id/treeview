// src/utils/mockAuth.js
export async function injectMockAuth() {
  if (localStorage.getItem('authToken')) return;

  try {
    const url = `${import.meta.env.VITE_PILARGROUP_LOCAL_URL}/api/auth/login`;
    console.log('[mockAuth] hitting:', url);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: import.meta.env.VITE_MOCK_USERNAME,
        password: import.meta.env.VITE_MOCK_PASSWORD,
      }),
    });

    console.log('[mockAuth] status:', res.status);
    const data = await res.json();
    console.log('[mockAuth] response:', data);

    if (!res.ok) {
      console.error('[mockAuth] Login gagal');
      return;
    }

    // treeview pakai 'authToken' bukan 'token'
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));

  } catch (e) {
    console.error('[mockAuth] Error:', e.message);
  }
}