import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

export const SEO = ({
  title = "Yu-Gi-Oh! Card Printer - Create, Build & Print Custom Yu-Gi-Oh Cards Online",
  description = "Free online Yu-Gi-Oh! card printer. Search 12,000+ cards, build custom decks, create proxy cards, and export for printing. Features deck builder, ban list checker, and high-quality card images.",
  keywords = "Yu-Gi-Oh, card printer, deck builder, proxy cards, TCG, OCG, YGOPRODeck, custom cards, print cards, duel monsters, trading card game",
  image = "https://yarc7.github.io/yu-gi-oh-card-printer/og-image.jpg",
  url = window.location.href,
  type = "website",
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (
      property: string,
      content: string,
      isProperty = false
    ) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(
        `meta[${attribute}="${property}"]`
      ) as HTMLMetaElement;

      if (element) {
        element.content = content;
      } else {
        element = document.createElement("meta");
        element.setAttribute(attribute, property);
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", url, true);
    updateMetaTag("og:type", type, true);

    // Twitter tags
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);

    // Canonical URL
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.href = url;
    } else {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      canonicalLink.href = url;
      document.head.appendChild(canonicalLink);
    }
  }, [title, description, keywords, image, url, type]);

  return null; // This component doesn't render anything
};
