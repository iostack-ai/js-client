# js-client
Typescript/Javascript Client for interacting with iostack inference service


## Install

* Clone repo

* Install dependencies
```
npm install
```

* Add a ```.env``` file
```
IOSTACK_PLATFORM_ENDPOINT=https://platform.iostack.ai
IOSTACK_ACCESS_KEY=iosk-ucst-dev-....

```
## Run tests
```
npm test
```

## Tests

The ./src/__tests__/client.integrations.test.ts file contains jest tests that demonstrate how to use the js/ts client, including:

1. Creating and running a session using the client
2. Continuing a previously initialised session using session ID and access key
3. Standalone/server initiated session initialisation followed by starting a client to run the session


## Building client using webpack
Use webpack to build a standalone client js file in ./dist 
```
npm run build
```