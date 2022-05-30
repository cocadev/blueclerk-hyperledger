const getAllResults = (iterator, isHistory) => {
    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        if (isHistory && isHistory === true) {
          jsonRes.TxId = res.value.tx_id;
          jsonRes.Timestamp = res.value.timestamp;
          jsonRes.IsDelete = res.value.is_delete.toString();
          try {
            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Value = res.value.value.toString('utf8');
          }
        } else {
          jsonRes.Key = res.value.key;
          try {
            jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Record = res.value.value.toString('utf8');
          }
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  };

  const getQueryResultForQueryStringWithPagination = async (stub, options) => {
    const {
      queryString,
      pageSize,
      bookMark
    } = options;
    console.info('- getQueryResultForQueryString queryString:\n' + queryString);
    const {
      iterator,
      metadata
    } = await stub.getQueryResultWithPagination(JSON.stringify(queryString), pageSize, bookMark);
    console.log("MetaDataFetchec: ", JSON.stringify(metadata, null, 2));
    const results = {};
    results.records = getAllResults(iterator, false);
    results.responseMetadata = {
      recordsCount: metadata.fetched_records_count,
      bookMark: metadata.bookmark,
    };
    return Buffer.from(JSON.stringify(results));
  }

  const getQueryResultForQueryString = async (stub, queryString) => {
    console.info('- getQueryResultForQueryString queryString:\n' + queryString)
    const resultsIterator = await stub.getQueryResult(JSON.stringify(queryString));
    const results = getAllResults(resultsIterator, false);
    return Buffer.from(JSON.stringify(results));
  }

module.exports = {
    getAllResults,
    getQueryResultForQueryStringWithPagination,
    getQueryResultForQueryString
}