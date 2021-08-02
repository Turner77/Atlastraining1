import { IncomingMessage, ServerResponse } from 'http';
import trim from 'lodash/trim';
import { headlessConfig } from '../config';
import { getQueryParam, isValidUrl } from '../utils';
import { authorize, ensureAuthorization } from './authorize';
import { getRefreshToken, storeAccessToken, storeRefreshToken } from './cookie';

export function redirect(res: ServerResponse, url: string): void {
  res.writeHead(302, {
    Location: url,
  });

  res.end();
}

/**
 * A Node handler for processing incoming requests to exchange an Authorization Code
 * for an Access Token using the WordPress API. Once the code is exchanged, this
 * handler stores the Access Token on the cookie and redirects to the frontend.
 */
export async function authorizeHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const url = req.url as string;
    const code = getQueryParam(url, 'code');
    const redirectUri = getQueryParam(url, 'redirect_uri');

    const host = req.headers.host ?? '';
    const cookieOptions = {
      request: req,
    };

    const protocol = /localhost/.test(host) ? 'http:' : 'https:';
    const fullRedirectUrl = isValidUrl(redirectUri)
      ? redirectUri
      : `${protocol}//${host}/${trim(redirectUri, '/')}`;

    /**
     * If missing code, this is a request that's meant to trigger authorization such as a preview.
     */
    if (!code && redirectUri) {
      const response = ensureAuthorization(fullRedirectUrl, cookieOptions);

      if (typeof response !== 'string' && response?.redirect) {
        redirect(res, response.redirect);

        return;
      }

      /**
       * We already have an access token stored, go ahead and redirect.
       */
      redirect(res, fullRedirectUrl);
      return;
    }

    if (!code || !redirectUri) {
      res.statusCode = 401;
      res.end();

      return;
    }

    const result = await authorize(code);
    storeAccessToken(result.access_token, res, {
      request: req,
    });

    redirect(res, redirectUri);
  } catch (e) {
    res.statusCode = 500;
    res.end();
  }
}

export async function accessTokenHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<any> {
  const url = req.url as string;
  const code = getQueryParam(url, 'code');
  const { wpUrl } = headlessConfig();

  const response = await fetch(`${wpUrl}/wp-json/wpac/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      code: code || undefined,
      refresh_token: getRefreshToken({ request: req }),
    }),
  });

  if (!response.ok) {
    res.statusCode = 400;
    res.end({ error: 'unauthorized' });
  }

  const { access_token, refresh_token } = (await response.json()) as {
    access_token: string;
    refresh_token: string;
  };

  storeRefreshToken(refresh_token, res, {
    request: req,
  });

  res.end(JSON.stringify({ access_token }));
}
