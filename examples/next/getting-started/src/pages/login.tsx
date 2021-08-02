import { client } from 'client';
import { Footer, Header, Hero } from 'components';
import Head from 'next/head';
import { useState } from 'react';

export default function Page() {
  const { useQuery, useMutation } = client;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const generalSettings = useQuery().generalSettings;

  const [login, { isLoading, data, error }] = useMutation(
    (mutation, input: { username?: string; password?: string }) => {
      const { authorization_code } = mutation.loginMutation({ input });

      return authorization_code;
    },
  );

  return (
    <>
      <Header
        title={generalSettings.title}
        description={generalSettings.description}
      />

      <Head>
        <title>Login - {generalSettings.title}</title>
      </Head>

      <Hero title="Login" />

      <main className="content content-single">
        <div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              const code = await login({ args: { username, password } });

              const res = await fetch(
                `http://localhost:3000/api/auth/token?code=${code}`,
              );

              const { access_token } = await res.json();

              console.log(access_token);
            }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Submit</button>
          </form>
        </div>
      </main>

      <Footer copyrightHolder={generalSettings.title} />
    </>
  );
}
