const FabricCAClient = require('fabric-ca-client');
const FabricClient = require('fabric-client');
const fabricClient = new FabricClient();
const path = require('path');

const storePath = path.join(__dirname, 'hfc-key-store');
console.log(' Store path:' + storePath);

const enrollAdmin = (async () => {
    try {
        const stateStore = await FabricClient.newDefaultKeyValueStore({
            path: storePath
        });
        fabricClient.setStateStore(stateStore);
        const cryptoSuite = FabricClient.newCryptoSuite();
        const cryptoStore = FabricClient.newCryptoKeyStore({
            path: storePath
        });
        cryptoSuite.setCryptoKeyStore(cryptoStore);
        fabricClient.setCryptoSuite(cryptoSuite);
        const tlsOptions = {
            trustedRoots: [],
            verify: false
        };
        const fabricCAClient = new FabricCAClient('https://localhost:7054', tlsOptions, 'ca-blueclerk', cryptoSuite);        
        const userFromStore = await fabricClient.getUserContext('admin', true);
        let result;
        if (userFromStore && userFromStore.isEnrolled()) {
            console.log('Successfully loaded admin from persistence');
            result = userFromStore;
        } else {
            try {
                const enrollment = await fabricCAClient.enroll({
                    enrollmentID: 'admin',
                    enrollmentSecret: 'adminpw'
                });
                console.log('Successfully enrolled admin user "admin"');
                const user = await fabricClient.createUser({
                    username: 'admin',
                    mspid: 'BlueclerkMSP',
                    cryptoContent: {
                        privateKeyPEM: enrollment.key.toBytes(),
                        signedCertPEM: enrollment.certificate
                    }
                });
                result = await fabricClient.setUserContext(user);
            } catch (err) {
                console.error('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
                throw new Error('Failed to enroll admin');
            };
        }
        console.log('Assigned the admin user to the fabric client ::' + result.toString());
    } catch (err) {
        console.error('Failed to enroll admin: ' + err);
    }
})();