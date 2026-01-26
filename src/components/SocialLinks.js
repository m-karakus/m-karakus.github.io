import React from 'react';
import Link from '@docusaurus/Link';
import styles from './SocialLinks.module.css';

export default function SocialLinks() {
  return (
    <div className={styles.links}>
      <Link className={styles.button} href="https://github.com/m-karakus">
        GitHub
      </Link>
      <Link className={styles.button} href="https://www.linkedin.com/in/metin-karakus-b586b6132">
        LinkedIn
      </Link>
      <Link className={styles.button} href="https://www.youtube.com/@metin-karakus">
        YouTube
      </Link>
      <Link className={styles.button} href="https://www.dropbox.com/scl/fi/979tf7f3ipfjc56sg7q0n/metin_karakus_cv.pdf?rlkey=fr4ix6f8htqopxkbtf3ps4259&st=wvyxd4mc&dl">
        CV (PDF)
      </Link>
    </div>
  );
}
