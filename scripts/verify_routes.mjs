/**
 * Route Structure & Verification Script for FindNest
 * Validates that all requested routes exist, export valid components,
 * and that the Navbar items map 1:1 to their required route targets.
 */
import fs from 'fs';
import path from 'path';

console.log('\n===========================================================================');
console.log('FindNest: Route Structure & Navigation Contract Verification');
console.log('===========================================================================');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exit(1);
  }
  passed++;
  console.log(`  PASS: ${message}`);
}

const REQUIRED_ROUTES = [
  { item: 'Logo', path: '/', page: 'src/pages/HomePage.jsx', component: 'HomePage' },
  { item: 'Browse Listings', path: '/browse', page: 'src/pages/BrowsePage.jsx', component: 'BrowsePage' },
  { item: 'How It Works', path: '/how-it-works', page: 'src/pages/HowItWorksPage.jsx', component: 'HowItWorksPage' },
  { item: 'Community Stats', path: '/community-stats', page: 'src/pages/CommunityStatsPage.jsx', component: 'CommunityStatsPage' },
  { item: 'Found Something (button)', path: '/report-found', page: 'src/pages/ReportFoundPage.jsx', component: 'ReportFoundPage' },
  { item: 'Report Lost (button)', path: '/report-lost', page: 'src/pages/ReportLostPage.jsx', component: 'ReportLostPage' },
  { item: 'Sign In', path: '/login', page: 'src/pages/LoginPage.jsx', component: 'LoginPage' },
  { item: 'Register', path: '/register', page: 'src/pages/RegisterPage.jsx', component: 'RegisterPage' },
  { item: 'Dashboard', path: '/my-reports', page: 'src/pages/MyReportsPage.jsx', component: 'MyReportsPage' },
  { item: 'FAQ', path: '/faq', page: 'src/pages/FAQ.jsx', component: 'FAQPage' },
  { item: '404 Fallback', path: '*', page: 'src/pages/NotFoundPage.jsx', component: 'NotFoundPage' },
];

console.log('\n[Check 1/4] Verifying all Route Page files exist on disk...');
REQUIRED_ROUTES.forEach(({ page, component }) => {
  const filePath = path.resolve(page);
  assert(fs.existsSync(filePath), `File exists: ${page}`);
  const content = fs.readFileSync(filePath, 'utf-8');
  assert(
    content.includes(`export function ${component}`) || content.includes(`export default function ${component}`),
    `File ${page} exports ${component}`
  );
});

console.log('\n[Check 2/4] Verifying App.jsx declares all Routes within BrowserRouter...');
const appContent = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
assert(appContent.includes('BrowserRouter'), 'App.jsx wraps with BrowserRouter');
assert(appContent.includes('ScrollToTop'), 'App.jsx includes ScrollToTop on route changes');

REQUIRED_ROUTES.forEach(({ path: routePath, component }) => {
  const routeDeclaration = `path="${routePath}"`;
  assert(appContent.includes(routeDeclaration), `App.jsx defines Route ${routeDeclaration} for ${component}`);
});

console.log('\n[Check 3/4] Verifying Navbar.jsx links to required routes with NavLink / Link...');
const navbarContent = fs.readFileSync(path.resolve('src/components/layout/Navbar.jsx'), 'utf-8');
assert(navbarContent.includes('to="/"'), 'Navbar logo links to /');
assert(navbarContent.includes('to="/browse"'), 'Navbar has link to /browse');
assert(navbarContent.includes('to="/how-it-works"'), 'Navbar has link to /how-it-works');
assert(navbarContent.includes('to="/community-stats"'), 'Navbar has link to /community-stats');
assert(navbarContent.includes('to="/report-found"'), 'Navbar button links to /report-found');
assert(navbarContent.includes('to="/report-lost"'), 'Navbar button links to /report-lost');
assert(navbarContent.includes('to="/login"'), 'Navbar has link to /login');
assert(navbarContent.includes('to="/register"'), 'Navbar has link to /register');
assert(navbarContent.includes('isActive'), 'Navbar uses NavLink isActive for highlighting');
assert(navbarContent.includes('closeMobileMenu') || navbarContent.includes('setMobileMenuOpen(false)'), 'Navbar closes mobile menu upon link selection');

console.log('\n[Check 4/4] Verifying SPA fallback configuration in vercel.json...');
const vercelConfig = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf-8'));
assert(Boolean(vercelConfig.rewrites && vercelConfig.rewrites.length > 0), 'vercel.json contains SPA rewrites');
assert(vercelConfig.rewrites[0].destination === '/index.html', 'vercel.json rewrites all paths to /index.html');

console.log('\n===========================================================================');
console.log(`ALL ${passed}/${total} ROUTE ARCHITECTURE CHECKS PASSED!`);
console.log('===========================================================================\n');
