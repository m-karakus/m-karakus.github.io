import React from "react";
import Link from "@docusaurus/Link";

export function KnowledgeBaseSection() {
  return (
    <section className="container section">
      <h2>📚 Knowledge Base</h2>

      <p>
        Practical documentation built from real production systems.
        No theory-only content.
      </p>

      <Link className="button button--primary" to="/docs">
        Explore Docs →
      </Link>
    </section>
  );
}
