import React from "react";
import Link from "@docusaurus/Link";

export function FeaturedVideos() {
  return (
    <section className="container section">
      <h2>🎥 Featured Videos</h2>

      <div className="row">
        <div className="col col--6">
          <div className="content-card">
            <h3>Power BI Incremental Refresh</h3>
            <p>Real-life performance pitfalls and fixes.</p>
            <Link to="/videos/powerbi-incremental-refresh">
              Watch →
            </Link>
          </div>
        </div>

        <div className="col col--6">
          <div className="content-card">
            <h3>ClickHouse at Scale</h3>
            <p>Designing high-performance analytical tables.</p>
            <Link to="/videos/clickhouse-performance">
              Watch →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
