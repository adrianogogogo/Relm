module.exports = {
  apps: [{
    name: 'relm-careplus-backend',
    script: './dist/main.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3005,
      DATABASE_URL: 'postgresql://relm_user:Relm@2026!Secure@localhost:5432/relm_careplus_prod?schema=public',
      JWT_SECRET: 'relm-care-plus-ultra-secret-production-key-2026-minimum-32-chars',
      JWT_EXPIRES_IN: '7d',
      JWT_REFRESH_SECRET: 'relm-care-plus-refresh-secret-key-production-2026-ultra-secure-64-chars',
      JWT_REFRESH_EXPIRES_IN: '30d',
      CORS_ORIGIN: 'http://177.153.62.248',
      APP_URL: 'http://177.153.62.248',
    },
    error_file: '/var/log/pm2/relm-careplus-backend-error.log',
    out_file: '/var/log/pm2/relm-careplus-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
  }]
};
