/* ==========================================================================
   SIMORA - login.js
   ========================================================================== */

const DUMMY_USERNAME = 'admin';
const DUMMY_PASSWORD = 'admin123';

document.addEventListener('DOMContentLoaded', () => {
  // Jika sudah login, langsung arahkan ke dashboard
  if (localStorage.getItem('simora_logged_in') === 'true' && localStorage.getItem('simora_role') === 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('loginError');
  const togglePass = document.getElementById('togglePass');
  const loginBtnText = document.getElementById('loginBtnText');

  // Isi kembali username jika "ingat saya" pernah dicentang
  const savedUsername = localStorage.getItem('simora_remember_username');
  if (savedUsername) {
    usernameInput.value = savedUsername;
    document.getElementById('rememberMe').checked = true;
  }

  togglePass.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePass.innerHTML = isPassword
      ? '<i class="fa-solid fa-eye-slash"></i>'
      : '<i class="fa-solid fa-eye"></i>';
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!username || !password) {
      showError('Username dan password wajib diisi.');
      return;
    }

    const submitBtn = loginForm.querySelector('.btn-login');
    submitBtn.disabled = true;
    loginBtnText.textContent = 'Memproses...';

    try {
      let success = false;
      let adminName = 'Administrator';

      if (USE_API) {
        // ==== Integrasi backend Express + PostgreSQL ====
        const res = await apiRequest(API_ENDPOINTS.login, 'POST', { username, password, role: 'admin' });
        success = !!res.token || !!res.success;
        adminName = res.nama || res.name || 'Administrator';
      } else {
        // ==== Mode dummy (tanpa backend) ====
        await new Promise(r => setTimeout(r, 600)); // simulasi loading
        if (username === DUMMY_USERNAME && password === DUMMY_PASSWORD) {
          success = true;
          adminName = 'Admin SIMORA';
        }
      }

      if (success) {
        localStorage.setItem('simora_logged_in', 'true');
        localStorage.setItem('simora_admin_name', adminName);
        localStorage.setItem('simora_role', 'admin');
        if (rememberMe) {
          localStorage.setItem('simora_remember_username', username);
        } else {
          localStorage.removeItem('simora_remember_username');
        }
        window.location.href = 'dashboard.html';
      } else {
        showError('Username atau password salah. Silakan coba lagi.');
        submitBtn.disabled = false;
        loginBtnText.textContent = 'Login';
      }
    } catch (err) {
      showError('Terjadi kesalahan koneksi ke server.');
      submitBtn.disabled = false;
      loginBtnText.textContent = 'Login';
    }
  });

  function showError(msg) {
    loginError.textContent = msg;
    loginError.classList.add('active');
  }

  function hideError() {
    loginError.classList.remove('active');
    loginError.textContent = '';
  }
});
