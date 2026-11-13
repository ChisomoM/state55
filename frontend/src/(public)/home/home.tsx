// "use client";
import Hero from '@/(public)/home/components/hero';
import Navbar from '../../components/navbar';
import { Footer } from '@/components/footer';
import SEO from '../../components/SEO';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Culture & Heritage',
    description: 'Stories, languages and traditions from every corner of the motherland, kept alive and shared with the world.',
  },
  {
    title: 'Community',
    description: 'Find your people by country, city or interest, and build together across borders.',
  },
  {
    title: 'Membership & Voice',
    description: 'A verifiable digital membership and member-led governance, so every voice counts in shaping our future.',
  },
];

export default function Home(){
    return(
        <div className="pt-20">
            <SEO
                title="Motherland | Pan-African Digital Community"
                description="A digital home for Africans on the continent and in the diaspora: culture, community, membership and a shared voice."
                keywords="Pan-African, Africa, diaspora, community, culture, heritage, membership"
                type="website"
            />
            <Navbar/>
            <Hero/>

            {/* Features Section */}
            <section id="features" className="py-12 md:py-20 bg-cream">
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12">
                <h2 className="text-3xl md:text-4xl font-bold text-charcoal text-center mb-12">What We Do</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {features.map((feature, idx) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-white p-6 rounded-lg shadow-sm"
                    >
                      <h3 className="font-semibold text-lg text-charcoal mb-2">{feature.title}</h3>
                      <p className="text-gray-mid">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-12 md:py-20 bg-white">
              <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-6">Our Story</h2>
                <p className="text-lg text-gray-mid leading-relaxed">
                  Africa's story does not end at her borders. Millions of her children live across the world, and they carry
                  the motherland with them. Motherland is where that connection becomes a community: a place to celebrate who
                  we are, support one another, and take part in deciding where we go next.
                </p>
              </div>
            </section>

            <Footer/>
        </div>


    )
}