# Data attribution

`gazetteer.tsv.gz` and `countries.json` are derived from GeoNames (https://www.geonames.org/),
`cities1000.txt`, `admin1CodesASCII.txt` and `countryInfo.txt`, licensed under
Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/).
Changes: unused columns removed, alternate names filtered to Latin script and capped
(30 for places with 15,000+ inhabitants, 2 for smaller places), admin1 codes replaced by names.
Rebuild: download the three files and run `node scripts/build-gazetteer.mjs <dir>`.
