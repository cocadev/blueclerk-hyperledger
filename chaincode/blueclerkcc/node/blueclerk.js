const shim = require('fabric-shim');
const {
  validateIdentityData,
  validateAgentObject,
  validateUpdateObject,
  validateIdentityDataSync
} = require('./identitySchema');
const {
  getQueryResultForQueryStringWithPagination,
} = require('./helpers');

var Chaincode = class {
  async Init(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let args = ret.params;
    if (args.length != 4) {
      return shim.error('Incorrect number of arguments. Expecting 4');
    }

    let A = args[0];
    let B = args[2];
    let Aval = args[1];
    let Bval = args[3];

    if (typeof parseInt(Aval) !== 'number' || typeof parseInt(Bval) !== 'number') {
      return shim.error('Expecting integer value for asset holding');
    }

    try {
      await stub.putState(A, Buffer.from(Aval));
      try {
        await stub.putState(B, Buffer.from(Bval));
        return shim.success();
      } catch (err) {
        return shim.error(err);
      }
    } catch (err) {
      return shim.error(err);
    }
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found');
      return shim.success();
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async createIdentity(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }
    const data = JSON.parse(args[0]);
    const identityValidatedData = await validateIdentityData(data);
    identityValidatedData.docType = 'identity',
    identityValidatedData.isVerified = false;
    identityValidatedData.isSuspended = false;
    const identityObjectAsBuffer = Buffer.from(JSON.stringify(identityValidatedData));
    await stub.putState(identityValidatedData.systemId, identityObjectAsBuffer);
    console.info('New Identity Created\n', JSON.stringify(identityValidatedData, null, 2));
    return identityObjectAsBuffer;
  };

  async verifyIdentity(stub, args) {
    if (args.length !== 4) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }
    const identityId = args[0];
    const isVerified = args[1];
    const verificationDocumentType = args[2];
    const authorizedAgent = JSON.parse(args[3]);
    const validationResultOfAgentObject = await validateAgentObject(authorizedAgent);

    const identityBytes = await stub.getState(identityId);
    if (!identityBytes.toString()) {
      throw new Error(`Identity with id ${identityId} does not exist`);
    };

    const identityObject = JSON.parse(identityBytes.toString());
    identityObject.isVerified = isVerified;
    identityObject.authorizedAgent = validationResultOfAgentObject;
    identityObject.verificationDocumentType = verificationDocumentType;

    const identityObjectAsBuffer = Buffer.from(JSON.stringify(identityObject));
    console.info('Identity Verification\n', identityId, isVerified);
    await stub.putState(identityId, identityObjectAsBuffer);
    return identityObjectAsBuffer;
  };

  async bulkCreateIdentities(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }
    const data = JSON.parse(args[0]);
    let identites = [];
    data.forEach(identity => {
      const identityValidatedData = validateIdentityDataSync(identity);
      identityValidatedData.docType = 'identity',
      identityValidatedData.isVerified = false;
      identityValidatedData.isSuspended = false;
      const identityObjectAsBuffer = Buffer.from(JSON.stringify(identityValidatedData));
      // console.info('New Identity Created\n', JSON.stringify(identityValidatedData, null, 2));
      identites.push(stub.putState(identityValidatedData.systemId, identityObjectAsBuffer));
    });
    return Buffer.from(JSON.stringify(await Promise.all(identites)));
  };

  async updateIdentity(stub, args) {
    if (args.length !== 2) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }
    const identityId = args[0];
    const updateObject = JSON.parse(args[1]);
    const validateUpdateObjectResult = await validateUpdateObject(updateObject);

    const identityBytes = await stub.getState(identityId);
    if (!identityBytes.toString()) {
      throw new Error(`Identity with id ${identityId} does not exist`);
    };

    const identityObject = JSON.parse(identityBytes.toString());
    if(validateUpdateObjectResult?.firstName) {
      identityObject.firstName = validateUpdateObjectResult?.firstName;
    }
    if(validateUpdateObjectResult?.lastName) {
      identityObject.lastName = validateUpdateObjectResult?.lastName;
    }
    if(validateUpdateObjectResult?.email) {
      identityObject.email = validateUpdateObjectResult?.email;
    }
    if(validateUpdateObjectResult?.phoneNumber) {
      identityObject.phoneNumber = validateUpdateObjectResult?.phoneNumber;
    }
    identityObject.isVerified = false;
    delete identityObject.authorizedAgent;
    delete identityObject.verificationDocumentType;

    const identityObjectAsBuffer = Buffer.from(JSON.stringify(identityObject));
    console.info('Identity Updated\n', identityId, JSON.stringify(updateObject,null,2));
    await stub.putState(identityId, identityObjectAsBuffer);
    return identityObjectAsBuffer;
  };

  async suspendIdentity(stub, args) {
    if (args.length !== 3) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }
    const identityId = args[0];
    const suspensionReason = args[1];
    const authorizedAgent = JSON.parse(args[2]);
    const validationResultOfAgentObject = await validateAgentObject(authorizedAgent);

    const identityBytes = await stub.getState(identityId);
    if (!identityBytes.toString()) {
      throw new Error(`Identity with id ${identityId} does not exist`);
    };

    const identityObject = JSON.parse(identityBytes.toString());
    identityObject.isSuspended = true;
    identityObject.authorizedAgent = validationResultOfAgentObject;
    identityObject.suspensionReason = suspensionReason;

    const identityObjectAsBuffer = Buffer.from(JSON.stringify(identityObject));
    console.info('Identity Suspended\n', identityId, suspensionReason);
    await stub.putState(identityId, identityObjectAsBuffer);
  };

  async getAssetByID(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }
    const assetId = args[0];
    const assetBytes = await stub.getState(assetId);
    if (!assetBytes.toString()) {
      throw new Error(`Asset with id: ${assetId} does not exist`)
    }
    return assetBytes;
  }

  async identitiesDynamicQuery(stub, args) {
    if (args.length !== 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }
    const paginator = JSON.parse(args[0]);
    const selectors = JSON.parse(args[1]);
    const queryString = {
      selector: {
        docType: 'identity',
        ...selectors
      }
    };
    const options = {
      queryString,
      pageSize: paginator.pageSize,
      bookMark: paginator.bookMark
    }
    const results = await getQueryResultForQueryStringWithPagination(stub, options);
    return results;
  };

  async getHistoryForAsset(stub, args) {
    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting 1')
    }
    let assetId = args[0];
    let resultsIterator = await stub.getHistoryForKey(assetId);
    let results = getAllResults(resultsIterator, true);
    return Buffer.from(JSON.stringify(results));
  }

  // Deletes an entity from state
  async delete(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let A = args[0];

    // Delete the key from the state in ledger
    await stub.deleteState(A);
  }

  // query callback representing the query of a chaincode
  async query(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the person to query')
    }

    let jsonResp = {};
    let A = args[0];

    // Get the state from the ledger
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      jsonResp.error = 'Failed to get state for ' + A;
      throw new Error(JSON.stringify(jsonResp));
    }

    jsonResp.name = A;
    jsonResp.amount = Avalbytes.toString();
    console.info('Query Response:');
    console.info(jsonResp);
    return Avalbytes;
  }
};

shim.start(new Chaincode());