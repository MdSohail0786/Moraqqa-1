import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['Information we collect', 'When you submit an enquiry or subscribe to our newsletter we collect the details you provide: your name, email address, phone number, city and project information.'],
      ['How we use it', 'We use this information only to respond to your enquiry, to discuss your project and, if you subscribed, to send occasional studio news. We do not sell your data.'],
      ['Storage and retention', 'Enquiries are stored securely in our database and kept for as long as needed to manage your project or as required by law. You may ask us to delete your data at any time.'],
      ['Your rights', 'You can request access to, correction of or deletion of your personal data by contacting us using the details on this website.'],
    ],
  },
  terms: {
    title: 'Terms of Use',
    sections: [
      ['Use of this website', 'The content of this website, including photography, drawings and text, is the property of the studio and may not be reproduced without written permission.'],
      ['Enquiries', 'Submitting an enquiry does not create a contract. Any engagement begins only after a written agreement between you and the studio.'],
      ['Accuracy', 'We aim to keep the information on this site accurate and current, but we make no warranty that it is complete. Project details are illustrative.'],
      ['Changes', 'We may update these terms from time to time. Continued use of the site means you accept the updated terms.'],
    ],
  },
};

/** Starter legal pages. Have them reviewed by your counsel before launch. */
export default function Legal({ kind }) {
  const { settings } = useSettings();
  const doc = CONTENT[kind];
  return (
    <>
      <Seo title={doc.title} description={`${doc.title} for ${settings.siteName}.`} />
      <PageHead eyebrow="Legal" title={doc.title} crumbs={[{ label: 'Home', to: '/' }, { label: doc.title }]} />
      <section className="container section--tight prose">
        {doc.sections.map(([h, p]) => (
          <div key={h}>
            <h2>{h}</h2>
            <p>{p}</p>
          </div>
        ))}
        {settings.contact?.email && <p>Questions? Write to <a href={`mailto:${settings.contact.email}`}><u>{settings.contact.email}</u></a>.</p>}
      </section>
    </>
  );
}
