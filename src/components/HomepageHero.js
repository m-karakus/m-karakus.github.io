import React from "react";
import Link from "@docusaurus/Link";

export default function HomepageHero() {
  return (
    <header className="hero hero--primary homepage-hero">
      <div className="container">
        <h1 className="hero__title">
          Gerçek dünyada çalışan data mimarileri ve mühendislik notları.
        </h1>

        <p className="hero__subtitle">
          Kurumsal ölçekte projelerde edindiğim
          <b> modern data platformu, DWH</b> ve <b>analitik sistem</b> deneyimlerinden
          pratik notlar ve mimari kararlar.
        </p>

        <div className="hero-buttons">
          <Link
            className="button button--secondary button--lg"
            to="/docs"
          >
            📚 Knowledge Base
          </Link>

          <Link
            className="button button--secondary button--lg"
            to="/blog"
          >
            ✍️ Blog
          </Link>
        </div>
      </div>
    </header>
  );
}
