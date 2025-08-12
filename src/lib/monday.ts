// Monday.com API integration for contact/lead management
// Based on volteus-v02 implementation

interface MondayColumnValue {
  id: string
  text: string | null
}

interface MondayItem {
  id: string
  column_values: MondayColumnValue[]
}

export interface Contact {
  monday_item_id: number
  first_name: string | null
  last_name: string | null
  title: string | null
  company: string | null
  email: string | null
  phone: string | null
  type: string | null
}

const API_URL = 'https://api.monday.com/v2'

export async function fetchContacts(): Promise<Contact[]> {
  // Debug: log all environment variables
  console.log('All MONDAY env vars:', Object.keys(process.env).filter(key => key.includes('MONDAY')))
  console.log('Checking for:', ['MONDAY_CONTACTS_BOARD_ID', 'MONDAY_API_KEY'])
  
  const boardId = process.env.MONDAY_CONTACTS_BOARD_ID
  const apiKey  = process.env.MONDAY_API_KEY
  
  console.log('Monday.com env check:', {
    boardId: boardId ? `present (${boardId?.slice(0, 10)}...)` : 'missing',
    apiKey: apiKey ? `present (${apiKey?.slice(0, 10)}...)` : 'missing',
    boardIdLength: boardId?.length,
    apiKeyLength: apiKey?.length
  })
  
  if (!boardId || !apiKey) {
    throw new Error(`Missing Monday.com env vars: boardId=${!!boardId}, apiKey=${!!apiKey}`)
  }

  const query = `
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page {
          items {
            id
            column_values {
              id
              text
            }
          }
        }
      }
    }
  `

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query,
      variables: { boardId: boardId },
    }),
  })

  const json = await res.json();

  if (json.errors) {
    console.error('Monday.com GraphQL errors:', JSON.stringify(json.errors, null, 2));
  }
  console.log('Monday.com raw data item count:', json.data?.boards?.[0]?.items_page?.items?.length || 0);
  const items: MondayItem[] = json.data?.boards?.[0]?.items_page?.items || []

  const mapCol = (cols: MondayColumnValue[], id: string) =>
    cols.find((c) => c.id === id)?.text || null

  return items.map((item) => ({
    monday_item_id: Number(item.id),
    first_name: mapCol(item.column_values, 'text_mkpw4ym4'),
    last_name: mapCol(item.column_values, 'text_mkpwcsbq'),
    title:      mapCol(item.column_values, 'title5'),
    company:    mapCol(item.column_values, 'text8'),
    email:      mapCol(item.column_values, 'contact_email'),
    phone:      mapCol(item.column_values, 'contact_phone'),
    type:       mapCol(item.column_values, 'status'),
  }))
}
