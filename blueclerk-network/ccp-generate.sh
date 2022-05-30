#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${P1PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.json 
}

function yaml_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${P1PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.yaml | sed -e $'s/\\\\n/\\\n        /g'
}

ORG=1
P0PORT=7051
P1PORT=8051
CAPORT=7054
PEERPEM=crypto-config/peerOrganizations/blueclerk.blueclerk.com/tlsca/tlsca.blueclerk.blueclerk.com-cert.pem
CAPEM=crypto-config/peerOrganizations/blueclerk.blueclerk.com/ca/ca.blueclerk.blueclerk.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > connection-blueclerk.json
echo "$(yaml_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > connection-blueclerk.yaml

ORG=2
P0PORT=9051
P1PORT=10051
CAPORT=8054
PEERPEM=crypto-config/peerOrganizations/builders.blueclerk.com/tlsca/tlsca.builders.blueclerk.com-cert.pem
CAPEM=crypto-config/peerOrganizations/builders.blueclerk.com/ca/ca.builders.blueclerk.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > connection-builders.json
echo "$(yaml_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > connection-builders.yaml

ORG=3
P0PORT=11051
P1PORT=12051
CAPORT=9054
PEERPEM=crypto-config/peerOrganizations/suppliers.blueclerk.com/tlsca/tlsca.suppliers.blueclerk.com-cert.pem
CAPEM=crypto-config/peerOrganizations/suppliers.blueclerk.com/ca/ca.suppliers.blueclerk.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > connection-suppliers.json
echo "$(yaml_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > connection-suppliers.yaml

ORG=4
P0PORT=13051
P1PORT=14051
CAPORT=10054
PEERPEM=crypto-config/peerOrganizations/serviceProviders.blueclerk.com/tlsca/tlsca.serviceProviders.blueclerk.com-cert.pem
CAPEM=crypto-config/peerOrganizations/serviceProviders.blueclerk.com/ca/ca.serviceProviders.blueclerk.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > connection-serviceProviders.json
echo "$(yaml_ccp $ORG $P0PORT $P1PORT $CAPORT $PEERPEM $CAPEM)" > connection-serviceProviders.yaml