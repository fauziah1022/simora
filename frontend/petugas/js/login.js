/* ==========================================================================
   SIMORA - login.js (Petugas)
   Setiap petugas punya username & password unik per cabang.
   Password di-hash (SHA-256) - tidak pernah disimpan/dibandingkan dalam bentuk teks polos.
   CATATAN: SHA-256 di sisi browser ini untuk simulasi keamanan pada frontend-only demo.
   Saat terhubung ke backend Express, autentikasi & hashing password (mis. bcrypt)
   WAJIB dilakukan di server, endpoint ini hanya mengirim kredensial via HTTPS.
   ========================================================================== */

// Akun demo per cabang (password sudah di-hash SHA-256, bukan teks polos)
const PETUGAS_ACCOUNTS = [
  { username: 'budi.pusat', passwordHash: 'bd4f4a153212103fc7f240fb4073f73b5993187d7bc8740a419c96e9b14935b6', cabang: 'Pusat', nama: 'Budi Setiawan' },
  { username: 'sari.bandung', passwordHash: '99a54f03f63b6f0bf4c06b3e9cdc20c0678fc8f9fdb1922e53bfae8fa19656bb', cabang: 'Bandung', nama: 'Sari Ramadhani' },
  { username: 'asep.garut', passwordHash: '04c0585194c6ae2cc15bb22a9918797251a96eed77246e887592d93df971dbfc', cabang: 'Garut', nama: 'Asep Kurniawan' },
  { username: 'wati.tasik', passwordHash: '6ede9df78042aec089506237f3103c9138358ffaca8ea86baadc4e5b21fcdf42', cabang: 'Tasikmalaya', nama: 'Wati Nuraeni' },
];

async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Jika sudah login, langsung arahkan ke dashboard
  if (localStorage.getItem('simora_logged_in') === 'true' && localStorage.getItem('simora_role') === 'petugas') {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('loginError');
  const togglePass = document.getElementById('togglePass');
  const loginBtnText = document.getElementById('loginBtnText');

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
      let adminName = 'Petugas';
      let cabang = '';

      if (USE_API) {
        // ==== Integrasi backend Express + PostgreSQL ====
        // Hashing & verifikasi password sesungguhnya dilakukan di server (mis. bcrypt).
        const res = await apiRequest(API_ENDPOINTS.login, 'POST', { username, password, role: 'petugas' });
        success = !!res.token || !!res.success;
        adminName = res.nama || res.name || 'Petugas';
        cabang = res.cabang || '';
      } else {
        // ==== Mode dummy (tanpa backend) - password dicocokkan via hash SHA-256 ====
        await new Promise(r => setTimeout(r, 500)); // simulasi loading
        const account = PETUGAS_ACCOUNTS.find(a => a.username === username);
        if (account) {
          const inputHash = await sha256Hex(password);
          if (inputHash === account.passwordHash) {
            success = true;
            adminName = account.nama;
            cabang = account.cabang;
          }
        }
      }

      if (success) {
        localStorage.setItem('simora_logged_in', 'true');
        localStorage.setItem('simora_admin_name', adminName);
        localStorage.setItem('simora_role', 'petugas');
        localStorage.setItem('simora_cabang', cabang);
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
