
import { 
  IOStackClient, 
  LLMStatsPacket, 
  StreamFragmentPacket, 
  UseCaseNotificationPacket 
} from "./iostack_client";

/***
 * This test requires the server in question to be either using legit HTTPS certs or to be accepting http 
 * (port 80) requests - this is due to the browser fetch() logic being tested using the node fetch() implementation
 * which refuses to accept self-signed certs. We can't use node-fetch as the fetch code is embedded in the code
 * its testing and I haven't got around to abstracting or injecting a browser/server portable fetch implementation
 ***/

test("iostack Client executes", async () => {

  const client = new IOStackClient( {
    access_key: process.env.USE_CASE_ACCESS_KEY || "",
    use_case_data: {
      textval: "a",
      intval: 1,
      IntListVar: [1, 2, 3, 4],
      TestListVar: ["a", "b", "c"]
    },
    allow_browser_to_manage_tokens: false,
    use_case: "",
    platform_root: process.env.IOSTACK_PLATFORM_ENDPOINT
  })


  let streamFragmentHandlerUsed = false
  let llmStatsHandlerUsed = false
  let errorSeen = false
  let useCaseNotificationSeen = false

  client.registerStreamFragmentHandler(async (p: StreamFragmentPacket) => {
    streamFragmentHandlerUsed = true
  })
  client.registerLLMStatsHandler(async (p: LLMStatsPacket) => {
    llmStatsHandlerUsed = true
  })
  client.registerErrorHandler(async (e: string) => {
    console.error(e)
    errorSeen = true
  })
  client.registerUseCaseNotificationHandler(async (p: UseCaseNotificationPacket) => {
    useCaseNotificationSeen = true
  })
  
  await client.startSession()
  await client.sendMessageAndStreamResponse("Hi there!")

  expect(errorSeen).toBe(false)
  expect(streamFragmentHandlerUsed).toBe(true)
  expect(llmStatsHandlerUsed).toBe(true)
  expect(useCaseNotificationSeen).toBe(true)

}, 15000);

