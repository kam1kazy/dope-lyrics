export const handler = async function (event, context) {
  console.log('Hello world handler called!')
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ msg: 'Hello world' }),
  }
}
