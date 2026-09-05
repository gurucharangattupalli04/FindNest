export const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: 'LayoutGrid' },
  { id: 'electronics', name: 'Electronics', icon: 'Laptop' },
  { id: 'wallets', name: 'Wallets & IDs', icon: 'Wallet' },
  { id: 'keys', name: 'Keys', icon: 'KeyRound' },
  { id: 'bags', name: 'Bags & Luggage', icon: 'Briefcase' },
  { id: 'pets', name: 'Pets', icon: 'Dog' },
  { id: 'accessories', name: 'Jewelry & Watches', icon: 'Watch' },
];

export const INITIAL_ITEMS = [
  {
    id: 'item-1',
    type: 'LOST',
    title: 'Space Gray MacBook Pro 14"',
    category: 'electronics',
    description: 'Left on the 3rd floor quiet study area in the university library. Has a distinctive NASA sticker on the top shell.',
    location: 'University Library, 3rd Floor',
    date: '2026-09-04T10:30:00Z',
    reward: '$150 Reward',
    contactName: 'Alex Chen',
    status: 'Active',
    featured: true,
    accentColor: 'from-blue-500/20 to-indigo-500/10'
  },
  {
    id: 'item-2',
    type: 'FOUND',
    title: 'Black Leather Bifold Wallet',
    category: 'wallets',
    description: 'Discovered near the subway ticket machines. Contains a metro transit pass and a student ID for verification.',
    location: 'Central Metro Station, Exit 4',
    date: '2026-09-05T08:15:00Z',
    reward: null,
    contactName: 'Security Desk',
    status: 'Active',
    featured: true,
    accentColor: 'from-emerald-500/20 to-teal-500/10'
  },
  {
    id: 'item-3',
    type: 'LOST',
    title: 'AirPods Pro Gen 2 in Black Matte Case',
    category: 'electronics',
    description: 'Misplaced around the sports gym locker area. Case has a small carabiner attached.',
    location: 'Downtown Fitness Center',
    date: '2026-09-03T18:45:00Z',
    reward: '$30 Reward',
    contactName: 'Maya Patel',
    status: 'Active',
    featured: false,
    accentColor: 'from-rose-500/20 to-pink-500/10'
  },
  {
    id: 'item-4',
    type: 'FOUND',
    title: 'Set of 4 Keys with Red Carabiner & Blue Tag',
    category: 'keys',
    description: 'Found on the park bench along the main fountain walkway. Includes two brass keys and an electronic fob.',
    location: 'City Green Park, East Lawn',
    date: '2026-09-04T14:20:00Z',
    reward: null,
    contactName: 'Park Ranger Station',
    status: 'Active',
    featured: false,
    accentColor: 'from-amber-500/20 to-orange-500/10'
  },
  {
    id: 'item-5',
    type: 'LOST',
    title: 'Golden Retriever Mix ("Barnaby")',
    category: 'pets',
    description: 'Friendly 3-year-old golden retriever wearing a blue reflective collar with an engraved name tag. Slipped leash near Oak St.',
    location: 'Oak Street Neighborhood',
    date: '2026-09-05T07:00:00Z',
    reward: '$300 Reward',
    contactName: 'David & Sarah',
    status: 'Active',
    featured: true,
    accentColor: 'from-amber-400/20 to-yellow-500/10'
  },
  {
    id: 'item-6',
    type: 'FOUND',
    title: 'Charcoal Grey Herschel Travel Backpack',
    category: 'bags',
    description: 'Left under the window seat at the departure gate coffee bar. Unclaimed for over 4 hours.',
    location: 'Airport Terminal 2, Cafe Zone',
    date: '2026-09-04T20:10:00Z',
    reward: null,
    contactName: 'Terminal Lost & Found Desk',
    status: 'Active',
    featured: false,
    accentColor: 'from-purple-500/20 to-indigo-500/10'
  }
];

export const PLATFORM_STATS = [
  { label: 'Items Reported', value: '4,820+', change: '+12% this week' },
  { label: 'Successful Reunions', value: '3,910+', change: '81% recovery rate' },
  { label: 'Avg. Match Time', value: '< 24 Hrs', change: 'Community powered' },
  { label: 'Verified Partners', value: '180+', change: 'Transit, campuses, parks' },
];
