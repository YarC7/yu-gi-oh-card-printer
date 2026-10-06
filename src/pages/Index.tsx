import { useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { FileUpload } from "@/components/upload/FileUpload";
import { ProgressDialog } from "@/components/ui/progress-dialog";
import { Button } from "@/components/ui/button";
import { parseYDKFile, parseJSONDeck, readFileAsText } from "@/lib/ydk-parser";
import { getCardsByIds } from "@/lib/ygoprodeck-api";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SEO } from "@/components/seo/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Search,
  FileText,
  Printer,
  Upload,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Database,
  ShieldCheck,
  Ruler,
} from "lucide-react";

// Marquee imagery from YGOProDeck — modern iconic bosses (IDs verified via API)
const TOP_CARDS = [
  "https://images.ygoprodeck.com/images/cards/86066372.jpg", // Accesscode Talker
  "https://images.ygoprodeck.com/images/cards/4280258.jpg", // Apollousa, Bow of the Goddess
  "https://images.ygoprodeck.com/images/cards/84815190.jpg", // Baronne de Fleur
  "https://images.ygoprodeck.com/images/cards/90448279.jpg", // Divine Arsenal AA-ZEUS - Sky Thunder
  "https://images.ygoprodeck.com/images/cards/37818794.jpg", // Red-Eyes Dark Dragoon
  "https://images.ygoprodeck.com/images/cards/44146295.jpg", // Mirrorjade the Iceblade Dragon
  "https://images.ygoprodeck.com/images/cards/69248256.jpg", // Swordsoul Grandmaster - Chixiao
  "https://images.ygoprodeck.com/images/cards/48626373.jpg", // Kashtira Arise-Heart
  "https://images.ygoprodeck.com/images/cards/72270339.jpg", // Diabellstar the Black Witch
  "https://images.ygoprodeck.com/images/cards/9674034.jpg", // Snake-Eye Ash
];

const BOTTOM_CARDS = [
  "https://images.ygoprodeck.com/images/cards/27204311.jpg", // Nibiru, the Primal Being
  "https://images.ygoprodeck.com/images/cards/14558127.jpg", // Ash Blossom & Joyous Spring
  "https://images.ygoprodeck.com/images/cards/23434538.jpg", // Maxx "C"
  "https://images.ygoprodeck.com/images/cards/94145021.jpg", // Droll & Lock Bird
  "https://images.ygoprodeck.com/images/cards/10045474.jpg", // Infinite Impermanence
  "https://images.ygoprodeck.com/images/cards/14532163.jpg", // Lightning Storm
  "https://images.ygoprodeck.com/images/cards/24299458.jpg", // Forbidden Droplet
  "https://images.ygoprodeck.com/images/cards/25311006.jpg", // Triple Tactics Talent
  "https://images.ygoprodeck.com/images/cards/15693423.jpg", // Evenly Matched
  "https://images.ygoprodeck.com/images/cards/54693926.jpg", // Dark Ruler No More
  "https://images.ygoprodeck.com/images/cards/24224830.jpg", // Called by the Grave
  "https://images.ygoprodeck.com/images/cards/97268402.jpg", // Effect Veiler
];

// Real iconic archetypes for the kinetic band (proper nouns — no translation needed)
const ARCHETYPE_BAND = [
  "Blue-Eyes",
  "Dark Magician",
  "Red-Eyes",
  "Exodia",
  "Elemental HERO",
  "Cyber Dragon",
  "Blackwing",
  "Shaddoll",
  "Sky Striker",
  "Swordsoul",
  "Branded",
  "Kashtira",
];

const FEATURES = [
  {
    icon: Upload,
    titleKey: "home.f1t",
    descKey: "home.f1d",
  },
  {
    icon: Search,
    titleKey: "home.f2t",
    descKey: "home.f2d",
  },
  {
    icon: FileText,
    titleKey: "home.f3t",
    descKey: "home.f3d",
  },
  {
    icon: Printer,
    titleKey: "home.f4t",
    descKey: "home.f4d",
  },
];

const STEPS = [
  { step: "01", titleKey: "home.s1t", descKey: "home.s1d" },
  { step: "02", titleKey: "home.s2t", descKey: "home.s2d" },
  { step: "03", titleKey: "home.s3t", descKey: "home.s3d" },
];

const PERKS = ["home.perk1", "home.perk2", "home.perk3"];

const HERO_STATS = [
  { icon: Database, textKey: "home.f2t" },
  { icon: Ruler, text: "5.9 × 8.6 cm" },
  { icon: ShieldCheck, text: "TCG + OCG" },
];

/**
 * Floating showcase card with cursor-tracked 3D tilt.
 * Motion values live outside the React render cycle (no re-renders on move).
 */
function ShowcaseCard() {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 150, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 150, damping: 18 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-py * 16);
    rotateY.set(px * 16);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative hidden w-[240px] shrink-0 2xl:block"
      style={{ perspective: 1000 }}
    >
      <div
        aria-hidden
        className="absolute inset-0 -m-8 rounded-full bg-amber-400/25 blur-3xl"
      />
      <motion.img
        src={TOP_CARDS[0]}
        alt="Accesscode Talker"
        loading="lazy"
        style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
        className="relative z-10 w-full rotate-[5deg] rounded-xl shadow-2xl"
      />
      <motion.img
        src={BOTTOM_CARDS[1]}
        alt="Ash Blossom & Joyous Spring"
        loading="lazy"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-10 -left-16 z-20 w-2/5 -rotate-[10deg] rounded-lg shadow-xl"
      />
      <div className="absolute -right-3 top-3 z-20 flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        Accesscode Talker
      </div>
    </div>
  );
}

export default function Index() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    stage: "",
  });
  const [showImportProgress, setShowImportProgress] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setShowImportProgress(true);
    setImportProgress({ current: 0, total: 3, stage: t("deck.readStage") });

    try {
      const content = await readFileAsText(file);
      const isJSON = file.name.endsWith(".json");
      const parsed = isJSON ? parseJSONDeck(content) : parseYDKFile(content);

      const allIds = [...parsed.main, ...parsed.extra, ...parsed.side];

      if (allIds.length === 0) {
        toast.error(t("home.importError"));
        setLoading(false);
        setShowImportProgress(false);
        return;
      }

      setImportProgress({
        current: 1,
        total: 3,
        stage: t("deck.loadStage", { count: allIds.length }),
      });

      const { cards, notFoundIds } = await getCardsByIds(allIds);

      setImportProgress({ current: 2, total: 3, stage: t("deck.processStage") });

      if (notFoundIds.length > 0) {
        sessionStorage.setItem("notFoundCardIds", JSON.stringify(notFoundIds));
      } else {
        sessionStorage.removeItem("notFoundCardIds");
      }

      sessionStorage.setItem("importedDeck", JSON.stringify({ parsed, cards }));

      setImportProgress({ current: 3, total: 3, stage: t("deck.doneStage") });

      setTimeout(() => {
        navigate("/deck-builder");
      }, 300);
    } catch (error) {
      toast.error(t("home.importReadError"));
      console.error(error);
      setShowImportProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO />
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />

        {/* Hero Section */}
        <section className="relative min-h-[100dvh] flex items-center justify-center hero-gradient overflow-hidden">
          {/* Infinite Scrolling Cards - Top Row (boss monsters) */}
          <div className="absolute top-8 sm:top-12 left-0 right-0 overflow-hidden pointer-events-none">
            <motion.div
              className="flex gap-4 sm:gap-6"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                x: {
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              style={{ width: "fit-content" }}
            >
              {/* Doubled set for a seamless -50% loop */}
              {[...TOP_CARDS, ...TOP_CARDS].map((src, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-20 sm:w-24 md:w-28 opacity-30 dark:opacity-20 hover:opacity-60 transition-opacity"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full rounded-lg shadow-xl"
                    loading="lazy"
                  />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Infinite Scrolling Cards - Bottom Row, reverse (spells/traps + modern) */}
          <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 overflow-hidden pointer-events-none">
            <motion.div
              className="flex gap-4 sm:gap-6"
              animate={{ x: ["-50%", "0%"] }}
              transition={{
                x: {
                  duration: 45,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              style={{ width: "fit-content" }}
            >
              {/* Doubled set, reversed order, for a seamless loop */}
              {[
                ...BOTTOM_CARDS.slice().reverse(),
                ...BOTTOM_CARDS.slice().reverse(),
              ].map((src, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-20 sm:w-24 md:w-28 opacity-30 dark:opacity-20 hover:opacity-60 transition-opacity"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full rounded-lg shadow-xl"
                    loading="lazy"
                  />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Content */}
          <div className="container relative z-10 px-4 py-16 sm:py-20">
            <div className="mx-auto flex max-w-5xl items-center justify-center gap-10">
              <div className="max-w-4xl text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <Sparkles className="h-4 w-4" />
                    {t("home.badge")}
                  </div>
                </motion.div>

                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <span className="text-gradient">YGO Proxy</span>
                  <br />
                  <span className="text-foreground">Printer</span>
                </motion.h1>

                <motion.p
                  className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {t("home.heroDescA")}{" "}
                  <strong className="font-mono font-semibold text-foreground">
                    {t("home.heroSize")}
                  </strong>
                  {t("home.heroDescB")}
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Button
                    size="lg"
                    className="gap-2 text-lg h-14 px-8 transition-transform active:scale-[0.98]"
                    onClick={() => navigate("/deck-builder")}
                  >
                    <Zap className="h-5 w-5" />
                    {t("home.startNow")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 text-lg h-14 px-8 transition-transform active:scale-[0.98]"
                    onClick={() => navigate("/search")}
                  >
                    <Search className="h-5 w-5" />
                    {t("home.searchCards")}
                  </Button>
                </motion.div>

                <motion.div
                  className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                >
                  {HERO_STATS.map((s) => (
                    <div
                      key={s.textKey ?? s.text}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <s.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-mono tabular-nums">
                        {s.textKey ? t(s.textKey) : s.text}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>

              <ShowcaseCard />
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
              <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50" />
            </div>
          </motion.div>
        </section>

        {/* Kinetic archetype band */}
        <div className="overflow-hidden border-y border-border bg-muted/40 py-3">
          <div
            className="animate-marquee flex w-max items-center gap-8 pr-8"
            aria-hidden
          >
            {[...ARCHETYPE_BAND, ...ARCHETYPE_BAND].map((name, i) => (
              <span
                key={i}
                className="flex items-center gap-8 whitespace-nowrap font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground"
              >
                {name}
                <span className="text-amber-500">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Upload Section */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container px-4">
            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  {t("home.importTitle")}
                </h2>
                <p className="text-muted-foreground">
                  {t("home.importDesc")}
                </p>
              </div>

              <FileUpload
                onFileSelect={handleFileSelect}
                className={loading ? "opacity-50 pointer-events-none" : ""}
              />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                {t("home.featuresTitle")}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t("home.featuresDesc")}
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.titleKey}
                  className="glass-card rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 tracking-tight">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(feature.descKey)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                {t("home.howTitle")}
              </h2>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {STEPS.map((item, i) => (
                  <motion.div
                    key={item.step}
                    className="text-center"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                  >
                    <div className="text-5xl font-bold text-gradient mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{t(item.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">{t(item.descKey)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24">
          <div className="container px-4">
            <motion.div
              className="max-w-3xl mx-auto text-center glass-card rounded-2xl p-8 sm:p-12"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                {t("home.ctaTitle")}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("home.ctaDesc")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="gap-2 transition-transform active:scale-[0.98]"
                  onClick={() => navigate("/deck-builder")}
                >
                  <Zap className="h-5 w-5" />
                  {t("home.openBuilder")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="transition-transform active:scale-[0.98]"
                  onClick={() => navigate("/history")}
                >
                  {t("home.viewHistory")}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                {PERKS.map((key) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    {t(key)}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t">
          <div className="container px-4 text-center text-sm text-muted-foreground">
            <p>
              YGO Proxy Printer • {t("home.footerApi")}{" "}
              <a
                href="https://ygoprodeck.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                YGOProDeck API
              </a>
            </p>
            <p className="mt-2 text-xs">
              {t("home.footerRights")}
            </p>
            <p className="mt-2 text-xs">From <Link to="https://github.com/YarC7">Cray</Link> With Love</p>
          </div>
        </footer>

        {/* Import Progress Dialog */}
        <ProgressDialog
          open={showImportProgress}
          title={t("deck.importingTitle")}
          description={importProgress.stage}
          progress={importProgress.current}
          total={importProgress.total}
        />
      </div>
    </>
  );
}
