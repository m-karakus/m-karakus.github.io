import Link from "@docusaurus/Link";
import React from "react";

const features = [
  {
    title: "Data Engineering",
    description:
      "Batch & streaming pipelines, dbt, Spark, Snowflake, ClickHouse.",
    to: "/docs/data-engineering/intro",
  },
  {
    title: "Analytics & Power BI",
    description:
      "Enterprise-grade models, performance tuning, semantic layers.",
    to: "/docs/analytics/intro",
  },
  {
    title: "Architecture",
    description:
      "Cloud & on-prem DWH, Kubernetes, observability, cost-aware design.",
    to: "/docs/architecture/intro",
  },
];

export default function FeatureGrid() {
  return (
    <section className="container section">
      <div className="row">
        {features.map((f) => (
          <div key={f.title} className="col col--4">
            <div className="feature-card">
              <h3>
                <Link to={f.to} className="feature-link">
                  {f.title}
                </Link>
              </h3>
              <p>{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
