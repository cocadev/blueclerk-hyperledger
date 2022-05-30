#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Build Blueclerk Network end-to-end test"
echo
CHANNEL_NAME="$1"
DELAY="$2"
LANGUAGE="$3"
TIMEOUT="$4"
VERBOSE="$5"
NO_CHAINCODE="$6"
: ${CHANNEL_NAME:="mychannel"}
: ${DELAY:="3"}
: ${LANGUAGE:="golang"}
: ${TIMEOUT:="10"}
: ${VERBOSE:="false"}
: ${NO_CHAINCODE:="false"}
LANGUAGE=`echo "$LANGUAGE" | tr [:upper:] [:lower:]`
COUNTER=1
MAX_RETRY=10

CC_SRC_PATH="github.com/chaincode/chaincode_example02/go/"
if [ "$LANGUAGE" = "node" ]; then
	CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/blueclerkcc/node/"
fi

if [ "$LANGUAGE" = "java" ]; then
	CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/chaincode_example02/java/"
fi

echo "Channel name : "$CHANNEL_NAME

# import utils
. scripts/utils.sh

createChannel() {
	setGlobals 0 1

	if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
                set -x
		peer channel create -o orderer.blueclerk.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx >&log.txt
		res=$?
                set +x
	else
				set -x
		peer channel create -o orderer.blueclerk.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
		res=$?
				set +x
	fi
	cat log.txt
	verifyResult $res "Channel creation failed"
	echo "===================== Channel '$CHANNEL_NAME' created ===================== "
	echo
}

joinChannel () {
	for org in 1 2 3 4; do
	    for peer in 0 1; do
		joinChannelWithRetry $peer $org
		echo "===================== peer${peer}.org${org} joined channel '$CHANNEL_NAME' ===================== "
		sleep $DELAY
		echo
	    done
	done
}

## Create channel
echo "Creating channel..."
createChannel

## Join all the peers to the channel
echo "Having all peers join the channel..."
joinChannel

## Set the anchor peers for each org in the channel
echo "Updating anchor peers for blueclerk..."
updateAnchorPeers 0 1
echo "Updating anchor peers for builders..."
updateAnchorPeers 0 2
echo "Updating anchor peers for suppliers..."
updateAnchorPeers 0 3
echo "Updating anchor peers for serviceProviders..."
updateAnchorPeers 0 4

if [ "${NO_CHAINCODE}" != "true" ]; then

	## Install chaincode on peer0.blueclerk and peer0.builders
	echo "Installing chaincode on peer0.blueclerk..."
	installChaincode 0 1
	echo "Install chaincode on peer0.builders..."
	installChaincode 0 2
	echo "Install chaincode on peer0.suppliers..."
	installChaincode 0 3
	echo "Install chaincode on peer0.serviceProviders..."
	installChaincode 0 4

	# Instantiate chaincode on peer0.builders
	echo "Instantiating chaincode on peer0.builders..."
	instantiateChaincode 0 2

	# Query chaincode on peer0.blueclerk
	echo "Querying chaincode on peer0.blueclerk..."
	chaincodeQuery 0 1 100

	# Invoke chaincode on peer0.blueclerk and peer0.builders
	# echo "Sending invoke transaction on peer0.blueclerk peer0.builders..."
	# chaincodeInvoke 0 1 0 2
	
	# ## Install chaincode on peer1.builders
	# echo "Installing chaincode on peer1.builders..."
	# installChaincode 1 2

	# # Query on chaincode on peer1.builders, check if the result is 90
	# echo "Querying chaincode on peer1.builders..."
	# chaincodeQuery 1 2 90
	
fi

echo
echo "========= All GOOD, Blueclerk Network execution completed =========== "
echo

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0
