import { IOStackClient } from '../iostack_client';
import { StreamFragmentPacket } from '../notifications';

const HAS_E2E = !!process.env.IOSTACK_PLATFORM_ENDPOINT && !!process.env.IOSTACK_ACCESS_KEY;
const describeIf = (b: boolean) => (b ? describe : describe.skip);

describeIf(HAS_E2E)('IOStack client (integration)', () => {

    jest.setTimeout(60_000);

    test('start session and read response', async () => {

        const client = new IOStackClient({
            platform_root: process.env.IOSTACK_PLATFORM_ENDPOINT!,
            access_key: process.env.IOSTACK_ACCESS_KEY!,
            response_timeout: 180
        });

        const errors: string[] = []
        var response = ""
        var finalSeen = false

        client.addStreamFragmentHandler(async (fragment: StreamFragmentPacket) => {
            response = response + fragment.fragment
            if (fragment.final) {
                finalSeen = true
            }
        })

        client.addErrorHandler(async (error: string) => {
            errors.push(error)
        })

        try {
            await client.startSession();
            await client.sendMessage("Hey - whats up?")
        }
        catch (e: any) {
            errors.push(e.toString())
        }

        expect(errors.length).toBeLessThan(1);
        expect(response).toBeTruthy();
        expect(finalSeen).toBeTruthy();

    });

    test('create session via API then run client using session Id and access key', async () => {

        const sessionResponse = await establishSessionViaAPI(
            process.env.IOSTACK_ACCESS_KEY!,
            process.env.IOSTACK_PLATFORM_ENDPOINT!
        )

        const client = new IOStackClient({
            platform_root: process.env.IOSTACK_PLATFORM_ENDPOINT!,
            access_key: process.env.IOSTACK_ACCESS_KEY!,
            response_timeout: 180,  // Optional - default is 60 secs
            //
            // If your plan allows, you can configure the new session here
            // with externally initialised vars and user_id 
            //
            // use_case_data: {
            //     my_externally_initialised_var: "test value"
            // },
            // user_id: "external user id"
        });

        const errors: string[] = []
        var response = ""
        var finalSeen = false

        client.addStreamFragmentHandler(async (fragment: StreamFragmentPacket) => {
            response = response + fragment.fragment
            if (fragment.final) {
                finalSeen = true
            }
        })

        client.addErrorHandler(async (error: string) => {
            errors.push(error)
        })

        try {
            await client.startSession(sessionResponse.sessionId);
        }
        catch (e: any) {
            errors.push(e.toString())
        }

        expect(errors.length).toBeLessThan(1);
        expect(response).toBeTruthy();
        expect(finalSeen).toBeTruthy();

    });

    test('create session and run client then continue session with a new client', async () => {

        const clientA = new IOStackClient({
            platform_root: process.env.IOSTACK_PLATFORM_ENDPOINT!,
            access_key: process.env.IOSTACK_ACCESS_KEY!,
            response_timeout: 180
        });

        const aErrors: string[] = []
        var response = ""
        var finalSeen = false

        clientA.addStreamFragmentHandler(async (fragment: StreamFragmentPacket) => {
            response = response + fragment.fragment
            if (fragment.final) {
                finalSeen = true
            }
        })

        clientA.addErrorHandler(async (error: string) => {
            aErrors.push(error)
        })

        try {
            await clientA.startSession();
        }
        catch (e: any) {
            aErrors.push(e.toString())
        }

        expect(aErrors.length).toBeLessThan(1);
        expect(response).toBeTruthy();
        expect(finalSeen).toBeTruthy();

        const clientB = new IOStackClient({
            platform_root: process.env.IOSTACK_PLATFORM_ENDPOINT!,
            access_key: process.env.IOSTACK_ACCESS_KEY!,
            response_timeout: 180
        });

        const bErrors: string[] = []
        var bResponse = ""
        var bFinalSeen = false

        clientB.addStreamFragmentHandler(async (fragment: StreamFragmentPacket) => {
            bResponse = bResponse + fragment.fragment
            if (fragment.final) {
                bFinalSeen = true
            }
        })

        clientB.addErrorHandler(async (error: string) => {
            aErrors.push(error)
        })

        try {
            await clientB.restartSession(clientA.getSessionId()!);
            await clientB.sendMessage("Ok - carrying on from where we left off!")
        }
        catch (e: any) {
            aErrors.push(e.toString())
        }

        expect(bErrors.length).toBeLessThan(1);
        expect(bResponse).toBeTruthy();
        expect(bFinalSeen).toBeTruthy();

        
    });    
});



async function establishSessionViaAPI(
    accessKey: string, 
    platformRoot: string
): Promise<{
    sessionId: string, 
    refreshToken: string, 
    accessToken: string, 
    triggerPhrase: string
}> {

    console.log('Establishing session');

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${accessKey}`);

    const postBody = {
        use_case_id: accessKey,
        //
        // If your plan allows, you can configure the new session here
        // with externally initialised vars and user_id 
        //
        // client_data: {
        //     my_externally_initialised_var: "test value"
        // },
        // user_id: "external user id"        
        client_data: undefined,
        user_id: undefined,
    };

    const url = `${platformRoot}/v2/use_case/session`;

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(postBody),
    });

    if (!response.ok) {
        const error = await response.json();
        const errorText = `${response.statusText}:${error.message || error.detail}`;
        throw new Error(errorText);
    }

    const body = await response.json();

    return {
        sessionId: body.session_id,
        refreshToken: body.refresh_token,
        accessToken: body.access_token,
        triggerPhrase: body.trigger_phrase
    }

}