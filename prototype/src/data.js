// Sample data for the prototype. Everything here is placeholder content that
// the real system would supply (plan terms, prefilled business info, etc.).

export const PLAN = {
  name: 'AI MAX, starting with your website',
  price: 499,
  term: '12 months',
  termMonths: 12,
  billing: 'Monthly',
  dueToday: 499,
  nextBill: 'November 14, 2026',
  billDay: '14th',
};

export const CLIENT = {
  firm: 'The Duran Law Firm',
  site: 'duranfirm.com',
  first: 'Michael',
};

export const PM = {
  name: 'Michelle Phares',
  first: 'Michelle',
  role: 'Your point of contact',
  photo: 'michelle.jpg',
};

export const HELP = {
  phone: '(800) 555-0123',
  email: 'help@aimax.example',
  hours: 'Monday to Friday, 7 AM to 6 PM Central',
};

export const TIMEZONES = ['Eastern', 'Central', 'Mountain', 'Pacific', 'Alaska', 'Hawaii'];

export const TIMES = (() => {
  const out = [];
  for (let h = 5; h <= 22; h++) {
    for (const m of [0, 30]) {
      const hh = h % 12 === 0 ? 12 : h % 12;
      out.push(`${hh}:${m === 0 ? '00' : '30'} ${h < 12 ? 'AM' : 'PM'}`);
    }
  }
  return out;
})();

export const SERVICE_SUGGESTIONS = ['Elder Law', 'Trust Administration', 'Special Needs Planning', 'Business Succession', 'Veterans Benefits'];

export const DRAFT_BIZ = {
  name: 'The Duran Law Firm',
  phone: '(214) 225-4150',
  showPhone: true,
  email: 'intake@duranfirm.com',
  showEmail: true,
  locations: [
    {
      id: 'loc1',
      label: 'Dallas office',
      street: '13355 Noel Rd',
      suite: 'Ste 1100',
      city: 'Dallas',
      state: 'TX',
      zip: '75240',
      country: 'United States',
      showAddress: true,
      tz: 'Central',
      hours: {
        weekdays: { closed: false, open: '8:00 AM', close: '5:00 PM' },
        sat: { closed: true, open: '9:00 AM', close: '12:00 PM' },
        sun: { closed: true, open: '9:00 AM', close: '12:00 PM' },
      },
      confirmed: false,
    },
  ],
  serviceAreas: ['Dallas', 'Plano', 'Frisco', 'McKinney', 'Allen', 'Collin County'],
  services: [
    { name: 'Probate', priority: true },
    { name: 'Guardianship', priority: false },
    { name: 'Estate Planning', priority: true },
    { name: 'Wills & Trusts', priority: false },
    { name: 'Powers of Attorney', priority: false },
    { name: 'Probate Litigation', priority: false },
  ],
  freeConsult: true,
  team: [
    { id: 't1', name: 'Michael A. Duran', cred: 'Attorney · Licensed in Texas' },
    { id: 't2', name: 'Elena Ruiz', cred: 'Paralegal' },
  ],
};

export const STAGES = [
  { key: 'signup', label: 'Sign up', icon: 'user' },
  { key: 'details', label: 'Details', icon: 'fileText' },
  { key: 'website', label: 'Website', icon: 'monitor' },
  { key: 'launch', label: 'Launch', icon: 'rocket' },
];

export const MILESTONES = [
  { key: 'paid', label: 'Paid' },
  { key: 'confirmed', label: 'Details confirmed' },
  { key: 'drafted', label: 'Draft updated' },
  { key: 'approved', label: 'Website approved' },
  { key: 'live', label: 'Website live' },
  { key: 'platform', label: 'Platform setup complete' },
];

export const REQUEST_TYPES = [
  { id: 'text', label: 'Content change', icon: 'type', hint: 'Tell us the words you would like here.' },
  { id: 'image', label: 'Image change', icon: 'image', hint: 'Tell us what photo to use. Add your own if you have one.' },
  { id: 'note', label: 'General note', icon: 'message', hint: 'Anything else you want us to know about this spot.' },
];

export const CRM_OPTIONS = ['Clio', 'Lawmatics', 'HubSpot', 'Salesforce', 'Zoho CRM', 'Other'];

export const SOCIALS = [
  { key: 'google', name: 'Google Business Profile', icon: 'mapPin', pick: 'Choose your business', accounts: ['The Duran Law Firm · Dallas, TX', 'Duran Law Firm (old listing) · Plano, TX'] },
  { key: 'facebook', name: 'Facebook', icon: 'users', pick: 'Choose your page', accounts: ['The Duran Law Firm', 'Duran Family Legal Tips'] },
  { key: 'instagram', name: 'Instagram', icon: 'image', pick: 'Choose your account', accounts: ['@duranlawfirm'] },
];
