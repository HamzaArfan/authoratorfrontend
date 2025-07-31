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

export default function TermsOfService() {
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

      {/* Terms of Service Content */}
      <main className="container mx-auto py-12 px-6 md:px-12 flex-grow relative z-10">
        <div className="max-w-4xl mx-auto bg-purple-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg border border-purple-700 p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-purple-200">Terms of Service</h1>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mb-8"></div>
          
          <p className="mb-6 text-purple-200">Last updated: April, 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Introduction</h2>
              <p className="text-purple-100">
                Welcome to Authrator. By accessing or using our services, you agree to comply with these Terms of Service. Please read them carefully before using our platform. These terms constitute a legally binding agreement between you and Authrator.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Using Our Services</h2>
              <p className="text-purple-100">
                You may use our services only as permitted by law and these Terms of Service. Do not misuse our services by interfering with their normal operation or accessing them using methods other than the interface provided. We reserve the right to suspend services to you if you violate these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Account Responsibilities</h2>
              <p className="text-purple-100">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account or any other breach of security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Content Ownership</h2>
              <p className="text-purple-100">
                All content provided through our services, including text, graphics, logos, and software, remains the intellectual property of Authrator. Unauthorized use of any content is prohibited. You retain ownership of any data you submit through our services, but grant us a license to use it for service provision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Termination of Access</h2>
              <p className="text-purple-100">
                We may suspend or terminate your access to our services if you violate these Terms of Service or engage in activities that disrupt the functionality of our platform. Upon termination, your right to use our services will immediately cease, and you must cease all use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Disclaimer of Warranties</h2>
              <p className="text-purple-100">
                Our services are provided on an "as-is" basis. We disclaim all warranties, express or implied, including but not limited to the accuracy or reliability of the services. We do not guarantee that our services will meet your requirements or be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Limitation of Liability</h2>
              <p className="text-purple-100">
                In no event shall Authrator be liable for any damages arising from your use of our services, including direct, indirect, incidental, or consequential damages. This includes data loss, profit loss, or business interruption, whether based on breach of contract, tort, or any other legal theory.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Changes to These Terms</h2>
              <p className="text-purple-100">
                We reserve the right to update these Terms of Service at any time. Continued use of our services after changes take effect constitutes acceptance of the new terms. We will make reasonable efforts to notify you of material changes through our website or via email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Contact Us</h2>
              <p className="text-purple-100">
                If you have questions about these Terms of Service, please contact us at{" "}
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