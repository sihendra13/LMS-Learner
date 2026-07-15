import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    localStorage.setItem('axara_learner_db', JSON.stringify({
      currentUser: { email: 'guguh@myaxara.com', name: 'Guguh Unggul', dept: 'Sales' },
      videos: [
        { id: '1', title: 'SOP Sales: Proses Onboarding Klien Baru', dept: 'Sales', progress: 0, duration: '8:24' }
      ],
      quizSubmissions: [
        { videoTitle: 'SOP Sales: Proses Onboarding Klien Baru', employeeName: 'Guguh Unggul', certStatus: 'pending', postScore: 0 }
      ]
    }));
  });
  
  // Reload to apply login
  await page.reload({ waitUntil: 'networkidle0' });
  console.log('Reloaded. Testing SOP page...');
  
  await page.goto('http://localhost:4173/#sop', { waitUntil: 'networkidle0' });
  console.log('SOP page loaded.');
  
  await page.goto('http://localhost:4173/#sertifikasi', { waitUntil: 'networkidle0' });
  console.log('Certifications page loaded.');
  
  await browser.close();
  process.exit(0);
})();
