import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
        <div className="mx-auto h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2 font-display">404 Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <button className="w-full bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
            Return to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
