# js-client
Typescript/Javascript Client for interacting with iostack inference service


## Install and use NPM package

### Install package
```
npm add @iostack/js-client
```

### Use
```javascript

    import {
        IOStackClient,
        StreamFragmentPacket,
    } from "@iostack/js-client";

    const client = new IOStackClient({
        platform_root: "https://platform.iostack.ai",
        access_key: "iosk-ucst-dev-6C2...",
        response_timeout: 180
    });

    var response = "";

    client.addStreamFragmentHandler(async (fragment: StreamFragmentPacket) => {
        response = response + fragment.fragment
        if (fragment.final) {
            console.log(response)
            response = "";
        }
    })

    client.addErrorHandler(async (error: string) => {
        console.error(error)
    })

    try {
        await client.startSession();
        await client.sendMessage("Hi! What can you help me with?")
    }
    catch (e: any) {
        console.error(e.toString())
    }
```

## Install and use repo

* Clone repo
```
git clone https://github.com/iostack-org/js-client.git
```

* ```cd``` into cloned repo
* Install package dependencies
```
npm install
```

* Add a ```.env``` file
```
IOSTACK_PLATFORM_ENDPOINT=https://platform.iostack.ai
IOSTACK_ACCESS_KEY=iosk-ucst-dev-....
```


### Build 
Build uses webpack to build a standalone client js file in ./dist 
```
npm run build
```

### Run tests
```
npm test
```

### Tests

The ./src/__tests__/client.integrations.test.ts file contains jest tests that demonstrate how to use the js/ts client, including:

1. Creating and running a session using the client
2. Continuing a previously initialised session using session ID and access key
3. Standalone/server initiated session initialisation followed by starting a client to run the session


