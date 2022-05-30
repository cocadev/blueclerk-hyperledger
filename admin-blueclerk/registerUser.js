const FabricClient = require('fabric-client');
const FabricCAClient = require('fabric-ca-client');
const path = require('path');
const fabricClient = new FabricClient();
const storePath = path.join(__dirname, 'hfc-key-store');

console.log(' Store path:' + storePath);

const enrollUser = (async () => {
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
    const fabricCAClient = new FabricCAClient('https://localhost:7054', null, 'ca-blueclerk', cryptoSuite);
    try {
        const userFromStore = await fabricClient.getUserContext('admin', true);
        if (userFromStore && userFromStore.isEnrolled()) {
            console.log('Successfully loaded admin from persistence');
            const adminUser = userFromStore;
            const secret = await fabricCAClient.register({
                enrollmentID: 'blueclerkUser1',
                affiliation: 'org1.department1',
                role: 'client'
            }, adminUser);
            console.log('Successfully registered blueclerkUser1 - secret:' + secret);
            const enrollment = await fabricCAClient.enroll({
                enrollmentID: 'blueclerkUser1',
                enrollmentSecret: secret
            });
            console.log('Successfully enrolled member user "blueclerkUser1" ');
            const user = await fabricClient.createUser({
                username: 'blueclerkUser1',
                mspid: 'BlueclerkMSP',
                cryptoContent: {
                    privateKeyPEM: enrollment.key.toBytes(),
                    signedCertPEM: enrollment.certificate
                }
            });
            const memberUser = user;
            const result = await fabricClient.setUserContext(memberUser);
            console.log('blueclerkUser1 was successfully registered and enrolled and is ready to interact with the fabric network');
        } else {
            throw new Error('Failed to get admin.... run enrollAdmin.js');
        }
    } catch (error) {
        console.error('Failed to register: ' + error);
        if (error.toString().indexOf('Authorization') > -1) {
            console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
                'Try again after deleting the contents of the store directory ' + storePath);
        }
    }
})();