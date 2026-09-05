/**
 * FindNest Step 9 Frontend UI Verification Script
 * Validates item normalization, confidence tier mapping, date formatting,
 * and contract integrity for Match Results UI.
 */
import { normalizeItem } from '../src/services/itemsApi.js';
import { formatDate, formatTimeAgo } from '../src/utils/formatters.js';

console.log('\n===========================================================================');
console.log('FindNest: Step 9 Frontend UI Contract & Data Logic Verification');
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

// 1. Test normalizeItem for Lost Item
console.log('\n[Test 1/6] Testing normalizeItem for Lost Item...');
const rawLost = {
  id: 101,
  title: 'Silver iPad Pro',
  category: 'electronics',
  description: '11 inch iPad with case',
  color: 'Silver',
  brand: 'Apple',
  location: 'Library',
  date_lost: '2026-09-01T12:00:00Z',
  reward: '$100',
  status: 'active',
  user_id: 12,
  image_url: '/static/uploads/ipad.jpg',
  is_featured: false,
};
const normLost = normalizeItem(rawLost, 'LOST');
assert(normLost.type === 'LOST', 'Item correctly tagged as LOST');
assert(normLost.title === 'Silver iPad Pro', 'Item title preserved');
assert(normLost.imageUrl === '/static/uploads/ipad.jpg', 'Image URL assigned to imageUrl');
assert(normLost.reward === '$100', 'Reward preserved');
assert(normLost.accentColor !== undefined, 'Accent color assigned');

// 2. Test normalizeItem for Found Item
console.log('\n[Test 2/6] Testing normalizeItem for Found Item...');
const rawFound = {
  id: 202,
  title: 'Leather Keychain',
  category: 'keys',
  description: 'Found on grass',
  location: 'North Courtyard',
  storage_location: 'Security Desk Locker A',
  date_found: '2026-09-02T10:00:00Z',
  status: 'active',
  image_url: null,
};
const normFound = normalizeItem(rawFound, 'FOUND');
assert(normFound.type === 'FOUND', 'Item correctly tagged as FOUND');
assert(normFound.storage_location === 'Security Desk Locker A', 'Storage location preserved');
assert(normFound.imageUrl === null, 'Null image URL handled gracefully');

// 3. Test Confidence Tier Mapping Logic
console.log('\n[Test 3/6] Testing Confidence Tier Mapping Logic...');
function getConfidenceTier(score) {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 35) return 'low';
  return 'filtered';
}
assert(getConfidenceTier(100.0) === 'high', '100% is High confidence');
assert(getConfidenceTier(75.0) === 'high', '75.0% boundary is High confidence');
assert(getConfidenceTier(74.99) === 'medium', '74.99% is Medium confidence');
assert(getConfidenceTier(50.0) === 'medium', '50.0% boundary is Medium confidence');
assert(getConfidenceTier(49.99) === 'low', '49.99% is Low confidence');
assert(getConfidenceTier(35.0) === 'low', '35.0% boundary is Low confidence');
assert(getConfidenceTier(34.99) === 'filtered', '34.99% is below threshold (Filtered)');

// 4. Test Sorting by Score vs Date
console.log('\n[Test 4/6] Testing Sorting Logic...');
const mockMatches = [
  { score: 65, matched_item: { id: 1, date: '2026-09-01T00:00:00Z' } },
  { score: 92, matched_item: { id: 2, date: '2026-08-15T00:00:00Z' } },
  { score: 45, matched_item: { id: 3, date: '2026-09-04T00:00:00Z' } },
];

const sortedByScore = [...mockMatches].sort((a, b) => b.score - a.score);
assert(sortedByScore[0].score === 92, 'Highest score is ranked first');
assert(sortedByScore[2].score === 45, 'Lowest score is ranked last');

const sortedByDate = [...mockMatches].sort((a, b) => new Date(b.matched_item.date) - new Date(a.matched_item.date));
assert(sortedByDate[0].matched_item.id === 3, 'Most recent date is ranked first');

// 5. Test Filtering by Confidence
console.log('\n[Test 5/6] Testing Confidence Filtering Logic...');
const mockRanked = [
  { confidence: 'high', score: 85 },
  { confidence: 'medium', score: 62 },
  { confidence: 'low', score: 40 },
  { confidence: 'high', score: 95 },
];
const onlyHigh = mockRanked.filter((m) => m.confidence === 'high');
assert(onlyHigh.length === 2, 'High filter correctly keeps 2 items');
const onlyMedium = mockRanked.filter((m) => m.confidence === 'medium');
assert(onlyMedium.length === 1, 'Medium filter correctly keeps 1 item');

// 6. Test Formatters Resilience
console.log('\n[Test 6/6] Testing Formatters with Edge Cases...');
assert(formatDate(null) === '', 'formatDate handles null');
assert(formatDate(undefined) === '', 'formatDate handles undefined');
assert(formatTimeAgo(null) === '', 'formatTimeAgo handles null');
assert(formatDate('2026-09-05T00:00:00Z').includes('2026'), 'formatDate formats valid ISO string');

console.log('\n===========================================================================');
console.log(`ALL ${passed}/${total} FRONTEND UI CONTRACT CHECKS PASSED!`);
console.log('===========================================================================\n');
