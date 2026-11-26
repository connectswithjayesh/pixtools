/**
 * ─── SITE SETTINGS ─────────────────────────────────────────────
 * Edit this one file before deploying.
 */
export const SITE = {
  name: "TechSutraHub",
  tagline: "Free image, PDF & text tools that run in your browser",
  /** Your live domain, no trailing slash — used for the sitemap, canonical URLs and policy pages */
  url: "https://www.techsutrahub.com",
  /** Contact email shown on the Contact and Privacy pages */
  email: "contact@techsutrahub.com",
  /** Owner or company name shown on legal pages */
  owner: "TechSutraHub",
  /** Country/state whose law applies (Terms page) */
  jurisdiction: "Maharashtra, India",

  ads: {
    /**
     * Google AdSense publisher ID, e.g. "ca-pub-1234567890123456".
     * Leave empty → grey "Ad space" placeholders show where ads will appear.
     */
    client: "",
    /** Ad unit IDs from AdSense → Ads → By ad unit → Display ads (one responsive unit per placement, or reuse one ID) */
    slots: {
      top: "",        // under the page title
      inContent: "",  // after the tool / between sections
      sidebar: "",    // beside the content on desktop
      bottom: "",     // above the footer
    },
    /** Set false to hide all ads and placeholders */
    enabled: true,
  },
} as const

export type AdPlacement = keyof typeof SITE.ads.slots
