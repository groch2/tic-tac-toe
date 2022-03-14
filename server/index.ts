import Express from 'express'

const app = Express()
const port = 3000

app.get('/', (_: Express.Request, res: Express.Response) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
