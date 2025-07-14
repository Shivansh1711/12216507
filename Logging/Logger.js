const fetch = require('node-fetch');

const STACKS = ['backend', 'frontend'];
const LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const BACKEND_PACKAGES = ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'];
const FRONTEND_PACKAGES = ['api', 'component', 'hook', 'page', 'state', 'style'];
const BOTH_PACKAGES = ['auth', 'config', 'middleware', 'utils'];

const access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJvamhhcmlzaHUwMDBAZ21haWwuY29tIiwiZXhwIjoxNzUyNDc0ODU1LCJpYXQiOjE3NTI0NzM5NTUsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiIwNzExMjViNi0zYmQzLTQ3MGItODYzZi0wNzhjNDQ2ZjRkZGYiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJzaGl2YW5zaCBrdW1hciBvamhhIiwic3ViIjoiZTVhM2RkMTAtMjE5NS00OTVkLTg3YjgtYjI5ZDljNGY1M2I0In0sImVtYWlsIjoib2poYXJpc2h1MDAwQGdtYWlsLmNvbSIsIm5hbWUiOiJzaGl2YW5zaCBrdW1hciBvamhhIiwicm9sbE5vIjoiMTIyMTY1MDciLCJhY2Nlc3NDb2RlIjoiQ1p5cFFLIiwiY2xpZW50SUQiOiJlNWEzZGQxMC0yMTk1LTQ5NWQtODdiOC1iMjlkOWM0ZjUzYjQiLCJjbGllbnRTZWNyZXQiOiJzU0NHcFRSWEVrYlFFd0hjIn0.-IQau5HlS4Ax2QRj4rwb_Fc47TXyZxcLRvVgfHjlwbw";

const LOGGING_ENDPOINT = 'http://20.244.56.144/evaluation-service/logs';

/**
 * @param {string} stack - "backend" or "frontend"
 * @param {string} level - "debug", "info", "warn", "error", "fatal"
 * @param {string} pkg - see allowed values above
 * @param {string} message - descriptive log message
 */
async function Log(stack, level, pkg, message) {
  // Validation
  if (!STACKS.includes(stack)) throw new Error('Invalid stack');
  if (!LEVELS.includes(level)) throw new Error('Invalid level');
  if (
    !BOTH_PACKAGES.includes(pkg) &&
    !(
      (stack === 'backend' && BACKEND_PACKAGES.includes(pkg)) ||
      (stack === 'frontend' && FRONTEND_PACKAGES.includes(pkg))
    )
  ) {
    throw new Error('Invalid package for stack');
  }

  const body = { stack, level, package: pkg, message };

  try {
    const res = await fetch(LOGGING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Log failed');
    return data;
  } catch (err) {
    console.error('Logging error:', err.message);
  }
}

module.exports = { Log };