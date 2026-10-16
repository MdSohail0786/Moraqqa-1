import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import CloudImage from '../components/CloudImage.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { ImageReveal, Reveal, ScrollWords, TextReveal } from '../components/Reveal.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchImages } from '../services/endpoints.js';
import { pad } from '../utils/helpers.js';

const STAGES = [
  ['Consultation', 'We visit the site, listen to how you live or work, and define the brief, budget and timeline together.'],
  ['Concept', 'Mood, material and spatial direction are developed into a concept you can see and feel before anything is built.'],
  ['Design Development', 'Detailed plans, elevations and 3D visuals resolve every junction, joint and light position.'],
  ['Material Selection', 'Stone, timber, metal and textile are chosen in person, sample by sample, for tactility and patina.'],
  ['Execution', 'We coordinate craftspeople and suppliers and supervise the build so the finished space matches the drawings.'],
  ['Final Styling', 'Furniture, art, lighting and soft furnishings are placed with care, and the home is handed over ready to live in.'],
];

const PILLARS = [
  ['Philosophy', 'Interiors should feel inevitable: calm, proportioned and quietly specific to the people who use them.'],
  ['Approach', 'We start with architecture and light, then layer material and furniture. Restraint is a design decision.'],
  ['Materials', 'Natural stone, solid timber, hand-finished metal and honest textiles that improve with age.'],
  ['Craftsmanship', 'Bespoke joinery and furniture drawn by us and made by artisans we have worked with for years.'],
];

function Process() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 70%'] });
  const height = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <section className="section container" id="process">
      <div className="shead"><div><p className="eyebrow">How we work</p><TextReveal text="Design Process" className="h1" /></div></div>
      <div className="timeline" ref={ref}>
        <span className="timeline__rail" aria-hidden="true" />
        <motion.span className="timeline__fill" style={{ height }} aria-hidden="true" />
        {STAGES.map(([title, text], i) => (
          <Reveal as="article" className="tstep" key={title} y={50}>
            <div className="tstep__n">{pad(i + 1)}</div>
            <div><h3>{title}</h3><p>{text}</p></div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function About() {
  const { settings } = useSettings();
  const { data } = useFetch(() => fetchImages({ featured: true, limit: 3 }), []);
  const images = data?.data || [];
  const team = (settings.team || []).filter((m) => m.name);

  return (
    <>
      <Seo title="About" description="MORAQQA is a luxury interior architecture and design studio. Our philosophy, approach, materials and craftsmanship." image={settings.introImage?.url} />
      <PageHead eyebrow="About the studio" title="Quiet spaces, carefully made" crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]} />

      <section className="container section--tight">
        <ImageReveal><CloudImage src={settings.introImage?.url || images[0]?.cloudinaryUrl} alt={settings.introImage?.alt || 'The MORAQQA studio'} ratio="16 / 8" widths={[800, 1280, 1920]} sizes="100vw" priority /></ImageReveal>
      </section>

      <section className="container section">
        <p className="eyebrow">Our philosophy</p>
        <ScrollWords text="We believe a great interior is felt before it is seen. It is the quality of light on stone, the weight of a door handle, the silence of a well-proportioned room." />
      </section>

      <section className="container section--tight">
        <div className="pillars">
          {PILLARS.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.06}><h3>{t}</h3><p>{d}</p></Reveal>
          ))}
        </div>
      </section>

      {images.length >= 2 && (
        <section className="container section">
          <div className="split">
            <ImageReveal><CloudImage src={images[0].cloudinaryUrl} alt={images[0].altText || ''} ratio="4 / 5" sizes="(max-width: 860px) 100vw, 45vw" /></ImageReveal>
            <div>
              <p className="eyebrow">Craftsmanship</p>
              <TextReveal text="Made by hand, finished to last" className="h2" />
              <p className="lead" style={{ marginTop: 28 }}>Every bespoke piece begins as a drawing in our studio and is made by artisans who share our patience for detail.</p>
            </div>
          </div>
        </section>
      )}

      <Process />

      {team.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="shead"><div><p className="eyebrow">People</p><TextReveal text="Team" className="h1" /></div></div>
            <div className="team">
              {team.map((m) => (
                <Reveal key={m.name}>
                  <CloudImage src={m.image?.url} alt={m.image?.alt || m.name} ratio="4 / 5" widths={[320, 480, 640]} sizes="(max-width: 700px) 100vw, 260px" />
                  <h3>{m.name}</h3>
                  <p className="team__role">{m.role}</p>
                  {m.bio && <p className="muted">{m.bio}</p>}
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {images.length >= 3 && (
        <section className="container section">
          <p className="eyebrow">The studio</p>
          <ImageReveal><CloudImage src={images[2].cloudinaryUrl} alt={images[2].altText || ''} ratio="16 / 8" widths={[800, 1280, 1920]} sizes="100vw" /></ImageReveal>
        </section>
      )}
      <CtaBand />
    </>
  );
}
