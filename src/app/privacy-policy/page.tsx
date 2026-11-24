import type { Metadata } from "next"
import { LegalPage } from "@/components/site/legal-page"
import { SITE } from "@/lib/site"

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy" } }

const UPDATED = "24 November 2026"

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Last updated: {UPDATED}</p>
      <p>This Privacy Policy explains how {SITE.owner} (“we”, “us”) handles information when you use {SITE.url} (the “Site”).</p>
      <h2>Your files</h2>
      <p>All image, PDF and text processing happens locally in your browser. <strong>Files you open in our tools are never uploaded to our servers or shared with anyone.</strong> They are discarded when you close or reload the page.</p>
      <h2>Information collected automatically</h2>
      <p>Like most websites, our hosting provider may log standard technical data such as IP address, browser type, pages visited and time of visit. This is used only to keep the Site secure and working.</p>
      <h2>Cookies and advertising</h2>
      <ul>
        <li>We use Google AdSense to show ads. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites.</li>
        <li>Google’s use of advertising cookies enables it and its partners to serve ads based on your visits to this Site and/or other sites on the Internet.</li>
        <li>You may opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">Google Ads Settings</a>, or opt out of third-party vendors’ use of cookies at <a href="https://www.aboutads.info/choices" target="_blank" rel="noreferrer">aboutads.info</a>.</li>
        <li>Learn more in <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">How Google uses information from sites that use its services</a>.</li>
      </ul>
      <p>We also store your light/dark theme choice in your browser’s local storage.</p>
      <h2>Children</h2>
      <p>The Site is not directed at children under 13 and we do not knowingly collect their personal information.</p>
      <h2>Your rights</h2>
      <p>Depending on where you live (for example under the GDPR or India’s DPDP Act), you may have rights to access or delete personal data. Since we do not store your files or accounts, there is usually nothing for us to delete, but you can contact us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with any request.</p>
      <h2>Changes</h2>
      <p>We may update this policy from time to time. The date above shows the latest version.</p>
      <h2>Contact</h2>
      <p>Questions about this policy: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
    </LegalPage>
  )
}
