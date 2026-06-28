const fs = require('fs');
const https = require('https');
const path = require('path');

const tileMap = {
  'Man1.svg': 'm1.svg', 'Man2.svg': 'm2.svg', 'Man3.svg': 'm3.svg', 'Man4.svg': 'm4.svg',
  'Man5.svg': 'm5.svg', 'Man5-Dora.svg': 'm0.svg', 'Man6.svg': 'm6.svg', 'Man7.svg': 'm7.svg',
  'Man8.svg': 'm8.svg', 'Man9.svg': 'm9.svg',
  'Pin1.svg': 'p1.svg', 'Pin2.svg': 'p2.svg', 'Pin3.svg': 'p3.svg', 'Pin4.svg': 'p4.svg',
  'Pin5.svg': 'p5.svg', 'Pin5-Dora.svg': 'p0.svg', 'Pin6.svg': 'p6.svg', 'Pin7.svg': 'p7.svg',
  'Pin8.svg': 'p8.svg', 'Pin9.svg': 'p9.svg',
  'Sou1.svg': 's1.svg', 'Sou2.svg': 's2.svg', 'Sou3.svg': 's3.svg', 'Sou4.svg': 's4.svg',
  'Sou5.svg': 's5.svg', 'Sou5-Dora.svg': 's0.svg', 'Sou6.svg': 's6.svg', 'Sou7.svg': 's7.svg',
  'Sou8.svg': 's8.svg', 'Sou9.svg': 's9.svg',
  'Ton.svg': 'z1.svg', 'Nan.svg': 'z2.svg', 'Shaa.svg': 'z3.svg', 'Pei.svg': 'z4.svg',
  'Haku.svg': 'z5.svg', 'Hatsu.svg': 'z6.svg', 'Chun.svg': 'z7.svg',
  'Back.svg': 'back.svg'
};

const baseUrl = 'https://raw.githubusercontent.com/FluffyStuff/riichi-mahjong-tiles/master/Regular/';
const outputDir = path.join(__dirname, '..', 'public', 'images', 'tiles');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        fs.unlink(dest, () => reject(new Error(`Failed to download ${url}: ${response.statusCode}`)));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function downloadAll() {
  console.log('Downloading tiles...');
  let count = 0;
  for (const [source, target] of Object.entries(tileMap)) {
    const url = baseUrl + source;
    const dest = path.join(outputDir, target);
    try {
      await downloadFile(url, dest);
      count++;
      console.log(`Downloaded ${target} (${count}/${Object.keys(tileMap).length})`);
    } catch (err) {
      console.error(`Error downloading ${source}:`, err.message);
    }
  }
  console.log('Download complete!');
}

downloadAll();
