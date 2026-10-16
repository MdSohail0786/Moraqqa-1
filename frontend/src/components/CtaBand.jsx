import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal, TextReveal } from './Reveal.jsx';

export default function CtaBand({ title = 'Begin your project with us', text = 'Tell us about your space and we will arrange a private consultation.' }) {
  return (
    <section className="section section--dark cta-band">
      <div className="container">
        <p className="eyebrow">Start a conversation</p>
        <TextReveal text={title} as="h2" className="h1" />
        <Reveal>
          <p className="lead" style={{ margin: '0 auto 40px' }}>{text}</p>
          <Link to="/contact" className="btn btn--light">
            Enquire now <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
