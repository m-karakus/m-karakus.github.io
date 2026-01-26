import React from "react";

const features = [
  {
    title: "Data Engineering",
    description:
      "Batch & streaming pipelines, dbt, Spark, Snowflake, ClickHouse.",
  },
  {
    title: "Analytics & Power BI",
    description:
      "Enterprise-grade models, performance tuning, semantic layers.",
  },
  {
    title: "Architecture",
    description:
      "Cloud & on-prem DWH, Kubernetes, observability, cost-aware design.",
  },
];

export default function FeatureGrid() {
  return (
    <section className="container section">
      <div className="row">
        {features.map((f) => (
          <div key={f.title} className="col col--4">
            <div className="feature-card">
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
