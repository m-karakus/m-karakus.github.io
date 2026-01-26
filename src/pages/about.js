import React from 'react';
import Layout from '@theme/Layout';

export default function About() {
  return (
    <Layout
      title="About"
      description="About Metin Karakuş"
    >
      <main className="container margin-vert--lg">
        <h1>About</h1>

        <p>
          Merhaba, ben <strong>Metin Karakuş</strong>.
        </p>

        <p>
          Veri mühendisliği ve analitik platformlar üzerine çalışan bir
          <strong> Data Engineer & Engineering Lead</strong>’im.
          Ölçeklenebilir, sürdürülebilir ve production-ready data mimarileri
          kurmaya odaklanıyorum.
        </p>

        <p>
          Bu site; gerçek dünyada karşılaştığım problemler, aldığım mimari
          kararlar ve pratik mühendislik notlarını paylaştığım kişisel bir
          knowledge base.
        </p>
      </main>
    </Layout>
  );
}
