/**
 * Logger sederhana dengan prefix & warna, dipakai di seluruh backend
 * agar output console konsisten dan mudah dibaca saat development.
 */

const warna = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function timestamp() {
  return new Date().toLocaleString('id-ID', { hour12: false });
}

const logger = {
  info: (pesan) => console.log(`${warna.cyan}[INFO]${warna.reset} ${timestamp()} - ${pesan}`),
  success: (pesan) => console.log(`${warna.green}[SUKSES]${warna.reset} ${timestamp()} - ${pesan}`),
  warn: (pesan) => console.log(`${warna.yellow}[PERINGATAN]${warna.reset} ${timestamp()} - ${pesan}`),
  error: (pesan) => console.log(`${warna.red}[ERROR]${warna.reset} ${timestamp()} - ${pesan}`),
  node: (pesan) => console.log(`${warna.magenta}[NODE]${warna.reset} ${timestamp()} - ${pesan}`),
};

module.exports = logger;
