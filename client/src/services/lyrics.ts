import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query AllLyrics($limit: Int, $offset: Int) {
          lyrics(limit: $limit, offset: $offset) {
            id
            lyricId
            date
          }
        }
      `,
      variables: { limit: 500, offset: 0 },
    }),
  });
  const data = await response.json();
  res.status(200).json(data);
}