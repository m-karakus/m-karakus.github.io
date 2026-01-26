import React from "react";
import Layout from "@theme/Layout";

import HomepageHero from "@site/src/components/HomepageHero";
import FeatureGrid from "@site/src/components/FeatureGrid";
// import { KnowledgeBaseSection } from "@site/src/components/KnowledgeBaseSection";
import FeaturedKnowledge from "@site/src/components/FeaturedKnowledge";


export default function Home() {
  return (
    <Layout
      title="Metin Karakus"
      description="Data Professional - Analytics Knowledge Base"
    >
      <HomepageHero />

      <main>
        <FeatureGrid />
        {/* <KnowledgeBaseSection /> */}
        <FeaturedKnowledge />
      </main>
    </Layout>
  );
}
