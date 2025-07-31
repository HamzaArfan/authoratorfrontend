import React from "react";
import { Link } from "react-router-dom";
import { Mail, Book, ChevronLeft } from "lucide-react";
import logo from "./imgpsh.png";

const BlinkingStar = ({ top, left, size, delay }) => {
  return (
    <div 
      className="absolute rounded-full bg-white animate-pulse opacity-70"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        boxShadow: `0 0 ${size*1.5}px ${size/2}px rgba(255, 255, 255, 0.8)`
      }}
    />
  );
};

const StarryBackground = () => {
  const stars = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 5
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <BlinkingStar 
          key={star.id}
          top={star.top}
          left={star.left}
          size={star.size}
          delay={star.delay}
        />
      ))}
    </div>
  );
};

export default function PrivacyPolicy() {
  return (
    <div className="bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 text-white min-h-screen flex flex-col relative overflow-hidden">
      <StarryBackground />
      
      {/* Header */}
      <header className="py-4 bg-purple-900 bg-opacity-90 shadow-lg">
        <div className="container mx-auto flex justify-between items-center px-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-75"></div>
              <div className="relative p-2 bg-purple-900 bg-opacity-70 rounded-full">
                <img src={logo} alt="Authrator Logo" className="h-8 w-8" />
              </div>
            </div>
            <div className="text-xl font-bold">
              <span className="text-purple-300">Auth</span>
              <span className="text-white">rator</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="https://docs.authrator.app/" className="flex items-center text-purple-200 hover:text-white transition-colors">
              <Book size={18} className="mr-1" />
              <span>Documentation</span>
            </a>
            <a href="mailto:support@authrator.com" className="flex items-center text-purple-200 hover:text-white transition-colors">
              <Mail size={18} className="mr-1" />
              <span>Support</span>
            </a>
            <Link to="/app" className="bg-purple-500 hover:bg-purple-400 text-white py-2 px-4 rounded-lg transition duration-300 flex items-center">
              <span>Launch App</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Back Button */}
      <div className="container mx-auto px-6 pt-8">
        <Link to="/" className="inline-flex items-center text-purple-200 hover:text-white transition-colors">
          <ChevronLeft size={20} />
          <span className="ml-1">Back to Home</span>
        </Link>
      </div>

      {/* Privacy Policy Content */}
      <main className="container mx-auto py-12 px-6 md:px-12 flex-grow relative z-10">
        <div className="max-w-4xl mx-auto bg-purple-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg border border-purple-700 p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-purple-200">Privacy Policy</h1>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mb-8"></div>
          
          <p className="mb-6 text-purple-200">Last updated: April, 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Information We Collect</h2>
              <p className="text-purple-100">
                We collect personal information you provide directly, such as your name, email address, and usage data like IP addresses, browser type, and pages visited. Your data is stored securely and used only for the purposes described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">How We Use Your Information</h2>
              <p className="text-purple-100">
                Your data helps us improve our services, respond to your requests, and enhance your overall experience on our platform. We analyze usage patterns to optimize our features and provide better service. We may send you important updates about our application and services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Sharing Your Information</h2>
              <p className="text-purple-100">
                We do not sell or rent your personal data. We share your data only with your consent, to comply with laws, or protect our rights. We may work with trusted service providers who are bound by confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Cookies and Tracking</h2>
              <p className="text-purple-100">
                Our website uses cookies to enhance your experience. You can manage cookie preferences through your browser settings. These cookies help us remember your preferences and provide personalized features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Third-Party Websites</h2>
              <p className="text-purple-100">
                We are not responsible for the privacy practices of external sites linked from our website. Please review their policies separately. When you leave our website, we encourage you to read the privacy policy of each site you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Data Security</h2>
              <p className="text-purple-100">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Changes to This Policy</h2>
              <p className="text-purple-100">
                We may update this policy occasionally. We encourage periodic review for the latest information on our privacy practices. Material changes will be notified through our website or via email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Contact Us</h2>
              <p className="text-purple-100">
                If you have questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:support@authrator.com" className="text-white underline hover:text-purple-300 transition-colors">
                  support@authrator.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Decorative elements */}
      <div className="absolute left-0 top-1/4 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute right-0 top-1/3 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute left-1/4 bottom-1/4 w-32 h-32 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      {/* Footer */}
      <footer className="py-8 bg-purple-900 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-xl font-bold">
                <span className="text-purple-300">Auth</span><span className="text-white">rator</span>
              </div>
              <p className="text-purple-300 mt-2">Made with ❤️ by Provayu</p>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 items-center">
              <a href="https://docs.authrator.app/" className="text-purple-300 hover:text-white transition-colors">Documentation</a>
              <Link to="/privacy-policy" className="text-purple-300 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-purple-300 hover:text-white transition-colors">Terms of Service</Link>
              <a href="mailto:support@authrator.com" className="text-purple-300 hover:text-white transition-colors flex items-center">
                <Mail size={16} className="mr-2" />
                support@authrator.com
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-purple-800 text-center text-sm text-purple-400">
            &copy; {new Date().getFullYear()} Authrator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}