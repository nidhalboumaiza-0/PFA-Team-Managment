/**
 * Setup script for TeamFlow Frontend
 *
 * This script helps with initial configuration and dependency installation.
 * Run with: node setup.js
 */

#!/usr/bin/env node
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper for async/await with readline
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// ASCII art for our setup script
const showWelcome = () => {
  console.log(`
  =======================================================
   TeamFlow - Setup Configuration Script
  =======================================================
  
  This script will help you configure your frontend to 
  connect to your backend API or use mock data for testing.
  
  Let's get started!
  `);
};

// Create .env from .env.example if it doesn't exist
const setupEnvFile = async () => {
  console.log('\n📋 Setting up environment variables...');
  
  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, 
`# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCK_API=false
`);
    console.log('✅ Created .env.example file');
  }
  
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from template');
  } else {
    console.log('✅ .env file already exists');
  }
};

// Function to update the .env file
const updateEnvFile = (apiUrl, useMock) => {
  try {
    const envContent = 
`# API Configuration
VITE_API_URL=${apiUrl}
VITE_USE_MOCK_API=${useMock}
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with your configuration');
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
  }
};

// Main setup function
const setup = async () => {
  showWelcome();
  
  // Set up .env file
  await setupEnvFile();
  
  // Ask for configuration options
  console.log('\n🔗 API Connection Configuration');
  
  // Option 1: Use mock API?
  const useMockResponse = await question('Do you want to use mock data for testing? (y/N): ');
  const useMock = useMockResponse.toLowerCase() === 'y';
  
  // Option 2: API URL (if not using mock)
  let apiUrl = 'http://localhost:5000/api';
  if (!useMock) {
    const customApiUrl = await question(`Enter your backend API URL [${apiUrl}]: `);
    if (customApiUrl.trim()) {
      apiUrl = customApiUrl.trim();
    }
  }
  
  // Update .env file with the configuration
  updateEnvFile(apiUrl, useMock);
  
  console.log('\n🔍 Configuration Summary:');
  console.log(`- API URL: ${apiUrl}`);
  console.log(`- Using Mock API: ${useMock ? 'Yes' : 'No'}`);
  
  // Check if dependencies are installed
  console.log('\n📦 Checking dependencies...');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')));
    const hasDeps = Object.keys(packageJson.dependencies || {}).length > 0;
    
    if (!hasDeps) {
      console.log('❌ No dependencies found in package.json');
      return;
    }
    
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      const installDeps = await question('Dependencies not installed. Install now? (Y/n): ');
      if (installDeps.toLowerCase() !== 'n') {
        console.log('\n📦 Installing dependencies... (this may take a minute)');
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
      }
    } else {
      console.log('✅ Dependencies already installed');
    }
  } catch (error) {
    console.error('❌ Error checking dependencies:', error.message);
  }
  
  // Final instructions
  console.log('\n🚀 Setup Complete!');
  console.log(`
  Next steps:
  
  1. Start the development server:
     $ npm run dev
     
  2. Access the application at:
     http://localhost:5173
     
  3. ${useMock ? 'You are using mock data for testing.' : 'Make sure your backend server is running at: ' + apiUrl}
  
  4. To change these settings later, edit the .env file or run this setup script again.
  
  Happy coding! 🎉
  `);
  
  rl.close();
};

// Run the setup
setup().catch(error => {
  console.error('❌ Setup failed:', error);
  rl.close();
});
