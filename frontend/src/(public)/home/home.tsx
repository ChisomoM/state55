import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import SEO from "@/components/SEO";
import { Wordmark } from "@/components/brand/Wordmark";
import { WeaveBand } from "@/components/brand/WeaveBand";
import { TileMosaic } from "@/components/brand/TileMosaic";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/useAuth";

// Respect Save-Data: skip the mosaic on low-data connections.
const saveData = () =>
  typeof navigator !== "undefined" &&
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

/** Placeholder home page until the full site launches. */
export default function Home() {
  const reduce = useReducedMotion();
  const { isAuthenticated } = useAuth();

  return (
    <div className="section-dark relative flex min-h-screen flex-col overflow-hidden">
      <SEO
        title="Motherland | Coming soon"
        description="A digital home for Africans on the continent and in the diaspora. Coming soon."
        keywords="Pan-African, Africa, diaspora, community, culture, membership"
        type="website"
      />
      <WeaveBand variant="thread" onDark />

      {!saveData() && (
        <>
          <TileMosaic
            cols={6}
            rows={9}
            className="pointer-events-none absolute -right-14 top-4 w-[70%] max-w-[620px] opacity-40 md:w-[46%] md:opacity-100"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#1E1410_42%,rgba(30,20,16,.55)_62%,rgba(30,20,16,.1))]" />
        </>
      )}

      <header className="relative mx-auto flex w-full max-w-content items-center px-5 py-6 md:px-6 lg:px-10">
        <Wordmark size={24} tone="inverse" />
      </header>

      <main id="main" className="relative mx-auto flex w-full max-w-content flex-1 items-center px-5 pb-16 md:px-6 lg:px-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="max-w-2xl"
        >
          <p className="label !text-[#C9B8A6]">Coming soon</p>
          <h1 className="mt-5 font-display text-[clamp(3rem,8vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-ivory">
            Home for every African,
            <span className="block text-accent">wherever you are.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#C9B8A6]">
            We are building Motherland, a digital community for the continent and her diaspora. Create your account now
            and we will tell you the day the doors open.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Button asChild size="lg">
                <Link to="/account">My account</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/register">Sign up</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="border border-[#C9B8A6] bg-transparent text-ivory hover:bg-white/10"
                >
                  <Link to="/login">Log in</Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
