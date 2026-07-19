import React from 'react';
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
        <div className={styles.info}>
          <h1 className={styles.name}>Metin Karakus</h1>
          <p className={styles.title}>
            Data Engineering Team Lead & Cloud Data Platform Architect
          </p>
        </div>
      </div>
      <hr className={styles.separator} />
      <div className={styles.contactSection}>
        <div className={styles.contactHeading}>Contact Info</div>
        <div className={styles.contact}>
          <div className={styles.col}>
            <a className={styles.link} href="mailto:s.metinkarakus@gmail.com">
              <span className={styles.label}>Email:</span> s.metinkarakus@gmail.com
            </a>
            <a className={styles.link} href="tel:+905059909371">
              <span className={styles.label}>Phone:</span> +90 505 990 93 71
            </a>
            <a className={styles.link} href="https://maps.app.goo.gl/MnYP2sTU4BchhpvF6" target="_blank" rel="noopener noreferrer">
              <span className={styles.label}>Location:</span> Istanbul, Turkey
            </a>
          </div>
          <div className={styles.divider} />
          <div className={styles.col}>
            <a className={styles.link} href="https://www.linkedin.com/in/metin-karakus-b586b6132" target="_blank" rel="noopener noreferrer">
              <span className={styles.label}>LinkedIn:</span> linkedin.com/in/metin-karakus
            </a>
            <a className={styles.link} href="https://github.com/m-karakus" target="_blank" rel="noopener noreferrer">
              <span className={styles.label}>GitHub:</span> github.com/m-karakus
            </a>
            <a className={styles.link} href="https://www.youtube.com/@metin-karakus" target="_blank" rel="noopener noreferrer">
              <span className={styles.label}>YouTube:</span> youtube.com/@metin-karakus
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}