// API Configuration
// In development, uses .env file
// In production, uses Vercel environment variables

const API_URL = process.env.REACT_APP_API_URL;
const LOCAL_URL = process.env.REACT_APP_LOCAL_HOST_API_URL;

// Debug: Log all REACT_APP environment variables
// console.log('=== Environment Variables Debug ===');
// console.log('All env vars:', process.env);
// console.log('REACT_APP_API_URL:', API_URL);
// console.log('REACT_APP_LOCAL_HOST_API_URL:', LOCAL_URL);
// console.log('===================================');

if (!API_URL) {
  console.warn(
    "REACT_APP_API_URL is not defined. Make sure to set it in your environment variables."
  );
}

// if (!LOCAL_URL) {
//   console.warn(
//     "REACT_APP_LOCAL_HOST_API_URL is not defined. Make sure to set it in your environment variables."
//   );
// }

export const config = {
  // API_URL: API_URL || LOCAL_URL,
  API_URL: LOCAL_URL,
  
};

console.log(`LOCAL URL: ${LOCAL_URL}`);
export default config;
