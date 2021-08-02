import { getNextStaticProps, HeadlessContext } from '@faustjs/next';
import { client } from 'client';
import { Footer, Header, Hero } from 'components';
import { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { useContext, useEffect } from 'react';
import { useAccessToken } from '@faustjs/core';

export default function Page() {
  const { useQuery } = client;
  const generalSettings = useQuery().generalSettings;

  const accessToken = useAccessToken();

  console.log(accessToken);

  useEffect(() => {
    (async () => {
      const res = await fetch(`http://localhost:3000/api/auth/token`);
      const json = await res.json();

      const accessToken = json.access_token;

      console.log(accessToken);
    })();
  }, []);

  return (
    <>
      <Header
        title={generalSettings.title}
        description={generalSettings.description}
      />

      <Head>
        <title>Custom Page - {generalSettings.title}</title>
      </Head>

      <Hero title="Custom Page" />

      <main className="content content-single">
        <div className="wrap">
          <p>
            You can still create pages just as you would in{' '}
            <a
              href="https://nextjs.org/docs/basic-features/pages"
              target="_blank"
              rel="noreferrer">
              Next.js
            </a>
            . Take a look at <code>src/pages/custom-page.tsx</code> for an
            example.
          </p>
        </div>
      </main>

      <Footer copyrightHolder={generalSettings.title} />
    </>
  );
}

// export async function getStaticProps(context: GetStaticPropsContext) {
//   return getNextStaticProps(context, {
//     Page,
//     client,
//   });
// }
