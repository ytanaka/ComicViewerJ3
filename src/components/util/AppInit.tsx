import { useEffect } from 'react';

import { getBundleType } from '@tauri-apps/api/app';
import { getIdentifier } from '@tauri-apps/api/app';
import { getName } from '@tauri-apps/api/app';
import { getTauriVersion } from '@tauri-apps/api/app';
import { getVersion } from '@tauri-apps/api/app';

let APP_NAME = 'ComicViewerJ3';

export function getApplicationName() {
  return APP_NAME;
}

export function AppInit() {
  useEffect(() => {
    async function p() {
      console.log('<AppInit> getBundleType(): ', await getBundleType());
      console.log('<AppInit> getIdentifier(): ', await getIdentifier());
      console.log('<AppInit> getName(): ', await getName());
      console.log('<AppInit> getTauriVersion(): ', await getTauriVersion());
      console.log('<AppInit> getVersion(): ', await getVersion());

      const id = await getIdentifier();
      if (id.endsWith('release')) {
        APP_NAME = 'ComicViewerJ3';
      } else {
        APP_NAME = 'ComicViewerJ3(DEBUG)';
      }
    }
    p();
  }, []);

  return <></>;
}
