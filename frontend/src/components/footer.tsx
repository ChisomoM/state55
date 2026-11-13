import { Separator } from './ui/separator';
import { 
  Mail, 
  Phone, 
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    'Explore': [
      { label: 'Culture & Heritage', href: '#features' },
      { label: 'Communities', href: '#features' },
      { label: 'Membership', href: '#features' }
    ],
    'Motherland': [
      { label: 'Our Story', href: '#about' },
      { label: 'Contact', href: '#contact' }
    ],
    'Legal': [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Cookie Policy', href: '#cookies' }
    ]
  };

  return (
    <footer id="contact" className="bg-black text-white">
      {/* Main Footer Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                Motherland
              </h2>
              <p className="text-gray-400 mt-2">
                One continent, one people. A digital home for Africans on the
                continent and in the diaspora to share culture, build community
                and shape our future together.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-white" />
                <span className="text-gray-300">kachizo95@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-white" />
                <span className="text-gray-300">+260 972 682 268</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-white" />
                <span className="text-gray-300">Lusaka, Zambia</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-gray-800" />

        {/* Bottom Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-gray-400 text-sm">
            © {currentYear} Motherland. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
           
          </div>
        </div>
      </motion.div>
    </footer>
  );
}