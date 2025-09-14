import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { logoPath } from "@/assets";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-4 shadow-xl border-0">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="w-16 h-16 mx-auto p-2 bg-primary/10 rounded-full flex items-center justify-center">
              <img 
                src={logoPath} 
                alt="BlockFinaX Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>

            {/* Error Icon and Message */}
            <div className="space-y-4">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  404 - Page Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-base">
                  The page you're looking for doesn't exist or has been moved.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button asChild className="w-full h-11" size="lg">
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" />
                  Go to Home
                </Link>
              </Button>
              
              <Button variant="outline" onClick={() => window.history.back()} className="w-full h-11">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If you believe this is an error, please contact support or check the URL.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
