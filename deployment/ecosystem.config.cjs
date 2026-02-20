// PM2 Ecosystem Configuration for Relm Care+
// Production & Staging environments

module.exports = {
  apps: [
    // ============================================
    // PRODUCTION
    // ============================================
    {
      name: 'relm-careplus-prod-backend',
      cwd: '/var/www/relm-careplus-prod/backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/www/relm-careplus-prod/backend/logs/error.log',
      out_file: '/var/www/relm-careplus-prod/backend/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // STAGING
    // ============================================
    {
      name: 'relm-careplus-staging-backend',
      cwd: '/var/www/relm-careplus-staging/backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 3002,
      },
      error_file: '/var/www/relm-careplus-staging/backend/logs/error.log',
      out_file: '/var/www/relm-careplus-staging/backend/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '300M',
    },
  ],
};
