import Link from "@docusaurus/Link";
import React from "react";

const features = [
  {
    title: "Architectures",
    description:
      "Cloud & on-prem DWH, Kubernetes, observability, cost-aware design.",
    to: "/docs/category/architectures",
  },
  {
    title: "Data Engineering",
    description:
      "Batch & streaming pipelines, dbt, Spark, Snowflake, ClickHouse.",
    to: "/docs/category/data-engineering",
  },
  {
    title: "Analytics & Power BI",
    description:
      "Enterprise-grade models, performance tuning, semantic layers.",
    to: "/docs/category/analytics",
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
