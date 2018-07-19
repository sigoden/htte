echo "Creating certs folder ..."
mkdir -p certs && cd certs

echo "Generating certificates ..."

PASS=${PASS:-1111}

openssl genrsa -passout pass:$PASS -des3 -out ca.key 4096

openssl req -passin pass:$PASS -new -x509 -days 365 -key ca.key -out ca.crt -subj  "/C=CL/ST=RM/L=Santiago/O=Test/OU=Test/CN=ca"

openssl genrsa -passout pass:$PASS -des3 -out server.key 4096

openssl req -passin pass:$PASS -new -key server.key -out server.csr -subj  "/C=CL/ST=RM/L=Santiago/O=Test/OU=Server/CN=localhost"

openssl x509 -req -passin pass:$PASS -days 365 -in server.csr -CA ca.crt -CAkey ca.key -set_serial 01 -out server.crt

openssl rsa -passin pass:$PASS -in server.key -out server.key

openssl genrsa -passout pass:$PASS -des3 -out client.key 4096

openssl req -passin pass:$PASS -new -key client.key -out client.csr -subj  "/C=CL/ST=RM/L=Santiago/O=Test/OU=Client/CN=localhost"

openssl x509 -passin pass:$PASS -req -days 365 -in client.csr -CA ca.crt -CAkey ca.key -set_serial 01 -out client.crt

openssl rsa -passin pass:$PASS -in client.key -out client.key