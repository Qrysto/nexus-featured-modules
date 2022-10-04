import path from 'path';
import express from 'express';
import cors from 'cors';
import { parse } from 'semver';

import featuredModules from './featuredModules';

const latestModuleList = featuredModules.find((list) => list.latest).modules;

function serveFeaturedModules(app) {
  app.use(
    '/resources',
    express.static(path.join(__dirname, '..', 'resources'), {
      etag: false,
      immutable: true,
      maxAge: 1000 * 60 * 60 * 24 * 90,
      index: false,
    })
  );

  app.get('/featured-modules', (req, res) => {
    const walletVersion = req.query?.wallet_version;
    const parsedVersion = parse(walletVersion);

    // Cache the list for 1 day
    res.append('Cache-Control', 'max-age=86400000');

    if (parsedVersion) {
      const matchedList = featuredModules.find(
        // use `compareMain` so that prerelease tags are ignored
        (list) => parsedVersion.compareMain(list.fromWalletVersion) >= 0
      );
      if (matchedList) {
        res.json(matchedList.modules);
      }
    }

    // if (!parsedVersion || !matchedList)
    res.json(latestModuleList);
  });
}

async function run() {
  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: /^http:\/\/localhost/,
    })
  );

  serveFeaturedModules(app);

  const port = process.env.PORT || 80;
  app.listen(port, () => {
    console.log('Listening on port ' + port);
  });
}

run();
