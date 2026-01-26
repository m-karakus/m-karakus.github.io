import React from 'react';
import styles from './FeaturedKnowledge.module.css';
import Link from '@docusaurus/Link';

const items = [
  {
    title: 'Power BI Incremental Refresh — Production Notes',
    description:
      'Where incremental refresh breaks down, common pitfalls, and lessons learned from real-world implementations.',
    link: '/blog/powerbi-incremental-refresh',
    badge: 'Blog',
  },
  {
    title: 'ClickHouse for Analytics at Scale',
    description:
      'Architecture patterns, performance considerations, and operational notes for both on-prem and cloud deployments.',
    link: '/docs/platforms/clickhouse',
    badge: 'Docs',
  },
  {
    title: 'Designing Modern Data Platforms',
    description:
      'An architectural approach that brings together dbt, Dagster, Snowflake, and the BI layer as a single system.',
    link: '/docs/architecture/modern-data-platforms',
    badge: 'Docs',
  },
];

export default function FeaturedKnowledge() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>Featured Knowledge</h2>
        <p className={styles.subtitle}>
          Selected production notes, architectural decisions, and engineering learnings.
        </p>

        <div className={styles.grid}>
          {items.map((item, idx) => (
            <Link key={idx} to={item.link} className={styles.card}>
              <div className={styles.badge}>{item.badge}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className={styles.cta}>Read more →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
