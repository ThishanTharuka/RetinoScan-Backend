import * as admin from 'firebase-admin';
import * as serviceAccount from '../secrets/retinoscan-99.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export { admin };
