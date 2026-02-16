import React from 'react';
import Link from '@docusaurus/Link';
import styles from './CvHeader.module.css';

export default function CvHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <img
          src="/img/metin.jpg"
          alt="Metin Karakus"
          className={styles.photo}
        />
        <div>
          <h1 className={styles.name}>Metin Karakus</h1>
          <p className={styles.title}>
            Data Engineering Team Lead &amp; Cloud Data Platform Architect
          </p>
        </div>
      </div>

      <div className={styles.links}>
        <Link className={styles.button} href="mailto:s.metinkarakus@gmail.com">
          Email
        </Link>
        <Link className={styles.button} href="tel:+905059909371">
          Phone
        </Link>
        <Link className={styles.button} href="https://maps.app.goo.gl/MnYP2sTU4BchhpvF6">
          Location
        </Link>
        <Link className={styles.button} href="https://www.linkedin.com/in/metin-karakus-b586b6132">
          LinkedIn
        </Link>
        <Link className={styles.button} href="https://github.com/m-karakus">
          GitHub
        </Link>
        <Link className={styles.button} href="https://www.youtube.com/@metin-karakus">
          YouTube
        </Link>
      </div>
    </header>
  );
}
