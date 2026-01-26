import React from 'react';
import styles from './FeaturedKnowledge.module.css';
import Link from '@docusaurus/Link';

const items = [
  {
    title: 'Power BI Incremental Refresh – Production Notes',
    description:
      'Incremental refresh hangi senaryolarda çalışmaz, gerçek hayatta nerede patlar?',
    link: '/blog/powerbi-incremental-refresh',
    badge: 'Blog',
  },
  {
    title: 'ClickHouse for Analytics at Scale',
    description:
      'On-prem ve cloud senaryolarında ClickHouse mimarisi ve performans notları.',
    link: '/docs/platforms/clickhouse',
    badge: 'Docs',
  },
  {
    title: 'Designing Modern Data Platforms',
    description:
      'dbt, Dagster, Snowflake ve BI katmanını birlikte düşünen mimari yaklaşım.',
    link: '/docs/architecture/modern-data-platform',
    badge: 'Docs',
  },
];

export default function FeaturedKnowledge() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>Featured Knowledge</h2>
        <p className={styles.subtitle}>
          Selected production notes and engineering learnings.
        </p>

        <div className={styles.grid}>
          {items.map((item, idx) => (
            <Link key={idx} to={item.link} className={styles.card}>
              <div className={styles.badge}>{item.badge}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
