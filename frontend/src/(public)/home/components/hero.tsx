import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      id="home" className="py-16 md:py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal mb-4 leading-tight">
          Home for every African,
          <span className="text-gray-mid block">wherever you are.</span>
        </h1>
        <p className="text-lg text-gray-mid max-w-2xl mx-auto mb-8">
          Motherland is a Pan-African digital community connecting the continent and her diaspora through culture, community and a shared voice.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-black hover:bg-blue-dark text-white font-semibold px-6 py-3">
            <Link to="/login">Join the community</Link>
          </Button>
          <Button asChild variant="outline" className="border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-6 py-3">
            <a href="#about">Our story</a>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}