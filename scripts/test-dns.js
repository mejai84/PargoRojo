
const dns = require('dns');
dns.lookup('db.ryxqoapxzvssxqdsyfzw.supabase.co', { all: true }, (err, addresses) => {
    console.log('addresses:', addresses);
    if (err) console.error('DNS ERROR:', err);
});
