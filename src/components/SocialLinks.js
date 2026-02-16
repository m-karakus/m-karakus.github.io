import React from 'react';
import Link from '@docusaurus/Link';
import styles from './SocialLinks.module.css';

export default function SocialLinks() {
  return (
    <div className={styles.links}>
      <Link className={styles.button} href="https://www.youtube.com/@metin-karakus">
        YouTube
      </Link>
      <Link className={styles.button} href="https://github.com/m-karakus">
        GitHub
      </Link>
      <Link className={styles.button} href="https://www.linkedin.com/in/metin-karakus-b586b6132">
        LinkedIn
      </Link>
      <Link className={styles.button} href="mailto:metin_karakus@yahoo.com">
        Email
      </Link>
    </div>
  );
}
