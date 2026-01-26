// import clsx from 'clsx';
// import Link from '@docusaurus/Link';
// import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
// import Layout from '@theme/Layout';
// import HomepageFeatures from '@site/src/components/HomepageFeatures';

// import Heading from '@theme/Heading';
// import styles from './index.module.css';

// function HomepageHeader() {
//   const {siteConfig} = useDocusaurusContext();
//   return (
//     <header className={clsx('hero hero--primary', styles.heroBanner)}>
//       <div className="container">
//         <Heading as="h1" className="hero__title">
//           {siteConfig.title}
//         </Heading>
//         <p className="hero__subtitle">{siteConfig.tagline}</p>
//         <div className={styles.buttons}>
//           <Link
//             className="button button--secondary button--lg"
//             to="/docs/intro">
//             Docusaurus Docs - 5min ⏱️
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }

// export default function Home() {
//   const {siteConfig} = useDocusaurusContext();
//   return (
//     <Layout
//       title={`Hello from ${siteConfig.title}`}
//       description="Description will go into a meta tag in <head />">
//       <HomepageHeader />
//       <main>
//         <HomepageFeatures />
//       </main>
//     </Layout>
//   );
// }


import React from "react";
import Layout from "@theme/Layout";

import HomepageHero from "@site/src/components/HomepageHero";
import FeatureGrid from "@site/src/components/FeatureGrid";
import { KnowledgeBaseSection } from "@site/src/components/KnowledgeBaseSection";
import { FeaturedVideos } from "@site/src/components/FeaturedVideos";

export default function Home() {
  return (
    <Layout
      title="Metin Karakus"
      description="Data Engineering & Analytics Knowledge Base"
    >
      <HomepageHero />

      <main>
        <FeatureGrid />
        <KnowledgeBaseSection />
        <FeaturedVideos />
      </main>
    </Layout>
  );
}
