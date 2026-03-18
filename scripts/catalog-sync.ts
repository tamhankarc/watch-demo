import { runFullCatalogSync } from '../src/lib/catalog/catalog-import-service';

runFullCatalogSync()
  .then(() => {
    console.log('Catalog sync completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
