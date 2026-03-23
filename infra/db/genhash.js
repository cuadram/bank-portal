const bcrypt = require('/tmp/bcrypt/node_modules/bcryptjs');
const hash = bcrypt.hashSync('angel123', 12);
console.log(hash);
