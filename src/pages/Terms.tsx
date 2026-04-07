import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const Terms = () => {
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
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Terms of Use
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
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using this website, you accept and agree to be bound by these Terms of Use. 
                If you do not agree to these terms, please do not use the site.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">2. Use of the Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to use the service only for lawful purposes and in accordance with these Terms. 
                You must not use the service in any way that could damage, disable, or impair the site.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you create an account, you must provide accurate and complete information. 
                You are responsible for maintaining the confidentiality of your account and password. 
                You agree to accept responsibility for all activities that occur under your account.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">4. Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content published on this platform is the property of their respective authors. 
                Reproduction, distribution, or modification of content without authorization is prohibited. 
                Users who publish content grant the platform a non-exclusive license to display and distribute such content.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The site's design, logos, graphics, and software are protected by intellectual property laws. 
                You may not copy, modify, or distribute any part of the site without prior written consent.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">6. Prohibited Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Post offensive, defamatory, or illegal content</li>
                <li>Attempt to access other users' accounts</li>
                <li>Use bots or automated tools without authorization</li>
                <li>Violate the intellectual property of third parties</li>
                <li>Distribute spam or unsolicited commercial content</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                The platform is provided "as is" without warranties of any kind. 
                We are not liable for any direct, indirect, incidental, or consequential damages 
                arising from the use or inability to use the service.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">8. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. 
                Changes will take effect immediately upon posting on the site. 
                Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">9. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Use, please contact us at{' '}
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

export default Terms;
