import React from "react";
import Link from "@docusaurus/Link";

export default function HomepageHero() {
  return (
    <header className="hero hero--primary homepage-hero">
      <div className="container">
        <h1 className="hero__title">
          Real-world data architectures & engineering notes.
        </h1>

        <p className="hero__subtitle">
          Practical insights and architectural decisions from building
          <b> modern data platforms</b>, <b>data warehouses</b>, and
          <b> analytics systems</b> in production at scale.
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
