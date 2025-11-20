import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, LogIn } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <BarChart3 className="h-12 w-12 text-indigo-600" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">TeamFlow</h1>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
          Team Management Platform
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Manage your teams, tasks, and equipment efficiently. Track performance and improve productivity with our powerful tools.
        </p>
        
        <div className="text-center mb-8">
          <Link 
            to="/signin" 
            className="inline-flex items-center justify-center gap-2 py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-center transition-colors text-lg font-medium"
          >
            <LogIn className="h-5 w-5" />
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 