import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <Layout>
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: April 2026
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-invert max-w-none space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">We may collect the following information:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Name and email address when you create an account</li>
                <li>Browsing and reading preference data</li>
                <li>Technical information such as IP address, browser type, and device</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">We use collected information to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide and maintain the service</li>
                <li>Personalize reading recommendations</li>
                <li>Send relevant notifications and updates</li>
                <li>Analyze usage to improve the platform</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">3. Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information to third parties. 
                We may share data with service providers who assist in operating the platform, 
                always under strict confidentiality agreements.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">4. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies to improve your browsing experience, remember your preferences, 
                and analyze site usage. You can control cookie settings in your browser.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your personal information. 
                However, no method of internet transmission is 100% secure, 
                and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent at any time</li>
                <li>Request portability of your data</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal data for as long as your account is active 
                or as needed to provide services. Upon account deletion, 
                your data will be removed within 30 days.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. 
                We will notify you of significant changes via email or site notification.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">9. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about this Privacy Policy, contact us at{' '}
                <a href="mailto:contact@eroticnovels.com" className="text-primary hover:underline">
                  contact@eroticnovels.com
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
