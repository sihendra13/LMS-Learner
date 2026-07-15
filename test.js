import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  
  // Set localStorage to fake a login
  await page.evaluate(() => {
    localStorage.setItem('axara_learner_db', JSON.stringify({
      currentUser: { email: 'guguh@myaxara.com', name: 'Guguh', dept: 'Sales' },
      videos: [],
      quizSubmissions: [
        { videoTitle: 'Test Video', employeeName: 'Guguh', certStatus: 'pending', postScore: 0 }
      ]
    }));
  });
  
  // Reload to apply login
  await page.reload({ waitUntil: 'networkidle0' });
  
  await browser.close();
  process.exit(0);
})();
